/**
 * POST /api/admin/resubmit-order
 * Re-attempts Printify submission for paid orders that failed.
 * Protected by Bearer SYNC_SECRET (server-to-server).
 *
 * Body: { "orderId": "<uuid>" }  → resubmit one order
 *       {}                       → resubmit ALL orders with status 'failed'
 *
 * Safe to call repeatedly: submitOrderToPrintify refuses orders that already
 * have a printify_order_id or have progressed past paid/failed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { submitOrderToPrintify, shippingMethodFromAmount, FulfillmentLineItem } from '@/lib/fulfillment'
import type { CartItem, ShippingAddress } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

interface OrderRow {
  id: string
  status: string
  printify_order_id: string | null
  customer_email: string
  customer_name: string
  shipping_address: ShippingAddress
  line_items: CartItem[]
  total_amount: number
}

function toLineItems(items: CartItem[]): FulfillmentLineItem[] {
  return (items ?? []).map((i) => ({
    printify_id: i.printify_id,
    variant_id: i.variant_id,
    quantity: i.quantity,
    price: i.price, // keeps artist commission accrual working on resubmits
  }))
}

/**
 * Recover the shipping method the customer paid for: with no taxes charged,
 * total − items subtotal = shipping amount (799 standard / 1499 express).
 */
function inferShippingMethod(order: OrderRow): number {
  const subtotal = (order.line_items ?? []).reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0
  )
  return shippingMethodFromAmount(order.total_amount - subtotal)
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { orderId?: string }
    const db = supabaseAdmin()

    let query = db
      .from('orders')
      .select('id, status, printify_order_id, customer_email, customer_name, shipping_address, line_items, total_amount')
      .is('printify_order_id', null)

    if (body.orderId) {
      query = query.eq('id', body.orderId)
    } else {
      query = query.eq('status', 'failed')
    }

    const { data: orders, error } = await query
    if (error) {
      return NextResponse.json({ error: `Query failed: ${error.message}` }, { status: 500 })
    }
    if (!orders?.length) {
      return NextResponse.json({ ok: true, message: 'No matching unsubmitted orders', results: [] })
    }

    const results = []
    for (const order of orders as OrderRow[]) {
      const result = await submitOrderToPrintify({
        orderId: order.id,
        items: toLineItems(order.line_items),
        address: order.shipping_address,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        phone: order.shipping_address?.phone,
        shippingMethod: inferShippingMethod(order),
      })
      results.push({ orderId: order.id, ...result })
    }

    return NextResponse.json({ ok: true, count: results.length, results })
  } catch (err) {
    console.error('[resubmit-order] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
