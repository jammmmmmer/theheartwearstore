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
    <div style={{ background: 'var(--hw-black)', minHeight: '70vh', padding: '80px 0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-14">
          <div className="hw-eyebrow mb-4">{tr.shop_eyebrow}</div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2.5rem,5vw,4rem)', color: 'var(--hw-white)', lineHeight: 1.0, marginBottom: '12px' }}>
            {tr.shop_heading}
          </h1>
          {products.length > 0 && (
            <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--hw-muted)' }}>
              {products.length} {products.length === 1 ? tr.shop_count_single : tr.shop_count_plural}
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-28 border" style={{ borderColor: 'var(--hw-border)' }}>
            <p style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--hw-muted)' }}>
              {tr.shop_empty}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--hw-muted)', marginTop: '12px', maxWidth: '360px', margin: '12px auto 0' }}>
              {tr.shop_empty_sub}
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{ gap: '2px', background: 'var(--hw-border)' }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
