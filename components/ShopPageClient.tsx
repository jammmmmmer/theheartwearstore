'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { useTranslation } from '@/lib/language-context'

interface ShopPageClientProps {
  products: Product[]
}

const MAX_TAG_CHIPS = 8

export default function ShopPageClient({ products }: ShopPageClientProps) {
  const { tr } = useTranslation()
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Most-used tags across the catalog, for the filter chips
  const topTags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of products) {
      for (const tag of p.tags ?? []) {
        const key = tag.toLowerCase().trim()
        if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TAG_CHIPS)
      .map(([tag]) => tag)
  }, [products])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return products.filter((p) => {
      if (activeTag && !(p.tags ?? []).some((t) => t.toLowerCase() === activeTag)) {
        return false
      }
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [products, query, activeTag])

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    fontSize: '0.82rem',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    padding: '8px 18px',
    borderRadius: '999px',
    cursor: 'pointer',
    border: '1px solid',
    borderColor: selected ? 'var(--hw-white)' : 'var(--hw-border)',
    color: selected ? 'var(--hw-black)' : 'var(--hw-mid)',
    background: selected ? 'var(--hw-white)' : 'var(--hw-surface)',
    transition: 'all 0.2s var(--hw-ease)',
  })

  return (
    <div style={{ background: 'var(--hw-black)', minHeight: '70vh', padding: '80px 0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-10">
          <div className="hw-eyebrow mb-4">{tr.shop_eyebrow}</div>
          <h1 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2.5rem,5vw,4rem)', color: 'var(--hw-white)', lineHeight: 1.0, marginBottom: '12px' }}>
            {tr.shop_heading}
          </h1>
          {products.length > 0 && (
            <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--hw-muted)' }}>
              {filtered.length} {filtered.length === 1 ? tr.shop_count_single : tr.shop_count_plural}
            </p>
          )}
        </div>

        {/* Search + tag filters */}
        {products.length > 0 && (
          <div className="mb-10 flex flex-col gap-4">
            <div className="relative max-w-sm">
              <Search
                size={14}
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hw-muted)' }}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr.shop_search_placeholder}
                aria-label={tr.shop_search_placeholder}
                className="w-full text-sm"
                style={{
                  background: 'var(--hw-surface)',
                  border: '1px solid var(--hw-border)',
                  borderRadius: '12px',
                  color: 'var(--hw-white)',
                  padding: '11px 14px 11px 38px',
                  outline: 'none',
                  boxShadow: 'var(--hw-shadow-sm)',
                }}
              />
            </div>

            {topTags.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveTag(null)} style={chipStyle(activeTag === null)}>
                  {tr.shop_filter_all}
                </button>
                {topTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    style={chipStyle(activeTag === tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-28 border" style={{ borderColor: 'var(--hw-border)' }}>
            <p style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '1.5rem', fontStyle: 'italic', color: 'var(--hw-muted)' }}>
              {tr.shop_empty}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--hw-muted)', marginTop: '12px', maxWidth: '360px', margin: '12px auto 0' }}>
              {tr.shop_empty_sub}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-28 border" style={{ borderColor: 'var(--hw-border)' }}>
            <p style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--hw-muted)' }}>
              {tr.shop_no_results}
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            style={{ gap: '2px', background: 'var(--hw-border)' }}
          >
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
