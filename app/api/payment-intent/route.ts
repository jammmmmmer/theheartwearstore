import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      amount: number
      shippingAmount: number
      variantId: number
      productId: string
      printifyId: string
      title: string
      variantTitle: string
      image: string
      shippingAddress?: {
        name: string
        line1: string
        line2?: string
        city: string
        state: string
        postal_code: string
        country: string
      }
    }

    const total = body.amount + body.shippingAmount

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'cad',
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify([{
          printify_id: body.printifyId,
          variant_id: body.variantId,
          price: body.amount,
          quantity: 1,
        }]),
        shipping_amount: body.shippingAmount,
        source: 'theheartwearstore_applepay',
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Error creating payment intent:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
