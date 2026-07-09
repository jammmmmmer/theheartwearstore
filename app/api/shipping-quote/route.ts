/**
 * GET /api/shipping-quote?country=CA&currency=cad&qty=2
 * Public, read-only: returns { standard, express, currency, source } in cents.
 * Used by the wallet-pay sheet to show real destination-based rates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getShippingQuote } from '@/lib/shipping'
import { toCurrency } from '@/lib/currency'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const country = (params.get('country') ?? 'CA').slice(0, 2)
  const currency = toCurrency(params.get('currency'))
  const qty = Math.min(100, Math.max(1, Number(params.get('qty')) || 1))

  const quote = await getShippingQuote(country, currency, qty)
  return NextResponse.json(quote, { headers: { 'Cache-Control': 'no-store' } })
}
