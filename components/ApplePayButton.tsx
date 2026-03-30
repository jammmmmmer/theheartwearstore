'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { PaymentRequest, Stripe } from '@stripe/stripe-js'
import { PrintifyVariant, Product } from '@/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const SHIPPING_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard Shipping',
    detail: '5–10 business days',
    amount: 799,
  },
  {
    id: 'express',
    label: 'Express Shipping',
    detail: '2–4 business days',
    amount: 1499,
  },
]

interface Props {
  product: Product
  variant: PrintifyVariant
}

export default function ApplePayButton({ product, variant }: Props) {
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [available, setAvailable] = useState(false)

  const initPaymentRequest = useCallback(async (s: Stripe, v: PrintifyVariant) => {
    const pr = s.paymentRequest({
      country: 'CA',
      currency: 'cad',
      total: {
        label: `${product.title} — ${v.title}`,
        amount: v.price + SHIPPING_OPTIONS[0].amount,
      },
      shippingOptions: SHIPPING_OPTIONS,
      requestShipping: true,
      requestPayerName: true,
      requestPayerEmail: true,
    })

    const result = await pr.canMakePayment()
    if (!result?.applePay && !result?.googlePay) return

    pr.on('shippingoptionchange', (ev) => {
      ev.updateWith({
        status: 'success',
        total: {
          label: `${product.title} — ${v.title}`,
          amount: v.price + ev.shippingOption.amount,
        },
      })
    })

    pr.on('paymentmethod', async (ev) => {
      const shippingAmount = ev.shippingOption?.amount ?? SHIPPING_OPTIONS[0].amount

      const res = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: v.price,
          shippingAmount,
          variantId: v.id,
          productId: product.id,
          printifyId: product.printify_id,
          title: product.title,
          variantTitle: v.title,
          image: product.images[0]?.src ?? '',
        }),
      })

      const { clientSecret, error } = await res.json()
      if (error || !clientSecret) {
        ev.complete('fail')
        return
      }

      const { error: confirmError } = await s.confirmCardPayment(
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

    setPaymentRequest(pr)
    setAvailable(true)
  }, [product])

  useEffect(() => {
    stripePromise.then((s) => {
      if (s) setStripe(s)
    })
  }, [])

  useEffect(() => {
    if (!stripe || !variant) return
    setAvailable(false)
    setPaymentRequest(null)
    initPaymentRequest(stripe, variant)
  }, [stripe, variant, initPaymentRequest])

  if (!available || !paymentRequest) return null

  return (
    <button
      onClick={() => paymentRequest.show()}
      className="w-full bg-black text-white py-4 flex items-center justify-center gap-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors"
      aria-label="Buy with Apple Pay"
    >
      <svg viewBox="0 0 50 21" className="h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.3 4.5C8.7 5.2 7.7 5.7 6.8 5.6c-.1-.9.3-1.8.9-2.5C8.3 2.4 9.3 1.9 10.2 2c.1 1-.3 1.9-.9 2.5z"/>
        <path d="M10.2 6c-1.1-.1-2.1.6-2.6.6-.5 0-1.3-.6-2.2-.6C4.1 6.1 2.9 6.8 2.2 8c-1.4 2.4-.3 5.9.9 7.8.6.9 1.3 1.9 2.2 1.9.9 0 1.2-.6 2.2-.6 1.1 0 1.4.6 2.2.6.9 0 1.6-.9 2.2-1.9.4-.6.6-1.2.7-1.9-1.2-.5-2-1.7-2-3.1 0-1.2.6-2.4 1.7-3.1-.7-.9-1.7-1.6-2.1-1.7z"/>
        <text x="16" y="15" fontFamily="-apple-system, BlinkMacSystemFont, sans-serif" fontSize="10" fontWeight="600" letterSpacing="-0.3">Pay</text>
      </svg>
    </button>
  )
}
