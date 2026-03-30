'use client'

import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { useTranslation } from '@/lib/language-context'

export default function Footer() {
  const { tr } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-stone-950 border-t border-stone-800 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Leaf size={16} className="text-sage-400" strokeWidth={1.5} />
              <span className="font-playfair text-lg text-stone-200 tracking-wide">
                The Heartwear Store
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
              {tr.footer_tagline}
            </p>
          </div>

          {/* Links column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest text-stone-600 font-inter font-medium mb-1">
              {tr.footer_explore}
            </h3>
            <Link
              href="/shop"
              className="text-sm text-stone-400 hover:text-stone-50 transition-colors"
            >
              {tr.nav_shop}
            </Link>
            <Link
              href="/about"
              className="text-sm text-stone-400 hover:text-stone-50 transition-colors"
            >
              {tr.nav_about}
            </Link>
            <Link
              href="/contact"
              className="text-sm text-stone-400 hover:text-stone-50 transition-colors"
            >
              {tr.footer_contact}
            </Link>
          </div>

          {/* Legal column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest text-stone-600 font-inter font-medium mb-1">
              {tr.footer_legal}
            </h3>
            <Link
              href="/privacy"
              className="text-sm text-stone-400 hover:text-stone-50 transition-colors"
            >
              {tr.footer_privacy}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-stone-400 hover:text-stone-50 transition-colors"
            >
              {tr.footer_terms}
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600">
          <p>&copy; {year} {tr.footer_copyright}</p>
          <p>{tr.footer_canada}</p>
        </div>
      </div>
    </footer>
  )
}
