'use client'

import HeroSection from '@/components/HeroSection'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/language-context'

interface HomePageClientProps {
  products: Product[]
}

const STEPS = [
  { num: '01', title: 'Find your moment',       body: 'A photo, a face, an image that means something. Anything you\'d want to carry.' },
  { num: '02', title: 'Upload it',              body: 'Drop it in. We generate 3 placement mockups — chest, full front, back + chest — in seconds.' },
  { num: '03', title: 'Pick your fit',          body: 'Approve the placement you love. Nothing goes live until you say so.' },
  { num: '04', title: 'We make it',             body: 'Printed on demand, shipped across Canada. No waste. No warehouses. Just yours.' },
]

export default function HomePageClient({ products }: HomePageClientProps) {
  const { tr } = useTranslation()

  return (
    <>
      {/* latestProduct drives the "New Drop" badge; productCount feeds the live stat bar */}
      <HeroSection
        latestProduct={products[0] ?? null}
        productCount={products.length}
      />

      {/* ── FEATURED COLLECTION ── */}
      <section style={{ background: 'var(--hw-black)', padding: '100px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <div>
              <div className="hw-eyebrow mb-4">{tr.featured_eyebrow}</div>
              <h2 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2rem,4vw,3.2rem)', lineHeight: 1.1, color: 'var(--hw-white)' }}>
                {tr.featured_heading}<br/>
                <em style={{ color: 'var(--hw-accent2)' }}>hold something.</em>
              </h2>
            </div>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 transition-colors"
              style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--hw-muted)', textDecoration: 'none' }}
            >
              {tr.featured_view_all}
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-24 border" style={{ borderColor: 'var(--hw-border)' }}>
              <p style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--hw-muted)' }}>{tr.featured_coming_soon}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--hw-muted)', marginTop: '8px' }}>{tr.featured_coming_soon_sub}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--hw-border)' }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/shop" className="btn-outline inline-flex items-center gap-2">
              Shop All Styles <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'var(--hw-surface)', borderTop: '1px solid var(--hw-border)', borderBottom: '1px solid var(--hw-border)', padding: '100px 0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="hw-eyebrow mb-4">The process</div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2rem,4vw,3rem)', color: 'var(--hw-white)' }}>
              How it <em style={{ color: 'var(--hw-accent2)' }}>works.</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--hw-border)' }}>
            {STEPS.map((step) => (
              <div key={step.num} style={{ background: 'var(--hw-surface)', padding: '40px 28px' }}>
                <div style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '4rem', color: 'var(--hw-border)', lineHeight: 1, marginBottom: '24px' }}>{step.num}</div>
                <h3 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '1.2rem', color: 'var(--hw-white)', marginBottom: '10px' }}>{step.title}</h3>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--hw-muted)' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND PULL QUOTE ── */}
      <section style={{ background: 'var(--hw-off)', borderBottom: '1px solid var(--hw-border)', padding: '100px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(201,64,42,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', position: 'relative', zIndex: 1 }}>
          <blockquote style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(1.5rem,3vw,2.5rem)', lineHeight: 1.35, color: 'var(--hw-white)', marginBottom: '24px' }}>
            &ldquo;{tr.cta_heading}&rdquo;
          </blockquote>
          <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--hw-muted)' }}>
            — The He<span style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', top: '-0.05em' }}><svg viewBox="0 0 20 18" style={{ width: '0.65em', height: '0.65em', fill: 'var(--hw-accent)' }}><path d="M10 17S1 11 1 5.5A4.5 4.5 0 0110 3a4.5 4.5 0 019 2.5C19 11 10 17 10 17z"/></svg></span>rtwear Store
          </p>
        </div>
      </section>

      {/* ── OUR PROMISE ── */}
      <section style={{ background: 'var(--hw-black)', padding: '100px 0', borderBottom: '1px solid var(--hw-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <div className="hw-eyebrow mb-4">{tr.promise_eyebrow}</div>
            <h2 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2rem,4vw,3rem)', color: 'var(--hw-white)' }}>
              {tr.promise_heading}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: 'var(--hw-border)' }}>
            {[
              { title: tr.promise_1_title, body: tr.promise_1_body },
              { title: tr.promise_2_title, body: tr.promise_2_body },
              { title: tr.promise_3_title, body: tr.promise_3_body },
            ].map((p, i) => (
              <div key={i} style={{ background: 'var(--hw-black)', padding: '48px 32px' }}>
                <h3 style={{ fontFamily: 'var(--font-dm-serif)', fontSize: '1.3rem', color: 'var(--hw-white)', marginBottom: '12px' }}>{p.title}</h3>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--hw-muted)' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UPLOAD CTA ── */}
      <section style={{ background: 'var(--hw-surface)', padding: '100px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: 'clamp(2rem,4vw,3rem)', lineHeight: 1.1, color: 'var(--hw-white)', marginBottom: '16px' }}>
            Got something<br/><em style={{ color: 'var(--hw-accent2)' }}>worth wearing?</em>
          </h2>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--hw-muted)', marginBottom: '40px' }}>
            {tr.cta_body}
          </p>
          <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
            {tr.cta_button} <ArrowRight size={13} />
          </Link>
        </div>
      </section>
    </>
  )
}
