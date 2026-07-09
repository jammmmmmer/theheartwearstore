import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { CartItem } from '@/types'
import { verifyCartItems, PriceVerificationError } from '@/lib/pricing'
import { toCurrency } from '@/lib/currency'
import { getShippingQuote } from '@/lib/shipping'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      items: CartItem[]
      customerEmail?: string
      currency?: string
    }
    const { items, customerEmail } = body
    const currency = toCurrency(body.currency)

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty or invalid.' },
        { status: 400 }
      )
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // SECURITY: prices are re-derived server-side from the products table
    // (in the requested currency). Client-supplied item.price is ignored.
    const verified = await verifyCartItems(
      items.map((item) => ({
        printify_id: item.printify_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
      })),
      currency
    )

    // Real Printify shipping cost for the destination (currency implies
    // country here — Stripe Checkout needs rates before the address is
    // known) scaled by cart size. Falls back to flat rates without data.
    const totalQty = verified.reduce((sum, i) => sum + i.quantity, 0)
    const quote = await getShippingQuote(currency === 'usd' ? 'US' : 'CA', currency, totalQty)

    // Build Stripe line items from verified data only
    const lineItems = verified.map((item) => ({
      price_data: {
        currency,
        product_data: {
          name: `${item.title} — ${item.variant_title}`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: item.unit_amount,
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency,
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      customer_email: customerEmail,
      shipping_address_collection: {
        allowed_countries: ['CA', 'US'],
      },
      // Some carriers require a contact number — forwarded to Printify
      phone_number_collection: { enabled: true },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: quote.standard, currency },
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
            fixed_amount: { amount: quote.express, currency },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 4 },
            },
          },
        },
      ],
      metadata: {
        // Only store fields needed for fulfillment to stay under Stripe's 500-char limit
        items: JSON.stringify(verified.map(({ printify_id, variant_id, unit_amount, quantity }) => ({
          printify_id, variant_id, price: unit_amount, quantity,
        }))),
      },
      payment_intent_data: {
        metadata: {
          source: 'theheartwearstore',
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    if (err instanceof PriceVerificationError) {
      console.warn('Checkout price verification failed:', err.message)
      return NextResponse.json(
        { error: 'One or more items in your cart are no longer available. Please refresh and try again.' },
        { status: 400 }
      )
    }
    console.error('Error creating Stripe checkout session:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create checkout session.' },
      { status: 500 }
    )
  }
}
