'use client'

/**
 * HeroSection — "Heartline" (Direction C)
 *
 * Left-aligned kicker pill with pulsing heart dot, huge uppercase Syne
 * headline with a red poetic accent, chunky offset-shadow CTAs beside a
 * Fraunces-italic brand line, the latest drop on a stitched product stage,
 * and the bilingual marquee strip — the thread that ties the brand voice
 * together.
 *
 * Kept: props (latestProduct/productCount), all tr.* keys, and the
 * 'hw:hero_cta_click' analytics event.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/language-context'
import { useCurrency } from '@/lib/currency-context'
import { Product } from '@/types'

interface HeroSectionProps {
  /** Most recently added enabled product — drives the product stage */
  latestProduct?: Product | null
  /** Total enabled products — shown in the stat line */
  productCount?: number
}

export default function HeroSection({
  latestProduct,
  productCount = 0,
}: HeroSectionProps) {
  const { tr } = useTranslation()
  const { display } = useCurrency()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40)
    return () => clearTimeout(t)
  }, [])

  function handleShopNow() {
    window.dispatchEvent(new CustomEvent('hw:hero_cta_click', {
      detail: { source: 'hero_banner', productCount, hasNewDrop: !!latestProduct },
    }))
  }

  const heroImage =
    latestProduct?.images?.find(img => img.is_default)?.src ??
    latestProduct?.images?.[0]?.src ??
    null

  const marqueeItems = [
    tr.home_marquee_1, tr.home_marquee_2, tr.home_marquee_3, tr.home_marquee_4,
  ]

  const reveal = (delay: string) =>
    `transition-all duration-700 ${delay} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--hw-black)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-14">

        {/* Kicker pill */}
        <div className={reveal('delay-[50ms]')}>
          <span className="hw-kicker">
            <span className="dot" aria-hidden="true" />
            {tr.hero_eyebrow}
          </span>
        </div>

        {/* Headline — huge uppercase Syne + red poetic accent */}
        <h1
          className={reveal('delay-150')}
          style={{
            fontSize: 'clamp(3.2rem, 8.5vw, 6.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 0.98,
            textTransform: 'uppercase',
            color: 'var(--hw-white)',
            margin: '30px 0 0',
          }}
        >
          {tr.hero_heading_line1}<br />
          <span style={{ color: 'var(--hw-accent)' }}>{tr.hero_heading_line2}</span>
        </h1>

        {/* CTA row + poetic line */}
        <div className={`flex items-center gap-x-8 gap-y-6 flex-wrap mt-9 ${reveal('delay-300')}`}>
          <Link href="/shop" onClick={handleShopNow} className="btn-accent">
            {tr.hero_cta_shop}
          </Link>
          <Link href="/vote" className="btn-outline">
            {tr.footer_vote}
          </Link>
          <p
            style={{
              fontSize: '1.02rem',
              lineHeight: 1.65,
              color: 'var(--hw-mid)',
              maxWidth: '380px',
            }}
          >
            <span className="poetic" style={{ color: 'var(--hw-white)' }}>{tr.footer_tagline}</span>
            {' — '}{tr.hero_body}
          </p>
        </div>

        {/* Product stage — stitched frame */}
        <div
          className={`hw-stage group relative mt-14 ${reveal('delay-500')}`}
          style={{
            borderRadius: '26px',
            border: '2px dashed var(--hw-stitch)',
            padding: heroImage ? '0' : '80px 0',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {heroImage && latestProduct ? (
            <Link
              href={`/shop/${latestProduct.id}`}
              aria-label={`Shop ${latestProduct.title}`}
              className="block"
              style={{ textDecoration: 'none' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt={latestProduct.title}
                className="mx-auto transition-transform duration-500 group-hover:scale-[1.03]"
                style={{
                  maxHeight: '540px',
                  width: 'auto',
                  display: 'block',
                  padding: '32px 16px 64px',
                  filter: 'drop-shadow(0 22px 34px rgba(18,16,14,0.16))',
                }}
              />
              <div
                className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap"
                style={{ fontSize: '13px', color: 'var(--hw-muted)', fontWeight: 500 }}
              >
                <b style={{ color: 'var(--hw-white)', fontWeight: 700 }}>{latestProduct.title}</b>
                {' · '}{tr.product_from} {display(latestProduct.price_from)}
              </div>
            </Link>
          ) : (
            <p className="poetic" style={{ fontSize: '1.3rem', color: 'var(--hw-muted)' }}>
              {tr.home_empty}
            </p>
          )}
        </div>

        {/* Stat line */}
        {productCount > 0 && (
          <div className={`flex items-center gap-2.5 mt-7 ${reveal('delay-700')}`}>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: '8px', height: '8px',
                borderRadius: '50%',
                background: 'var(--hw-accent)',
                animation: 'pulseDot 2.4s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--hw-muted)' }}>
              {productCount} {productCount !== 1 ? tr.shop_count_plural : tr.shop_count_single}
            </span>
          </div>
        )}
      </div>

      {/* Bilingual marquee — the Heartline thread */}
      <div
        className="overflow-hidden py-3.5"
        style={{
          borderTop: '2px dashed var(--hw-stitch)',
          borderBottom: '2px dashed var(--hw-stitch)',
          background: 'var(--hw-off)',
        }}
        aria-hidden="true"
      >
        <div className="animate-marquee whitespace-nowrap inline-flex">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--hw-muted)',
                margin: '0 26px',
              }}
            >
              {item} <span style={{ color: 'var(--hw-accent)' }}>♥</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
