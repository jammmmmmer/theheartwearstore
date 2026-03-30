'use client'

import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { useTranslation } from '@/lib/language-context'

interface ShopPageClientProps {
  products: Product[]
}

export default function ShopPageClient({ products }: ShopPageClientProps) {
  const { tr } = useTranslation()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Page header */}
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-sage-600 mb-3">{tr.shop_eyebrow}</p>
        <h1 className="font-playfair text-5xl text-stone-900 mb-4">{tr.shop_heading}</h1>
        {products.length > 0 && (
          <p className="text-stone-500 text-sm">
            {products.length} {products.length === 1 ? tr.shop_count_single : tr.shop_count_plural}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-playfair text-2xl italic text-stone-400 mb-3">
            {tr.shop_empty}
          </p>
          <p className="text-stone-400 text-sm max-w-md mx-auto">
            {tr.shop_empty_sub}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
