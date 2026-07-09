'use client'

import Link from 'next/link'
import { Product } from '@/types'
import { useTranslation } from '@/lib/language-context'
import { useCurrency } from '@/lib/currency-context'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { tr } = useTranslation()
  const { display } = useCurrency()
  const defaultImage = product.images.find((img) => img.is_default) ?? product.images[0]
  const imageUrl = defaultImage?.src ?? '/placeholder-tshirt.jpg'

  return (
    <Link
      href={`/shop/${product.id}`}
      className="group block hw-card overflow-hidden"
      aria-label={`View ${product.title}`}
      style={{ textDecoration: 'none' }}
    >
      {/* Image on gallery stage — stitched divider below */}
      <div className="hw-stage hw-stitched relative overflow-hidden" style={{ aspectRatio: '1/1.02' }}>
        <img
          src={imageUrl}
          alt={product.title}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '9%',
            transition: 'transform 0.5s var(--hw-ease)',
          }}
          className="group-hover:scale-[1.05]"
        />
      </div>

      {/* Info */}
      <div style={{ padding: '16px 20px 20px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.02rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--hw-white)',
            lineHeight: 1.3,
            marginBottom: '5px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.title}
        </h3>

        <span
          style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: 'var(--hw-mid)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {tr.product_from} {display(product.price_from)}
        </span>
      </div>
    </Link>
  )
}
