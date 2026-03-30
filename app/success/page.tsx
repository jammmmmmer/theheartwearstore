'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, Leaf } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useTranslation } from '@/lib/language-context'

export default function SuccessPage() {
  const { clearCart } = useCartStore()
  const { tr } = useTranslation()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <div className="bg-stone-950 min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <CheckCircle
              size={64}
              strokeWidth={1}
              className="text-sage-400"
            />
            <Leaf
              size={20}
              strokeWidth={1.5}
              className="text-sage-400 absolute -bottom-1 -right-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-playfair text-4xl text-stone-50">{tr.success_heading}</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            {tr.success_body}
          </p>
        </div>

        <div className="bg-stone-900 border border-stone-800 px-6 py-5 text-left space-y-2">
          <p className="text-xs uppercase tracking-widest text-stone-500">{tr.success_next_eyebrow}</p>
          <ul className="text-sm text-stone-400 space-y-1.5">
            <li>✦ &nbsp;{tr.success_next_1}</li>
            <li>✦ &nbsp;{tr.success_next_2}</li>
            <li>✦ &nbsp;{tr.success_next_3}</li>
            <li>✦ &nbsp;{tr.success_next_4}</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-primary inline-block">
            {tr.success_keep_shopping}
          </Link>
          <Link href="/" className="btn-outline inline-block">
            {tr.success_home}
          </Link>
        </div>

        <p className="text-xs text-stone-600 italic">
          {tr.success_quote}
        </p>
      </div>
    </div>
  )
}
