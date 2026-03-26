import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { createOrder } from '@/lib/printify'
import { CartItem, ShippingAddress } from '@/types'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let event: Stripe.Event

  try {
    const rawBody = await request.arrayBuffer()
    const body = Buffer.from(rawBody)
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Always return 200 to Stripe to prevent retries on business logic errors
  if (event.type === 'checkout.session.completed') {
    await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const db = supabaseAdmin()

  try {
    // Retrieve the full session with shipping details
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'shipping_cost.shipping_rate'],
    })

    // Parse items from metadata
    let items: CartItem[] = []
    try {
      items = JSON.parse(session.metadata?.items ?? '[]') as CartItem[]
    } catch {
      console.error('Failed to parse cart items from session metadata')
      items = []
    }

    // Build shipping address
    const shipping = fullSession.shipping_details
    const shippingAddress: ShippingAddress = {
      line1: shipping?.address?.line1 ?? '',
      line2: shipping?.address?.line2 ?? undefined,
      city: shipping?.address?.city ?? '',
      state: shipping?.address?.state ?? '',
      postal_code: shipping?.address?.postal_code ?? '',
      country: shipping?.address?.country ?? '',
    }

    // Split customer name
    const customerName = shipping?.name ?? session.customer_details?.name ?? ''
    const nameParts = customerName.trim().split(' ')
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts.slice(1).join(' ') || firstName

    const customerEmail =
      session.customer_email ??
      session.customer_details?.email ??
      ''

    const totalAmount = fullSession.amount_total ?? 0

    // Insert order into Supabase
    const { data: orderData, error: orderError } = await db
      .from('orders')
      .insert({
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_address: shippingAddress,
        line_items: items,
        total_amount: totalAmount,
        currency: session.currency ?? 'cad',
        status: 'paid',
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('Failed to insert order into Supabase:', orderError)
      return
    }

    const orderId = orderData?.id as string

    // Submit order to Printify
    const shopId = process.env.PRINTIFY_SHOP_ID
    if (!shopId) {
      console.error('PRINTIFY_SHOP_ID not configured — skipping Printify order creation')
      return
    }

    if (items.length === 0) {
      console.warn('No line items found in order — skipping Printify order')
      return
    }

    try {
      const printifyOrder = await createOrder(shopId, {
        external_id: orderId,
        label: `Heartwear Order #${orderId.slice(0, 8).toUpperCase()}`,
        line_items: items.map((item) => ({
          product_id: item.printify_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        shipping_method: 1, // standard
        send_shipping_notification: true,
        address_to: {
          first_name: firstName,
          last_name: lastName,
          email: customerEmail,
          country: shippingAddress.country,
          region: shippingAddress.state,
          address1: shippingAddress.line1,
          address2: shippingAddress.line2,
          city: shippingAddress.city,
          zip: shippingAddress.postal_code,
        },
      })

      // Update order with Printify ID
      const { error: updateError } = await db
        .from('orders')
        .update({
          printify_order_id: printifyOrder.id,
          status: 'submitted',
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order with Printify ID:', updateError)
      }
    } catch (printifyErr) {
      console.error('Failed to create Printify order:', printifyErr)

      // Update order status to reflect submission failure
      await db
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId)
    }
  } catch (err) {
    console.error('Error handling checkout.session.completed:', err)
  }
}
