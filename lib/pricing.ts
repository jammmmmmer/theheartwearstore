/**
 * Server-side price verification.
 *
 * Checkout amounts must NEVER be taken from the browser. These helpers
 * re-derive the authoritative unit price (in cents) from the Supabase
 * `products` cache (which mirrors Printify) by printify_id + variant_id.
 */

import { supabaseAdmin } from './supabase'
import { Currency, priceInCurrency, SHIPPING_RATES } from './currency'
import type { PrintifyVariant, PrintifyImage } from '@/types'

export interface RequestedItem {
  printify_id: string
  variant_id: number
  quantity: number
}

export interface VerifiedItem {
  printify_id: string
  variant_id: number
  quantity: number
  unit_amount: number // cents in the requested currency, from DB — not the client
  title: string
  variant_title: string
  image: string
}

const MAX_QTY_PER_LINE = 20

export class PriceVerificationError extends Error {}

/**
 * Validates every requested item against the products table and returns
 * server-priced line items in the requested currency. Throws
 * PriceVerificationError on any mismatch (unknown product, disabled
 * product/variant, bad quantity).
 */
export async function verifyCartItems(
  requested: RequestedItem[],
  currency: Currency = 'cad'
): Promise<VerifiedItem[]> {
  if (!requested.length) throw new PriceVerificationError('No items to verify')

  const ids = Array.from(new Set(requested.map((i) => i.printify_id)))
  const { data: products, error } = await supabaseAdmin()
    .from('products')
    .select('printify_id, title, variants, images, is_enabled')
    .in('printify_id', ids)

  if (error) throw new PriceVerificationError(`Product lookup failed: ${error.message}`)

  const byId = new Map(
    (products ?? []).map((p) => [String(p.printify_id), p])
  )

  return requested.map((item) => {
    const quantity = Math.floor(Number(item.quantity))
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
      throw new PriceVerificationError(`Invalid quantity for ${item.printify_id}`)
    }

    const product = byId.get(String(item.printify_id))
    if (!product || product.is_enabled !== true) {
      throw new PriceVerificationError(`Product not available: ${item.printify_id}`)
    }

    const variants = (product.variants ?? []) as PrintifyVariant[]
    const variant = variants.find((v) => v.id === Number(item.variant_id))
    if (!variant || !variant.is_enabled) {
      throw new PriceVerificationError(
        `Variant ${item.variant_id} not available for ${item.printify_id}`
      )
    }
    if (!Number.isFinite(variant.price) || variant.price <= 0) {
      throw new PriceVerificationError(
        `Stored price invalid for variant ${item.variant_id}`
      )
    }

    const images = (product.images ?? []) as PrintifyImage[]
    const image = images.find((img) => img.is_default)?.src ?? images[0]?.src ?? ''

    return {
      printify_id: String(item.printify_id),
      variant_id: Number(item.variant_id),
      quantity,
      unit_amount: priceInCurrency(variant.price, currency),
      title: product.title as string,
      variant_title: variant.title,
      image,
    }
  })
}

/** Validates a shipping amount against the flat rates for the currency. */
export function verifyShippingAmount(amount: unknown, currency: Currency = 'cad'): number {
  const n = Number(amount)
  const rates = SHIPPING_RATES[currency]
  if (n === rates.standard || n === rates.express) return n
  throw new PriceVerificationError('Invalid shipping amount')
}
