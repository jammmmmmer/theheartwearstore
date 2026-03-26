'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Leaf } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

export default function SuccessPage() {
  const { clearCart } = useCartStore()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <CheckCircle
              size={64}
              strokeWidth={1}
              className="text-sage-500"
            />
            <Leaf
              size={20}
              strokeWidth={1.5}
              className="text-sage-400 absolute -bottom-1 -right-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-playfair text-4xl text-stone-900">Order Confirmed</h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            Thank you for your purchase. You&apos;ll receive a confirmation email shortly.
            Your order will be printed and shipped with love.
          </p>
        </div>

        <div className="bg-stone-100 px-6 py-5 text-left space-y-2">
          <p className="text-xs uppercase tracking-widest text-stone-500">What happens next</p>
          <ul className="text-sm text-stone-600 space-y-1.5">
            <li>✦ &nbsp;Your order goes straight to our print partner</li>
            <li>✦ &nbsp;Each piece is made just for you — no mass production</li>
            <li>✦ &nbsp;Shipping typically takes 3–7 business days</li>
            <li>✦ &nbsp;You&apos;ll get a shipping notification by email</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-primary inline-block">
            Keep Shopping
          </Link>
          <Link href="/" className="btn-outline inline-block">
            Back to Home
          </Link>
        </div>

        <p className="text-xs text-stone-400 italic">
          &ldquo;Made with love. Printed with purpose.&rdquo;
        </p>
      </div>
    </div>
  )
}
