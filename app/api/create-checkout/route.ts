import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { CartItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { items: CartItem[]; customerEmail?: string }
    const { items, customerEmail } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty or invalid.' },
        { status: 400 }
      )
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Build Stripe line items
    const lineItems = items.map((item: CartItem) => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: `${item.title} — ${item.variant_title}`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: item.price, // already in cents
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'cad',
      line_items: lineItems,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      customer_email: customerEmail,
      shipping_address_collection: {
        allowed_countries: ['CA', 'US'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 799, currency: 'cad' },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1499, currency: 'cad' },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 4 },
            },
          },
        },
      ],
      metadata: {
        items: JSON.stringify(items),
      },
      payment_intent_data: {
        metadata: {
          source: 'theheartwearstore',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Error creating Stripe checkout session:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create checkout session.' },
      { status: 500 }
    )
  }
}
