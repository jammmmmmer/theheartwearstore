import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { verifyCartItems, PriceVerificationError } from '@/lib/pricing'
import { toCurrency } from '@/lib/currency'
import { validateShippingAmount } from '@/lib/shipping'

interface WalletShippingAddress {
  name?: string
  phone?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      shippingAmount: number
      variantId: number
      printifyId: string
      currency?: string
      payerEmail?: string
      shippingAddress?: WalletShippingAddress
    }
    const currency = toCurrency(body.currency)

    // SECURITY: the item price is re-derived server-side from the products
    // table (in the requested currency); the shipping amount must match a
    // fresh server-side quote for the destination. Client amounts are
    // never trusted.
    const [item] = await verifyCartItems(
      [{ printify_id: body.printifyId, variant_id: body.variantId, quantity: 1 }],
      currency
    )
    const shipCountry =
      body.shippingAddress?.country || (currency === 'usd' ? 'US' : 'CA')
    const shippingAmount = await validateShippingAmount(
      body.shippingAmount, shipCountry, currency, 1
    )
    if (shippingAmount === null) {
      throw new PriceVerificationError('Shipping amount does not match a valid quote')
    }

    const total = item.unit_amount + shippingAmount

    // SHIPPING FIX: attach the wallet sheet's shipping address to the
    // PaymentIntent so the fulfillment webhook ships to it — not to the
    // billing address.
    const addr = body.shippingAddress
    const shipping: import('stripe').Stripe.PaymentIntentCreateParams.Shipping | undefined =
      addr?.line1 && addr.city && addr.country
        ? {
            name: addr.name || 'Customer',
            phone: addr.phone || undefined,
            address: {
              line1: addr.line1,
              line2: addr.line2 || undefined,
              city: addr.city,
              state: addr.state || undefined,
              postal_code: addr.postal_code || undefined,
              country: addr.country,
            },
          }
        : undefined

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency,
      automatic_payment_methods: { enabled: true },
      shipping,
      receipt_email: body.payerEmail || undefined,
      metadata: {
        items: JSON.stringify([{
          printify_id: item.printify_id,
          variant_id: item.variant_id,
          price: item.unit_amount,
          quantity: 1,
        }]),
        shipping_amount: shippingAmount,
        source: 'theheartwearstore_applepay',
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    if (err instanceof PriceVerificationError) {
      console.warn('Payment intent price verification failed:', err.message)
      return NextResponse.json(
        { error: 'This item is no longer available. Please refresh and try again.' },
        { status: 400 }
      )
    }
    console.error('Error creating payment intent:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
