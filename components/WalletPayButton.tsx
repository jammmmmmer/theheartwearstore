'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js'
import type { PaymentRequest } from '@stripe/stripe-js'
import { PrintifyVariant, Product } from '@/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface InnerProps {
  product: Product
  variant: PrintifyVariant
}

function WalletPayInner({ product, variant }: InnerProps) {
  const stripe = useStripe()
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null)

  useEffect(() => {
    if (!stripe) return

    const pr = stripe.paymentRequest({
      country: 'CA',
      currency: 'cad',
      total: {
        label: `${product.title} — ${variant.title}`,
        amount: variant.price + 799, // include standard shipping
      },
      shippingOptions: [
        { id: 'standard', label: 'Standard Shipping (5–10 days)', detail: 'CAD $7.99', amount: 799 },
        { id: 'express', label: 'Express Shipping (2–4 days)', detail: 'CAD $14.99', amount: 1499 },
      ],
      requestShipping: true,
      requestPayerName: true,
      requestPayerEmail: true,
    })

    pr.canMakePayment().then((result) => {
      if (result) setPaymentRequest(pr)
    })

    pr.on('shippingoptionchange', (ev) => {
      ev.updateWith({
        status: 'success',
        total: {
          label: `${product.title} — ${variant.title}`,
          amount: variant.price + ev.shippingOption.amount,
        },
      })
    })

    pr.on('paymentmethod', async (ev) => {
      const shippingAmount = ev.shippingOption?.amount ?? 799

      const res = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: variant.price,
          shippingAmount,
          variantId: variant.id,
          productId: product.id,
          printifyId: product.printify_id,
          title: product.title,
          variantTitle: variant.title,
          image: product.images[0]?.src ?? '',
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
  }, [stripe, product, variant])

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
