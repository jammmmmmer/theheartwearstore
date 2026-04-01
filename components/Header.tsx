'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useState } from 'react'
import { useTranslation } from '@/lib/language-context'
import LanguageToggle from '@/components/LanguageToggle'

export default function Header() {
  const { totalItems, openCart } = useCartStore()
  const { tr } = useTranslation()
  const itemCount = totalItems()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-sm border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/upload-design"
            className="flex items-center group"
            aria-label="Upload a design"
          >
            <Image
              src="/logo.png"
              alt="The Heartwear Store"
              width={48}
              height={48}
              className="h-12 w-12 group-hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-stone-400 hover:text-stone-50 tracking-wide transition-colors"
            >
              {tr.nav_home}
            </Link>
            <Link
              href="/shop"
              className="text-sm text-stone-400 hover:text-stone-50 tracking-wide transition-colors"
            >
              {tr.nav_shop}
            </Link>
            <Link
              href="/about"
              className="text-sm text-stone-400 hover:text-stone-50 tracking-wide transition-colors"
            >
              {tr.nav_about}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="hidden md:block">
              <LanguageToggle />
            </div>

            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative p-2 text-stone-50 hover:text-stone-200 transition-colors"
              aria-label={`${tr.nav_open_cart} — ${itemCount} ${itemCount !== 1 ? tr.nav_items : tr.nav_item}`}
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-sage-600 text-white text-[10px] font-medium rounded-full flex items-center justify-center leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-2 text-stone-400 hover:text-stone-50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-stone-950 border-t border-stone-800 px-4 py-4 flex flex-col gap-4 animate-fade-in">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-stone-400 hover:text-stone-50 tracking-wide py-1"
          >
            {tr.nav_home}
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-stone-400 hover:text-stone-50 tracking-wide py-1"
          >
            {tr.nav_shop}
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-stone-400 hover:text-stone-50 tracking-wide py-1"
          >
            {tr.nav_about}
          </Link>
          <div className="pt-1 border-t border-stone-800">
            <LanguageToggle />
          </div>
        </nav>
      )}
    </header>
  )
}
