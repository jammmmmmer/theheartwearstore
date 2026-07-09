/**
 * Dual-currency support: CAD (canonical) + USD (derived).
 *
 * All stored prices (Supabase products.variants[].price) remain CAD cents.
 * USD prices are derived deterministically via a configurable FX rate with
 * .99 charm rounding — the SAME function runs on client (display) and server
 * (checkout verification), so amounts always agree.
 *
 * Isomorphic: no server-only imports. NEXT_PUBLIC_USD_FX_RATE is public
 * (not a secret) so both bundles see the same rate. Update it in Netlify env
 * when the exchange rate drifts; in-flight carts re-verify server-side.
 */

export type Currency = 'cad' | 'usd'

export const DEFAULT_CURRENCY: Currency = 'cad'

const USD_FX_RATE = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_USD_FX_RATE ?? '0.75')
  // Sanity clamp: a mis-set env var must never produce free or 10x products
  return raw >= 0.4 && raw <= 1.2 ? raw : 0.75
})()

export function toCurrency(value: unknown): Currency {
  return value === 'usd' ? 'usd' : 'cad'
}

/** CAD cents → USD cents with .99 charm rounding (e.g. 3999 → 2999). */
export function cadToUsd(cadCents: number): number {
  const raw = cadCents * USD_FX_RATE
  return Math.max(99, Math.round(raw / 100) * 100 - 1)
}

export function priceInCurrency(cadCents: number, currency: Currency): number {
  return currency === 'usd' ? cadToUsd(cadCents) : cadCents
}

/** Flat shipping rates per currency (cents). */
export const SHIPPING_RATES: Record<Currency, { standard: number; express: number }> = {
  cad: { standard: 799, express: 1499 },
  usd: { standard: 599, express: 1099 },
}

/**
 * True if the given amount is an express-shipping charge in ANY supported
 * currency. Safe because standard and express amounts never collide.
 */
export function isExpressAmount(cents: number | null | undefined): boolean {
  const n = Number(cents)
  return n === SHIPPING_RATES.cad.express || n === SHIPPING_RATES.usd.express
}

/**
 * Format cents for display. Locale 'en' renders CAD as "CA$39.99" and USD as
 * "$39.99" — visually unambiguous when toggling.
 */
export function formatMoney(cents: number, currency: Currency): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}
