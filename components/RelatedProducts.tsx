'use client'

import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { useTranslation } from '@/lib/language-context'

export default function RelatedProducts({ products }: { products: Product[] }) {
  const { tr } = useTranslation()
  if (!products.length) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <h2
        style={{
          fontFamily: 'var(--font-dm-serif), Georgia, serif',
          fontSize: '1.5rem',
          color: 'var(--hw-white)',
          marginBottom: '20px',
        }}
      >
        {tr.product_related}
      </h2>
      <div
        className="grid grid-cols-2 lg:grid-cols-4"
        style={{ gap: '2px', background: 'var(--hw-border)' }}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
