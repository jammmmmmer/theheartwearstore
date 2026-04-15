'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useTranslation } from '@/lib/language-context'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { tr } = useTranslation()
  const defaultImage = product.images.find((img) => img.is_default) ?? product.images[0]
  const imageUrl = defaultImage?.src ?? '/placeholder-tshirt.jpg'

  return (
    <Link
      href={`/shop/${product.id}`}
      className="group block"
      aria-label={`View ${product.title}`}
      style={{ background: 'var(--hw-surface)', textDecoration: 'none' }}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '3/4', background: 'var(--hw-off)', position: 'relative' }}
      >
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Hover tint */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'rgba(201,64,42,0.06)' }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--hw-surface), transparent)' }}
        />
      </div>

      {/* Info */}
      <div style={{ padding: '18px 20px 24px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-dm-serif), Georgia, serif',
            fontSize: '1.05rem',
            color: 'var(--hw-white)',
            lineHeight: 1.2,
            marginBottom: '6px',
            transition: 'color 0.2s',
          }}
        >
          {product.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
          <span
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '0.72rem',
              color: 'var(--hw-accent2)',
              letterSpacing: '0.04em',
            }}
          >
            {tr.product_from} {formatPrice(product.price_from)}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--hw-muted)',
              transition: 'color 0.2s',
            }}
            className="group-hover:text-hw-white"
          >
            Shop →
          </span>
        </div>
      </div>
    </Link>
  )
}
