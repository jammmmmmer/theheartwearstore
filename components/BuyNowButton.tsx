'use client'

import { useState } from 'react'
import { PrintifyVariant, Product } from '@/types'
import { Zap } from 'lucide-react'
import { useTranslation } from '@/lib/language-context'

interface Props {
  product: Product
  variant: PrintifyVariant
}

export default function BuyNowButton({ product, variant }: Props) {
  const [loading, setLoading] = useState(false)
  const { tr } = useTranslation()

  async function handleBuyNow() {
    setLoading(true)
    try {
      const image =
        product.images.find((img) => img.variant_ids.includes(variant.id))?.src ??
        product.images.find((img) => img.is_default)?.src ??
        product.images[0]?.src ??
        ''

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            product_id: product.id,
            printify_id: product.printify_id,
            variant_id: variant.id,
            title: product.title,
            variant_title: variant.title,
            price: variant.price,
            quantity: 1,
            image,
          }],
        }),
      })

      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error('Buy now error:', err)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBuyNow}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-4 text-sm tracking-widest uppercase bg-stone-100 text-stone-900 border border-stone-300 hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Zap size={15} strokeWidth={1.5} />
      {loading ? tr.product_redirecting : tr.product_buy_now}
    </button>
  )
}
