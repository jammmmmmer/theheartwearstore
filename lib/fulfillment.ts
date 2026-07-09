/**
 * Shared fulfillment logic: submit a recorded (paid) order to Printify.
 *
 * Used by both Stripe webhook handlers and the admin resubmit endpoint,
 * so there is exactly one code path from "order in Supabase" to
 * "order in Printify".
 *
 * Guarantees:
 * - Idempotent: refuses to submit an order that already has a
 *   printify_order_id or has progressed past 'paid'/'failed'.
 * - On failure: marks the order 'failed' and emails the owner —
 *   a paid order must never fail silently.
 */

import { supabaseAdmin } from './supabase'
import { createOrder } from './printify'
import { sendOwnerAlert } from './alert-email'
import { sendOrderConfirmationEmail } from './customer-email'
import { isExpressAmount } from './currency'
import type { ShippingAddress } from '@/types'

/**
 * Printify shipping_method: 1 = standard, 2 = priority/express.
 * Currency-agnostic: matches the express amount in any supported currency.
 */
export function shippingMethodFromAmount(amountCents: number | null | undefined): number {
  return isExpressAmount(amountCents) ? 2 : 1
}

export interface FulfillmentLineItem {
  printify_id: string
  variant_id: number
  quantity: number
  /** Unit price in the order's currency (cents) — used for artist commission */
  price?: number
}

export interface SubmitOrderParams {
  orderId: string
  items: FulfillmentLineItem[]
  address: ShippingAddress
  customerName: string
  customerEmail: string
  phone?: string
  shippingMethod: number
}

export interface SubmitOrderResult {
  submitted: boolean
  printifyOrderId?: string
  reason?: string
}

/**
 * Records artist commissions for a submitted order — one ledger row per
 * line item whose product has an attributed artist. Never throws.
 * Idempotent via the (order_id, printify_product_id) unique constraint.
 */
async function accrueArtistEarnings(
  orderId: string,
  items: FulfillmentLineItem[]
): Promise<void> {
  try {
    const db = supabaseAdmin()

    const { data: order } = await db
      .from('orders')
      .select('currency')
      .eq('id', orderId)
      .single()
    const currency = order?.currency ?? 'cad'

    const ids = Array.from(new Set(items.map((i) => i.printify_id)))
    const { data: products } = await db
      .from('products')
      .select('printify_id, artist_id')
      .in('printify_id', ids)
      .not('artist_id', 'is', null)
    if (!products?.length) return

    const artistIds = Array.from(new Set(products.map((p) => p.artist_id as string)))
    const { data: artists } = await db
      .from('artists')
      .select('id, commission_pct')
      .in('id', artistIds)
    const pctById = new Map((artists ?? []).map((a) => [a.id, Number(a.commission_pct)]))
    const artistByProduct = new Map(products.map((p) => [String(p.printify_id), p.artist_id as string]))

    const rows = []
    for (const item of items) {
      const artistId = artistByProduct.get(String(item.printify_id))
      if (!artistId || !item.price) continue
      const pct = pctById.get(artistId) ?? 10
      const itemAmount = item.price * item.quantity
      rows.push({
        artist_id: artistId,
        order_id: orderId,
        printify_product_id: String(item.printify_id),
        quantity: item.quantity,
        item_amount: itemAmount,
        commission_pct: pct,
        commission_amount: Math.round((itemAmount * pct) / 100),
        currency,
        status: 'accrued',
      })
    }
    if (!rows.length) return

    const { error } = await db
      .from('artist_earnings')
      .upsert(rows, { onConflict: 'order_id,printify_product_id', ignoreDuplicates: true })
    if (error) {
      console.warn('[fulfillment] Earnings accrual failed (non-fatal):', error.message)
    } else {
      console.log(`[fulfillment] Accrued ${rows.length} artist commission row(s) for order ${orderId}`)
    }
  } catch (err) {
    console.warn('[fulfillment] Earnings accrual error (non-fatal):', err)
  }
}

export async function submitOrderToPrintify(
  params: SubmitOrderParams
): Promise<SubmitOrderResult> {
  const { orderId, items, address, customerName, customerEmail, phone, shippingMethod } = params
  const db = supabaseAdmin()

  // ── Idempotency guard ────────────────────────────────────────────────
  const { data: order, error: fetchError } = await db
    .from('orders')
    .select('id, status, printify_order_id')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { submitted: false, reason: `Order ${orderId} not found: ${fetchError?.message}` }
  }
  if (order.printify_order_id) {
    console.log(`[fulfillment] Order ${orderId} already submitted (${order.printify_order_id}) — skipping`)
    return { submitted: false, reason: 'already_submitted', printifyOrderId: order.printify_order_id }
  }
  const submittable = ['pending', 'paid', 'failed']
  if (!submittable.includes(order.status)) {
    console.log(`[fulfillment] Order ${orderId} status is '${order.status}' — skipping`)
    return { submitted: false, reason: `status_${order.status}` }
  }

  const shopId = process.env.PRINTIFY_SHOP_ID
  if (!shopId) {
    return { submitted: false, reason: 'PRINTIFY_SHOP_ID not configured' }
  }
  if (!items.length) {
    return { submitted: false, reason: 'no line items' }
  }

  const nameParts = customerName.trim().split(' ')
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ') || firstName

  try {
    const printifyOrder = await createOrder(shopId, {
      external_id: orderId,
      label: `Heartwear Order #${orderId.slice(0, 8).toUpperCase()}`,
      line_items: items.map((item) => ({
        product_id: item.printify_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),
      shipping_method: shippingMethod,
      send_shipping_notification: true,
      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: customerEmail,
        phone: phone || address.phone || undefined,
        country: address.country,
        region: address.state,
        address1: address.line1,
        address2: address.line2,
        city: address.city,
        zip: address.postal_code,
      },
    })

    const { error: updateError } = await db
      .from('orders')
      .update({ printify_order_id: printifyOrder.id, status: 'submitted' })
      .eq('id', orderId)

    // Customer confirmation email (non-fatal)
    await sendOrderConfirmationEmail({
      to: customerEmail,
      name: customerName,
      orderRef: orderId.slice(0, 8).toUpperCase(),
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    })

    // Artist commission accrual (non-fatal)
    await accrueArtistEarnings(orderId, items)

    if (updateError) {
      // Printify HAS the order — flag loudly so status sync gets repaired
      console.error(`[fulfillment] Order ${orderId} submitted to Printify (${printifyOrder.id}) but DB update failed:`, updateError)
      await sendOwnerAlert(
        `DB update failed after Printify submission — order ${orderId}`,
        `<p>Printify order <strong>${printifyOrder.id}</strong> was created but the Supabase order row could not be updated. Fix manually to avoid double submission.</p>`
      )
    }

    return { submitted: true, printifyOrderId: printifyOrder.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[fulfillment] Failed to submit order ${orderId} to Printify:`, message)

    await db.from('orders').update({ status: 'failed' }).eq('id', orderId)

    // A paid order that didn't reach Printify must never fail silently
    await sendOwnerAlert(
      `Order submission FAILED — ${orderId.slice(0, 8).toUpperCase()}`,
      `<p>A <strong>paid</strong> order could not be submitted to Printify.</p>
       <p><strong>Order:</strong> ${orderId}<br>
       <strong>Customer:</strong> ${customerEmail}<br>
       <strong>Error:</strong> ${message}</p>
       <p>Retry with: <code>POST /api/admin/resubmit-order</code> (Bearer SYNC_SECRET) with body <code>{"orderId": "${orderId}"}</code>, or resubmit all failed orders with an empty body.</p>`
    )

    return { submitted: false, reason: message }
  }
}
