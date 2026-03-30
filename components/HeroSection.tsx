'use client'

import Link from 'next/link'
import { ArrowRight, Leaf } from 'lucide-react'
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
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#f7f4ef]">

      {/* Subtle animated gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(125,164,125,0.08) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(125,164,125,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Large botanical leaf — top left */}
      <svg
        aria-hidden="true"
        className="absolute -top-16 -left-16 w-[420px] h-[420px] opacity-[0.07] text-sage-500 pointer-events-none select-none"
        viewBox="0 0 400 400"
        fill="currentColor"
      >
        <path d="M200 20 C200 20 340 80 360 200 C380 320 300 380 200 380 C100 380 20 320 40 200 C60 80 200 20 200 20Z" />
        <line x1="200" y1="20" x2="200" y2="380" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="200" y1="160" x2="260" y2="120" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="200" y1="200" x2="140" y2="160" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="200" y1="240" x2="270" y2="210" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="200" y1="280" x2="130" y2="256" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* Large botanical leaf — bottom right */}
      <svg
        aria-hidden="true"
        className="absolute -bottom-24 -right-20 w-[520px] h-[520px] opacity-[0.05] text-sage-600 pointer-events-none select-none rotate-[25deg]"
        viewBox="0 0 400 400"
        fill="currentColor"
      >
        <path d="M200 20 C200 20 340 80 360 200 C380 320 300 380 200 380 C100 380 20 320 40 200 C60 80 200 20 200 20Z" />
      </svg>

      {/* Small leaf — mid right */}
      <svg
        aria-hidden="true"
        className="absolute top-1/3 right-[8%] w-24 h-24 opacity-[0.09] text-sage-500 pointer-events-none select-none -rotate-12"
        viewBox="0 0 200 200"
        fill="currentColor"
      >
        <path d="M100 10C100 10 160 40 170 100C180 160 140 190 100 190C60 190 20 160 30 100C40 40 100 10 100 10Z" />
      </svg>

      {/* Hero content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center w-full">

        {/* Eyebrow */}
        <p
          className={`text-xs uppercase tracking-[0.4em] text-sage-600 mb-8 font-medium transition-all duration-700 delay-100 ${
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
          <span className="block text-stone-900">{tr.hero_heading_line1}</span>
          <em className="block italic text-sage-600">{tr.hero_heading_line2}</em>
        </h1>

        {/* Thin rule */}
        <div
          className={`w-16 h-px bg-sage-400 mx-auto mb-8 transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        />

        {/* Sub-headline */}
        <p
          className={`text-stone-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10 transition-all duration-700 delay-[400ms] ${
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
            className="group inline-flex items-center gap-2 bg-stone-900 text-white px-9 py-4 text-xs tracking-[0.2em] uppercase hover:bg-stone-800 transition-all duration-300 min-w-[180px] justify-center"
          >
            {tr.hero_cta_shop}
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 border border-stone-300 text-stone-600 px-9 py-4 text-xs tracking-[0.2em] uppercase hover:border-stone-900 hover:text-stone-900 transition-all duration-300 min-w-[180px] justify-center"
          >
            {tr.hero_cta_story}
          </Link>
        </div>

        {/* Trust signals */}
        <div
          className={`flex flex-col sm:flex-row gap-3 sm:gap-8 justify-center items-center text-[10px] text-stone-400 tracking-[0.25em] uppercase transition-all duration-700 delay-[600ms] ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sage-400 inline-block" />
            {tr.hero_trust_1}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sage-400 inline-block" />
            {tr.hero_trust_2}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-sage-400 inline-block" />
            {tr.hero_trust_3}
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
        <div className="w-5 h-8 border border-stone-400 rounded-full flex justify-center pt-1.5">
          <div className="w-0.5 h-2 bg-stone-500 rounded-full" />
        </div>
      </div>
    </section>
  )
}
