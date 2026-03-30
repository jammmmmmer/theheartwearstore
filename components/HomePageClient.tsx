'use client'

import HeroSection from '@/components/HeroSection'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { Leaf, Sparkles, Heart, Package, ArrowRight, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/language-context'

interface HomePageClientProps {
  products: Product[]
}

const MARQUEE_ITEMS = [
  'Wear Your Heart',
  'Print on Demand',
  'Made to Order',
  'Natural Clothing',
  'Ships to Canada & USA',
  'Zero Waste',
  'Made with Purpose',
  'Wear Your Heart',
  'Print on Demand',
  'Made to Order',
  'Natural Clothing',
  'Ships to Canada & USA',
  'Zero Waste',
  'Made with Purpose',
]

export default function HomePageClient({ products }: HomePageClientProps) {
  const { tr } = useTranslation()

  const steps = [
    {
      number: '01',
      icon: <Sparkles size={20} strokeWidth={1.5} />,
      title: 'Choose Your Piece',
      body: 'Browse our curated collection of nature-inspired tees, each designed to carry meaning.',
    },
    {
      number: '02',
      icon: <Package size={20} strokeWidth={1.5} />,
      title: 'We Print & Pack',
      body: 'Your order is printed fresh — never sitting in a warehouse, never going to waste.',
    },
    {
      number: '03',
      icon: <Heart size={20} strokeWidth={1.5} />,
      title: 'Delivered to You',
      body: 'Ships within 3–7 business days to Canada and the USA, tracked and protected.',
    },
  ]

  const promises = [
    {
      icon: <Sparkles size={22} strokeWidth={1.5} className="text-sage-400" />,
      title: tr.promise_1_title,
      body: tr.promise_1_body,
    },
    {
      icon: <Leaf size={22} strokeWidth={1.5} className="text-sage-400" />,
      title: tr.promise_2_title,
      body: tr.promise_2_body,
    },
    {
      icon: <RefreshCw size={22} strokeWidth={1.5} className="text-sage-400" />,
      title: tr.promise_3_title,
      body: tr.promise_3_body,
    },
  ]

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <HeroSection />

      {/* ── MARQUEE STRIP ────────────────────────────────────── */}
      <div className="bg-stone-900 border-y border-stone-800 py-3 overflow-hidden select-none" aria-hidden="true">
        <div className="flex animate-marquee whitespace-nowrap">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="text-stone-700 text-[10px] tracking-[0.3em] uppercase mx-6">
              {item}
              <span className="ml-6 text-stone-700">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURED COLLECTION ──────────────────────────────── */}
      <section className="bg-stone-950 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-sage-500 mb-3">
              {tr.featured_eyebrow}
            </p>
            <h2 className="font-playfair text-4xl sm:text-5xl text-stone-50">
              {tr.featured_heading}
            </h2>
          </div>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-50 transition-colors"
          >
            {tr.featured_view_all}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 border border-stone-800 rounded-sm">
            <p className="font-playfair text-xl italic text-stone-500">{tr.featured_coming_soon}</p>
            <p className="text-sm text-stone-500 mt-2">{tr.featured_coming_soon_sub}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border border-stone-700 text-stone-300 px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-stone-900 hover:text-stone-50 transition-all duration-300"
          >
            Shop All Styles
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-stone-900 border-t border-b border-stone-800 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] text-sage-500 mb-3">The process</p>
            <h2 className="font-playfair text-4xl sm:text-5xl text-stone-50">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-px bg-stone-800">
            {steps.map((step, i) => (
              <div key={i} className="bg-stone-900 p-10 flex flex-col gap-5">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-sage-400">
                    {step.icon}
                  </div>
                  <span className="font-playfair text-5xl text-stone-800 leading-none select-none">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="font-playfair text-xl text-stone-50 mb-2">{step.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR PROMISE ──────────────────────────────────────── */}
      <section className="bg-stone-950 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[10px] uppercase tracking-[0.3em] text-sage-500 mb-3">
              {tr.promise_eyebrow}
            </p>
            <h2 className="font-playfair text-4xl sm:text-5xl text-stone-50">
              {tr.promise_heading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {promises.map((p, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-5 px-4">
                <div className="w-14 h-14 bg-stone-900 border border-stone-800 rounded-full flex items-center justify-center">
                  {p.icon}
                </div>
                <div>
                  <h3 className="font-playfair text-xl text-stone-50 mb-2">{p.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRAND STATEMENT BAND ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-stone-900 py-20 border-t border-b border-stone-800">
        {/* Decorative leaf */}
        <svg
          aria-hidden="true"
          className="absolute right-0 top-0 w-72 h-72 opacity-[0.06] text-sage-500 pointer-events-none -rotate-12 translate-x-16 -translate-y-8"
          viewBox="0 0 200 200"
          fill="currentColor"
        >
          <path d="M100 10C100 10 160 40 170 100C180 160 140 190 100 190C60 190 20 160 30 100C40 40 100 10 100 10Z" />
        </svg>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-sage-500 mb-6">Our ethos</p>
          <blockquote className="font-playfair text-2xl sm:text-4xl text-stone-100 italic leading-snug mb-8">
            &ldquo;Clothing is memory. Every thread we wear carries a story — make yours worth telling.&rdquo;
          </blockquote>
          <Link
            href="/about"
            className="group inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-50 transition-colors tracking-wide"
          >
            Read our story
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="bg-stone-900 border-t border-stone-800 py-20 relative overflow-hidden">
        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '8px 8px',
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl sm:text-5xl text-stone-50 mb-4 italic leading-tight">
            {tr.cta_heading}
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed mb-10 max-w-lg mx-auto">
            {tr.cta_body}
          </p>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-3 bg-sage-600 text-white px-10 py-4 text-xs tracking-[0.2em] uppercase hover:bg-sage-500 transition-all duration-300 font-medium"
          >
            {tr.cta_button}
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </>
  )
}
