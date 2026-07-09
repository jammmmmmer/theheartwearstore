'use client'

import ProductCard from '@/components/ProductCard'
import { Product, Artist } from '@/types'
import { useTranslation } from '@/lib/language-context'

export default function ArtistPageClient({
  artist,
  products,
}: {
  artist: Artist
  products: Product[]
}) {
  const { tr } = useTranslation()

  return (
    <div style={{ background: 'var(--hw-black)', minHeight: '70vh', padding: '80px 0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-2xl">
          <div className="hw-eyebrow mb-4">{tr.artist_page_designs}</div>
          <h1
            style={{
              fontFamily: 'var(--font-dm-serif), Georgia, serif',
              fontSize: 'clamp(2.5rem,5vw,4rem)',
              color: 'var(--hw-white)',
              lineHeight: 1.0,
              marginBottom: '16px',
            }}
          >
            {artist.display_name}
          </h1>
          {artist.bio && (
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--hw-muted)' }}>
              {artist.bio}
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-28 border" style={{ borderColor: 'var(--hw-border)' }}>
            <p style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--hw-muted)' }}>
              {tr.shop_empty}
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
