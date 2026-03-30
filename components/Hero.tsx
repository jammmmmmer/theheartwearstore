'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/language-context'

export default function Hero() {
  const { tr } = useTranslation()

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-100 via-stone-100 to-stone-200">
      {/* Decorative SVG leaf pattern */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <svg
          className="absolute top-12 left-8 opacity-10 text-sage-500 w-48 h-48"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 10C100 10 160 40 170 100C180 160 140 190 100 190C60 190 20 160 30 100C40 40 100 10 100 10Z"
            fill="currentColor"
          />
          <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="100" y1="80" x2="130" y2="60" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="100" y1="100" x2="70" y2="80" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="100" y1="120" x2="135" y2="105" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="100" y1="140" x2="65" y2="128" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <svg
          className="absolute bottom-16 right-12 opacity-[0.07] text-sage-600 w-64 h-64 rotate-12"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 10C100 10 160 40 170 100C180 160 140 190 100 190C60 190 20 160 30 100C40 40 100 10 100 10Z"
            fill="currentColor"
          />
        </svg>
        <svg
          className="absolute top-1/3 right-1/4 opacity-[0.05] text-stone-400 w-20 h-20 -rotate-6"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 10C100 10 160 40 170 100C180 160 140 190 100 190C60 190 20 160 30 100C40 40 100 10 100 10Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-sage-600 mb-6 font-medium">
          {tr.hero_eyebrow}
        </p>

        <h1 className="font-playfair text-[2.75rem] sm:text-6xl lg:text-8xl text-stone-900 leading-tight mb-6">
          {tr.hero_heading_line1}
          <br />
          <span className="italic">{tr.hero_heading_line2}</span>
        </h1>

        <p className="text-stone-600 text-base sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          {tr.hero_body}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/shop" className="btn-primary inline-block">
            {tr.hero_cta_shop}
          </Link>
          <Link href="/about" className="btn-outline inline-block">
            {tr.hero_cta_story}
          </Link>
        </div>

        {/* Trust signals */}
        <div className="mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center text-xs text-stone-500 tracking-wide uppercase">
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
    </section>
  )
}
