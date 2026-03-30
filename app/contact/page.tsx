'use client'

import Link from 'next/link'
import { Mail, Clock, RefreshCw, Heart } from 'lucide-react'
import { useTranslation } from '@/lib/language-context'

export default function ContactPage() {
  const { tr } = useTranslation()

  return (
    <div className="bg-stone-50">

      {/* Header */}
      <section className="bg-stone-100 py-16 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-sage-600 mb-4">{tr.contact_eyebrow}</p>
          <h1 className="font-playfair text-4xl sm:text-5xl text-stone-900 mb-4">{tr.contact_heading}</h1>
          <p className="text-stone-500 leading-relaxed">
            {tr.contact_intro}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Contact info */}
          <div className="space-y-10">
            <div>
              <h2 className="font-playfair text-2xl text-stone-900 mb-6">{tr.contact_reach_heading}</h2>
              <a
                href="mailto:hello@theheartwearstore.ca"
                className="flex items-center gap-3 text-stone-700 hover:text-stone-900 transition-colors group"
              >
                <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                  <Mail size={18} strokeWidth={1.5} className="text-sage-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tr.contact_email_label}</p>
                  <p className="text-xs text-stone-400">{tr.contact_email_sub}</p>
                </div>
              </a>
            </div>

            <div className="space-y-5">
              <h3 className="text-xs uppercase tracking-widest text-stone-500">Good to know</h3>

              <div className="flex gap-4">
                <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={16} strokeWidth={1.5} className="text-sage-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">{tr.contact_response_title}</p>
                  <p className="text-sm text-stone-500 mt-0.5">{tr.contact_response_body}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RefreshCw size={16} strokeWidth={1.5} className="text-sage-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">{tr.contact_exchange_title}</p>
                  <p className="text-sm text-stone-500 mt-0.5">{tr.contact_exchange_body}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-9 h-9 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Heart size={16} strokeWidth={1.5} className="text-sage-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800">{tr.contact_based_title}</p>
                  <p className="text-sm text-stone-500 mt-0.5">{tr.contact_based_body}</p>
                </div>
              </div>
            </div>

            <div className="bg-stone-900 text-white px-6 py-6">
              <p className="font-playfair text-lg italic mb-2">{tr.contact_quote}</p>
              <p className="text-stone-400 text-xs">— The Heartwear Store</p>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="font-playfair text-2xl text-stone-900 mb-6">{tr.contact_faq_heading}</h2>
            <div className="divide-y divide-stone-200">
              {tr.contact_faq.map((faq) => (
                <details key={faq.q} className="group py-5 cursor-pointer">
                  <summary className="flex items-center justify-between list-none text-stone-800 text-sm font-medium hover:text-stone-900 transition-colors">
                    {faq.q}
                    <span className="text-stone-400 group-open:rotate-45 transition-transform duration-200 text-lg ml-4 flex-shrink-0">+</span>
                  </summary>
                  <p className="mt-3 text-stone-500 text-sm leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* CTA */}
      <section className="bg-stone-100 py-14 text-center">
        <div className="max-w-xl mx-auto px-4">
          <p className="text-stone-500 text-sm mb-6">{tr.contact_cta_body}</p>
          <Link href="/shop" className="btn-primary inline-block">{tr.contact_cta_button}</Link>
        </div>
      </section>

    </div>
  )
}
