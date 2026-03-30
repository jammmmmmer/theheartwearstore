'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useTranslation } from '@/lib/language-context'

export default function CancelPage() {
  const { tr } = useTranslation()

  return (
    <div className="bg-stone-950 min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center">
            <ShoppingBag size={32} strokeWidth={1} className="text-stone-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-playfair text-4xl text-stone-50">{tr.cancel_heading}</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            {tr.cancel_body}
          </p>
        </div>

        <div className="bg-stone-900 border border-stone-800 px-6 py-4 text-sm text-stone-400 italic">
          {tr.cancel_quote}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop" className="btn-primary inline-block">
            {tr.cancel_shop}
          </Link>
          <Link href="/" className="btn-outline inline-block">
            {tr.cancel_home}
          </Link>
        </div>
      </div>
    </div>
  )
}
