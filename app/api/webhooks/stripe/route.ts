import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { submitOrderToPrintify, shippingMethodFromAmount } from '@/lib/fulfillment'
import { CartItem, ShippingAddress } from '@/types'
import Stripe from 'stripe'

export const runtime = 'nodejs'

/** Postgres unique-violation — means this webhook event was already processed */
const UNIQUE_VIOLATION = '23505'

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
  } else if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    // Only handle Apple Pay / direct PaymentIntent payments (not from Checkout Sessions)
    if (pi.metadata?.source === 'theheartwearstore_applepay') {
      await handlePaymentIntentSucceeded(pi)
    }
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

    // Build shipping address (phone collected via phone_number_collection)
    const shipping = fullSession.shipping_details
    const phone = fullSession.customer_details?.phone ?? undefined
    const shippingAddress: ShippingAddress = {
      line1: shipping?.address?.line1 ?? '',
      line2: shipping?.address?.line2 ?? undefined,
      city: shipping?.address?.city ?? '',
      state: shipping?.address?.state ?? '',
      postal_code: shipping?.address?.postal_code ?? '',
      country: shipping?.address?.country ?? '',
      phone,
    }

    const customerName = shipping?.name ?? session.customer_details?.name ?? ''
    const customerEmail =
      session.customer_email ??
      session.customer_details?.email ??
      ''

    const totalAmount = fullSession.amount_total ?? 0

    // Map the shipping option the customer actually paid for to Printify's
    // method (1 = standard, 2 = express) — previously hardcoded to standard.
    const shippingMethod = shippingMethodFromAmount(fullSession.shipping_cost?.amount_total)

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
      if (orderError.code === UNIQUE_VIOLATION) {
        console.log(`[stripe-webhook] Duplicate delivery for session ${session.id} — order already recorded, skipping`)
      } else {
        console.error('Failed to insert order into Supabase:', orderError)
      }
      return
    }

    await submitOrderToPrintify({
      orderId: orderData.id as string,
      items,
      address: shippingAddress,
      customerName,
      customerEmail,
      phone,
      shippingMethod,
    })
  } catch (err) {
    console.error('Error handling checkout.session.completed:', err)
  }
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const db = supabaseAdmin()

  try {
    let items: CartItem[] = []
    try {
      items = JSON.parse(pi.metadata?.items ?? '[]') as CartItem[]
    } catch {
      console.error('Failed to parse items from PaymentIntent metadata')
      return
    }

    const charge = pi.latest_charge
      ? await stripe.charges.retrieve(typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge.id, { expand: ['billing_details'] })
      : null

    // SHIPPING FIX: use the shipping address attached to the PaymentIntent
    // (set by /api/payment-intent from the wallet sheet). Billing details are
    // only a fallback — previously wallet orders shipped to the billing
    // address, which is wrong whenever the two differ.
    const shippingSource = pi.shipping?.address ?? charge?.billing_details?.address ?? null
    if (!pi.shipping?.address) {
      console.warn(`[stripe-webhook] PaymentIntent ${pi.id} has no shipping address — falling back to billing address`)
    }

    const customerName =
      pi.shipping?.name ?? charge?.billing_details?.name ?? ''
    const customerEmail = pi.receipt_email ?? charge?.billing_details?.email ?? ''
    const phone = pi.shipping?.phone ?? charge?.billing_details?.phone ?? undefined

    const shippingAddress: ShippingAddress = {
      line1: shippingSource?.line1 ?? '',
      line2: shippingSource?.line2 ?? undefined,
      city: shippingSource?.city ?? '',
      state: shippingSource?.state ?? '',
      postal_code: shippingSource?.postal_code ?? '',
      country: shippingSource?.country ?? '',
      phone,
    }

    const { data: orderData, error: orderError } = await db
      .from('orders')
      .insert({
        stripe_payment_intent_id: pi.id,
        customer_email: customerEmail,
        customer_name: customerName,
        shipping_address: shippingAddress,
        line_items: items,
        total_amount: pi.amount,
        currency: pi.currency,
        status: 'paid',
      })
      .select('id')
      .single()

    if (orderError) {
      if (orderError.code === UNIQUE_VIOLATION) {
        console.log(`[stripe-webhook] Duplicate delivery for PaymentIntent ${pi.id} — order already recorded, skipping`)
      } else {
        console.error('Failed to insert Apple Pay order:', orderError)
      }
      return
    }

    await submitOrderToPrintify({
      orderId: orderData.id as string,
      items,
      address: shippingAddress,
      customerName,
      customerEmail,
      phone,
      shippingMethod: shippingMethodFromAmount(Number(pi.metadata?.shipping_amount)),
    })
  } catch (err) {
    console.error('Error handling payment_intent.succeeded:', err)
  }
}
