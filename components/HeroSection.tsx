'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/language-context'

export default function HeroSection() {
  const { tr } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-stone-950">

      {/* Background photo */}
      <Image
        src="/hero-bg.png"
        alt=""
        fill
        priority
        unoptimized
        className="object-cover object-center"
        style={{ opacity: 0.45 }}
      />

      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-stone-950/60 pointer-events-none" />

      {/* Halftone dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(92,135,92,0.10) 1.5px, transparent 1.5px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Double decorative border */}
      <div className="absolute inset-5 sm:inset-8 border border-stone-800 pointer-events-none" />
      <div className="absolute inset-7 sm:inset-10 border border-stone-800 opacity-30 pointer-events-none" />

      {/* Corner brackets — top-left */}
      <svg aria-hidden="true" className="absolute top-4 left-4 sm:top-7 sm:left-7 w-7 h-7 text-sage-700 opacity-70 pointer-events-none" viewBox="0 0 28 28" fill="none">
        <path d="M0 0 L14 0" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M0 0 L0 14" stroke="currentColor" strokeWidth="1.5"/>
      </svg>

      {/* Corner brackets — top-right */}
      <svg aria-hidden="true" className="absolute top-4 right-4 sm:top-7 sm:right-7 w-7 h-7 text-sage-700 opacity-70 pointer-events-none" viewBox="0 0 28 28" fill="none">
        <path d="M28 0 L14 0" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M28 0 L28 14" stroke="currentColor" strokeWidth="1.5"/>
      </svg>

      {/* Corner brackets — bottom-left */}
      <svg aria-hidden="true" className="absolute bottom-10 left-4 sm:bottom-10 sm:left-7 w-7 h-7 text-sage-700 opacity-70 pointer-events-none" viewBox="0 0 28 28" fill="none">
        <path d="M0 28 L14 28" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M0 28 L0 14" stroke="currentColor" strokeWidth="1.5"/>
      </svg>

      {/* Corner brackets — bottom-right */}
      <svg aria-hidden="true" className="absolute bottom-10 right-4 sm:bottom-10 sm:right-7 w-7 h-7 text-sage-700 opacity-70 pointer-events-none" viewBox="0 0 28 28" fill="none">
        <path d="M28 28 L14 28" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M28 28 L28 14" stroke="currentColor" strokeWidth="1.5"/>
      </svg>

      {/* Rotated stamp badge — upper right */}
      <div
        className={`absolute top-16 right-10 sm:top-20 sm:right-20 transition-all duration-700 delay-700 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative w-[72px] h-[72px] rotate-[14deg]">
          <svg viewBox="0 0 72 72" className="w-full h-full text-sage-800" fill="none">
            <circle cx="36" cy="36" r="32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
            <circle cx="36" cy="36" r="24" stroke="currentColor" strokeWidth="1"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-0.5">
            <span className="text-[6.5px] tracking-[0.3em] uppercase text-sage-700 leading-tight">Made</span>
            <span className="text-[6.5px] tracking-[0.3em] uppercase text-sage-700 leading-tight">With</span>
            <span className="text-[6.5px] tracking-[0.3em] uppercase text-sage-700 leading-tight">Love</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-10 sm:px-20 text-center w-full">

        {/* Eyebrow */}
        <p
          className={`text-[9px] uppercase tracking-[0.55em] text-sage-700 mb-7 flex items-center justify-center gap-3 transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span>✦</span>
          {tr.hero_eyebrow}
          <span>✦</span>
        </p>

        {/* Headline line 1 — spaced all-caps */}
        <div
          className={`transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span
            className="block font-playfair text-stone-300 uppercase leading-none"
            style={{ fontSize: 'clamp(1.5rem, 6.5vw, 5rem)', letterSpacing: '0.22em' }}
          >
            {tr.hero_heading_line1}
          </span>
        </div>

        {/* Headline line 2 — giant italic centrepiece */}
        <div
          className={`mb-2 transition-all duration-700 delay-[260ms] ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <em
            className="block font-playfair italic text-sage-400 leading-none"
            style={{ fontSize: 'clamp(5.5rem, 22vw, 16rem)' }}
          >
            {tr.hero_heading_line2}
          </em>
        </div>

        {/* Ornamental rule */}
        <div
          className={`flex items-center justify-center gap-3 mb-7 transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="h-px bg-stone-800 flex-1 max-w-[80px]" />
          <span className="text-sage-800 text-xs">✦</span>
          <span className="text-[8px] tracking-[0.45em] uppercase text-stone-700">The Heartwear Store</span>
          <span className="text-sage-800 text-xs">✦</span>
          <div className="h-px bg-stone-800 flex-1 max-w-[80px]" />
        </div>

        {/* Body copy */}
        <p
          className={`text-stone-500 text-sm max-w-sm mx-auto leading-loose mb-10 transition-all duration-700 delay-[400ms] ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {tr.hero_body}
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 bg-sage-800 border border-sage-700 text-stone-200 px-10 py-4 text-[9px] tracking-[0.4em] uppercase hover:bg-sage-700 transition-all duration-300 min-w-[190px] justify-center"
          >
            ✦ {tr.hero_cta_shop} ✦
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 border border-stone-700 text-stone-600 px-10 py-4 text-[9px] tracking-[0.4em] uppercase hover:border-stone-500 hover:text-stone-300 transition-all duration-300 min-w-[190px] justify-center"
          >
            {tr.hero_cta_story}
          </Link>
        </div>

        {/* Trust signals */}
        <div
          className={`flex flex-col sm:flex-row gap-2 sm:gap-6 justify-center items-center text-[8px] text-stone-700 tracking-[0.35em] uppercase transition-all duration-700 delay-[600ms] ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span>— {tr.hero_trust_1} —</span>
          <span>— {tr.hero_trust_2} —</span>
          <span>— {tr.hero_trust_3} —</span>
        </div>
      </div>

      {/* Marquee ticker */}
      <div className="absolute bottom-0 left-0 right-0 h-9 border-t border-stone-800 overflow-hidden flex items-center">
        <div className="animate-marquee whitespace-nowrap inline-flex">
          {[0, 1].map((copy) => (
            <span key={copy} className="inline-flex">
              {[
                'The Heartwear Store',
                'Natural Fashion',
                'Made To Order',
                'Wear Your Heart',
                'Print On Demand',
                'Ships to Canada & USA',
              ].map((item, i) => (
                <span
                  key={i}
                  className="text-[8px] tracking-[0.45em] uppercase text-stone-700 mx-10"
                >
                  ✦ {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
