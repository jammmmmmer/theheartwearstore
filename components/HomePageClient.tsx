'use client'

import HeroSection from '@/components/HeroSection'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { ArrowRight, Upload } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/language-context'

interface HomePageClientProps {
  products: Product[]
}

export default function HomePageClient({ products }: HomePageClientProps) {
  const { tr } = useTranslation()

  const steps = [
    { num: '01', title: tr.home_step_1_title, body: tr.home_step_1_body },
    { num: '02', title: tr.home_step_2_title, body: tr.home_step_2_body },
    { num: '03', title: tr.home_step_3_title, body: tr.home_step_3_body },
    { num: '04', title: tr.home_step_4_title, body: tr.home_step_4_body },
  ]

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <HeroSection
        latestProduct={products[0] ?? null}
        productCount={products.length}
      />

      {/* ── THE COLLECTION ────────────────────────────────────────────────── */}
      <section style={{ background: 'var(--hw-black)', padding: '72px 0 96px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header — centered, Apple-style */}
          <div className="text-center mb-12">
            <h2
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.6rem)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: 'var(--hw-white)',
                marginBottom: '8px',
              }}
            >
              {tr.home_collection_title}
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--hw-mid)', letterSpacing: '-0.01em' }}>
              {tr.home_collection_sub}
            </p>
          </div>

          {/* Product grid */}
          {products.length === 0 ? (
            <div
              className="text-center py-24 hw-card"
              style={{ boxShadow: 'var(--hw-shadow-sm)' }}
            >
              <p className="poetic" style={{ fontSize: '1.35rem', color: 'var(--hw-mid)' }}>
                {tr.home_empty}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--hw-muted)', marginTop: '10px' }}>
                {tr.home_empty_sub}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          {products.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/shop" className="btn-outline inline-flex items-center gap-2">
                {tr.home_view_all} <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── DESIGN YOUR OWN ───────────────────────────────────────────────── */}
      <section style={{ background: 'var(--hw-off)', padding: '96px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-14 items-center">

            {/* Text */}
            <div>
              <span className="hw-eyebrow" style={{ marginBottom: '16px', display: 'inline-flex' }}>
                {tr.home_custom_eyebrow}
              </span>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  lineHeight: 1.04,
                  color: 'var(--hw-white)',
                  margin: '10px 0 18px',
                }}
              >
                {tr.home_custom_title_1}{' '}
                <span className="poetic" style={{ color: 'var(--hw-accent)' }}>
                  {tr.home_custom_title_2}
                </span>
              </h2>
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.65,
                  letterSpacing: '-0.01em',
                  color: 'var(--hw-mid)',
                  maxWidth: '440px',
                  marginBottom: '30px',
                }}
              >
                {tr.home_custom_body}
              </p>
              <Link href="/create" className="btn-accent">
                <Upload size={15} />
                {tr.home_custom_cta}
              </Link>
            </div>

            {/* Steps — soft cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((step) => (
                <div
                  key={step.num}
                  style={{
                    background: 'var(--hw-black)',
                    borderRadius: 'var(--hw-radius-lg)',
                    padding: '26px 24px',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--hw-accent)',
                      marginBottom: '12px',
                    }}
                  >
                    {step.num}
                  </div>
                  <h3
                    style={{
                      fontSize: '1.02rem',
                      fontWeight: 600,
                      letterSpacing: '-0.015em',
                      color: 'var(--hw-white)',
                      marginBottom: '6px',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--hw-mid)' }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
