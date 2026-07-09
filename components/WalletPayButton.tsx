'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js'
import type { PaymentRequest } from '@stripe/stripe-js'
import { PrintifyVariant, Product } from '@/types'
import { useCurrency } from '@/lib/currency-context'
import { priceInCurrency, formatMoney, SHIPPING_RATES } from '@/lib/currency'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface InnerProps {
  product: Product
  variant: PrintifyVariant
}

function WalletPayInner({ product, variant }: InnerProps) {
  const stripe = useStripe()
  const { currency } = useCurrency()
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)

  useEffect(() => {
    if (!stripe) return

    const unitAmount = priceInCurrency(variant.price, currency)
    const rates = SHIPPING_RATES[currency]

    const pr = stripe.paymentRequest({
      country: 'CA',
      currency,
      total: {
        label: `${product.title} — ${variant.title}`,
        amount: unitAmount + rates.standard, // include standard shipping
      },
      shippingOptions: [
        { id: 'standard', label: 'Standard Shipping (5–10 days)', detail: formatMoney(rates.standard, currency), amount: rates.standard },
        { id: 'express', label: 'Express Shipping (2–4 days)', detail: formatMoney(rates.express, currency), amount: rates.express },
      ],
      requestShipping: true,
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    })

    pr.canMakePayment().then((result) => {
      if (result) setPaymentRequest(pr)
    })

    // Real destination-based rates: when the shopper picks an address in the
    // wallet sheet, re-quote shipping for that country from the server.
    pr.on('shippingaddresschange', async (ev) => {
      try {
        const country = ev.shippingAddress?.country ?? (currency === 'usd' ? 'US' : 'CA')
        const res = await fetch(
          `/api/shipping-quote?country=${encodeURIComponent(country)}&currency=${currency}&qty=1`
        )
        const quote = await res.json() as { standard: number; express: number }
        ev.updateWith({
          status: 'success',
          shippingOptions: [
            { id: 'standard', label: 'Standard Shipping (5–10 days)', detail: formatMoney(quote.standard, currency), amount: quote.standard },
            { id: 'express', label: 'Express Shipping (2–4 days)', detail: formatMoney(quote.express, currency), amount: quote.express },
          ],
          total: {
            label: `${product.title} — ${variant.title}`,
            amount: unitAmount + quote.standard,
          },
        })
      } catch {
        ev.updateWith({ status: 'success' })
      }
    })

    pr.on('shippingoptionchange', (ev) => {
      ev.updateWith({
        status: 'success',
        total: {
          label: `${product.title} — ${variant.title}`,
          amount: unitAmount + ev.shippingOption.amount,
        },
      })
    })

    pr.on('paymentmethod', async (ev) => {
      const shippingAmount = ev.shippingOption?.amount ?? rates.standard

      // Forward the wallet sheet's SHIPPING address — the server attaches it
      // to the PaymentIntent so fulfillment ships to it (not billing).
      const sa = ev.shippingAddress
      const shippingAddress = sa
        ? {
            name: sa.recipient ?? ev.payerName ?? '',
            phone: sa.phone ?? ev.payerPhone ?? '',
            line1: sa.addressLine?.[0] ?? '',
            line2: sa.addressLine?.[1] ?? '',
            city: sa.city ?? '',
            state: sa.region ?? '',
            postal_code: sa.postalCode ?? '',
            country: sa.country ?? '',
          }
        : undefined

      const res = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          shippingAmount,
          variantId: variant.id,
          printifyId: product.printify_id,
          payerEmail: ev.payerEmail ?? '',
          shippingAddress,
        }),
      })

      const { clientSecret, error } = await res.json()
      if (error || !clientSecret) { ev.complete('fail'); return }

      const { error: confirmError } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      )

      if (confirmError) {
        ev.complete('fail')
      } else {
        ev.complete('success')
        window.location.href = '/success'
      }
    })

    return () => { setPaymentRequest(null) }
  }, [stripe, product, variant, currency])

  if (!paymentRequest) return null

  return (
    <div className="w-full">
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'buy',
              theme: 'dark',
              height: '54px',
            },
          },
        }}
      />
    </div>
  )
}

interface Props {
  product: Product
  variant: PrintifyVariant
}

export default function WalletPayButton({ product, variant }: Props) {
  return (
    <Elements stripe={stripePromise}>
      <WalletPayInner product={product} variant={variant} />
    </Elements>
  )
}
