/**
 * Shipping quotes: pass-through of Printify's real shipping costs.
 *
 * Standard shipping = what Printify charges us for the destination country
 * (first item + per-additional-item), converted from USD to the shopper's
 * currency and rounded UP to the nearest 25¢. Express remains a flat rate.
 *
 * Data comes from catalog_items.shipping (cached from Printify's catalog
 * shipping API at /api/admin/catalog-sync time). If no data is cached yet,
 * quotes fall back to the original flat rates so checkout never breaks.
 */

import { supabaseAdmin } from './supabase'
import { Currency, SHIPPING_RATES } from './currency'
import type { CatalogShipping } from './printify'

export interface ShippingQuote {
  standard: number // cents in `currency`
  express: number
  currency: Currency
  source: 'printify' | 'flat_fallback'
}

/** CAD→USD display rate; reused inversely to price USD costs in CAD. */
const USD_FX_RATE = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_USD_FX_RATE ?? '0.75')
  return raw >= 0.4 && raw <= 1.2 ? raw : 0.75
})()

/** Convert Printify's USD cost cents into the charged currency, rounded up to 25¢. */
function usdCostToCurrency(usdCents: number, currency: Currency): number {
  const raw = currency === 'usd' ? usdCents : usdCents / USD_FX_RATE
  return Math.ceil(raw / 25) * 25
}

function pickProfile(shipping: CatalogShipping, country: string) {
  const upper = country.toUpperCase()
  return (
    shipping.profiles?.find((p) => p.countries?.includes(upper)) ??
    shipping.profiles?.find((p) => p.countries?.includes('REST_OF_THE_WORLD')) ??
    null
  )
}

/**
 * Quote standard + express shipping for a cart.
 * @param country destination ISO code ("CA" | "US" | ...)
 * @param totalQuantity total units in the cart
 */
export async function getShippingQuote(
  country: string,
  currency: Currency,
  totalQuantity: number
): Promise<ShippingQuote> {
  const qty = Math.max(1, Math.floor(Number(totalQuantity) || 1))
  const flat: ShippingQuote = {
    standard: SHIPPING_RATES[currency].standard,
    express: SHIPPING_RATES[currency].express,
    currency,
    source: 'flat_fallback',
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from('catalog_items')
      .select('shipping')
      .eq('is_enabled', true)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data?.shipping) return flat

    const profile = pickProfile(data.shipping as CatalogShipping, country)
    if (!profile?.first_item?.cost) return flat

    const usdTotal =
      profile.first_item.cost +
      (profile.additional_items?.cost ?? 0) * (qty - 1)

    return {
      standard: usdCostToCurrency(usdTotal, currency),
      express: SHIPPING_RATES[currency].express, // flat until per-provider express data is wired
      currency,
      source: 'printify',
    }
  } catch (err) {
    console.warn('[shipping] Quote failed, using flat fallback:', err)
    return flat
  }
}

/**
 * Validates a client-submitted shipping amount against a fresh server-side
 * quote. Returns the amount if it matches standard or express, else null.
 */
export async function validateShippingAmount(
  amount: unknown,
  country: string,
  currency: Currency,
  totalQuantity: number
): Promise<number | null> {
  const n = Number(amount)
  const quote = await getShippingQuote(country, currency, totalQuantity)
  if (n === quote.standard || n === quote.express) return n
  // Grace: quotes shift if catalog-sync ran mid-session — accept flat rates too
  const flat = SHIPPING_RATES[currency]
  if (n === flat.standard || n === flat.express) return n
  return null
}
