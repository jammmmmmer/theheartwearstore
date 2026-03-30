'use client'

import Link from 'next/link'
import { Leaf, Heart, Recycle, Globe } from 'lucide-react'
import { useTranslation } from '@/lib/language-context'

export default function AboutPage() {
  const { tr } = useTranslation()

  const values = [
    {
      icon: Heart,
      title: tr.about_val_1_title,
      body: tr.about_val_1_body,
    },
    {
      icon: Recycle,
      title: tr.about_val_2_title,
      body: tr.about_val_2_body,
    },
    {
      icon: Leaf,
      title: tr.about_val_3_title,
      body: tr.about_val_3_body,
    },
    {
      icon: Globe,
      title: tr.about_val_4_title,
      body: tr.about_val_4_body,
    },
  ]

  return (
    <div className="bg-stone-950">

      {/* Hero */}
      <section className="relative bg-stone-950 text-stone-50 py-24 sm:py-32 overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg className="absolute bottom-0 right-0 opacity-[0.07] w-96 h-96 text-sage-500" viewBox="0 0 200 200" fill="none">
            <path d="M100 10C100 10 160 40 170 100C180 160 140 190 100 190C60 190 20 160 30 100C40 40 100 10 100 10Z" fill="currentColor" />
          </svg>
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-sage-400 mb-6">{tr.about_eyebrow}</p>
          <h1 className="font-playfair text-4xl sm:text-6xl text-stone-50 leading-tight mb-6">
            {tr.about_heading_1}<br />
            <span className="italic">{tr.about_heading_2}</span>
          </h1>
          <p className="text-stone-400 text-lg leading-relaxed max-w-2xl mx-auto">
            {tr.about_intro}
          </p>
        </div>
      </section>

      {/* Origin story */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-8 text-stone-400 text-[1.05rem] leading-relaxed">
          <p>{tr.about_p1}</p>
          <p>{tr.about_p2}</p>
          <p>{tr.about_p3}</p>
          <p>{tr.about_p4}</p>
          <blockquote className="border-l-2 border-sage-600 pl-6 italic text-stone-300 text-xl font-playfair my-10">
            {tr.about_quote}
          </blockquote>
          <p>{tr.about_p5}</p>
          <p>{tr.about_p6}</p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-stone-900 border-t border-stone-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest text-sage-500 mb-3">{tr.about_values_eyebrow}</p>
            <h2 className="font-playfair text-4xl text-stone-50">{tr.about_values_heading}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {values.map((v) => (
              <div key={v.title} className="flex flex-col gap-4">
                <div className="w-10 h-10 bg-stone-900 border border-stone-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <v.icon size={20} strokeWidth={1.5} className="text-sage-400" />
                </div>
                <div>
                  <h3 className="font-playfair text-lg text-stone-50 mb-2">{v.title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promise */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-xs uppercase tracking-widest text-sage-500 mb-4">{tr.about_promise_eyebrow}</p>
        <h2 className="font-playfair text-3xl sm:text-4xl text-stone-50 mb-6">
          {tr.about_promise_heading}
        </h2>
        <p className="text-stone-400 leading-relaxed mb-4">
          {tr.about_promise_p1}
        </p>
        <p className="text-stone-400 leading-relaxed mb-10">
          {tr.about_promise_p2}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop" className="btn-primary inline-block">
            {tr.about_cta_shop}
          </Link>
          <Link href="/contact" className="btn-outline inline-block">
            {tr.about_cta_contact}
          </Link>
        </div>
      </section>

    </div>
  )
}
