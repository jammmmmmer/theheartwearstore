'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
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

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(92,135,92,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Large botanical leaf — top left */}
      <svg
        aria-hidden="true"
        className="absolute -top-16 -left-16 w-[420px] h-[420px] opacity-[0.10] text-sage-700 pointer-events-none select-none"
        viewBox="0 0 400 400"
        fill="currentColor"
      >
        <path d="M200 20 C200 20 340 80 360 200 C380 320 300 380 200 380 C100 380 20 320 40 200 C60 80 200 20 200 20Z" />
        <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <line x1="200" y1="160" x2="260" y2="120" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        <line x1="200" y1="200" x2="140" y2="160" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        <line x1="200" y1="240" x2="270" y2="210" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        <line x1="200" y1="280" x2="130" y2="256" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </svg>

      {/* Large botanical leaf — bottom right */}
      <svg
        aria-hidden="true"
        className="absolute -bottom-24 -right-20 w-[520px] h-[520px] opacity-[0.10] text-sage-700 pointer-events-none select-none rotate-[25deg]"
        viewBox="0 0 400 400"
        fill="currentColor"
      >
        <path d="M200 20 C200 20 340 80 360 200 C380 320 300 380 200 380 C100 380 20 320 40 200 C60 80 200 20 200 20Z" />
      </svg>

      {/* Small leaf — mid right */}
      <svg
        aria-hidden="true"
        className="absolute top-1/3 right-[8%] w-24 h-24 opacity-[0.10] text-sage-700 pointer-events-none select-none -rotate-12"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M100 10C100 10 160 40 170 100C180 160 140 190 100 190C60 190 20 160 30 100C40 40 100 10 100 10Z" />
      </svg>

      {/* Hero content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center w-full">

        {/* Eyebrow */}
        <p
          className={`text-xs uppercase tracking-[0.4em] text-sage-500 mb-8 font-medium transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {tr.hero_eyebrow}
        </p>

        {/* Main headline */}
        <h1
          className={`font-playfair leading-[0.88] mb-8 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ fontSize: 'clamp(3.8rem, 13vw, 11rem)' }}
        >
          <span className="block text-stone-50">{tr.hero_heading_line1}</span>
          <em className="block italic text-sage-400">{tr.hero_heading_line2}</em>
        </h1>

        {/* Thin rule */}
        <div
          className={`w-16 h-px bg-sage-700 mx-auto mb-8 transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />

        {/* Sub-headline */}
        <p
          className={`text-stone-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 transition-all duration-700 delay-[400ms] ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {tr.hero_body}
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 bg-sage-600 text-white px-9 py-4 text-xs tracking-[0.2em] uppercase hover:bg-sage-500 transition-all duration-300 min-w-[180px] justify-center"
          >
            {tr.hero_cta_shop}
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 border border-stone-700 text-stone-300 px-9 py-4 text-xs tracking-[0.2em] uppercase hover:border-stone-400 hover:text-stone-100 transition-all duration-300 min-w-[180px] justify-center"
          >
            {tr.hero_cta_story}
          </Link>
        </div>

        {/* Trust signals */}
        <div
          className={`flex flex-col sm:flex-row gap-3 sm:gap-8 justify-center items-center text-[10px] text-stone-700 tracking-[0.25em] uppercase transition-all duration-700 delay-[600ms] ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sage-800 inline-block" />
            {tr.hero_trust_1}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sage-800 inline-block" />
            {tr.hero_trust_2}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sage-800 inline-block" />
            {tr.hero_trust_3}
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
        <div className="w-5 h-8 border border-stone-700 rounded-full flex justify-center pt-1.5">
          <div className="w-0.5 h-2 bg-stone-600 rounded-full" />
        </div>
      </div>
    </section>
  )
}
