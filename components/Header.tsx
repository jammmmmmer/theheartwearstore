'use client'

import Link from 'next/link'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useState } from 'react'
import { useTranslation } from '@/lib/language-context'
import LanguageToggle from '@/components/LanguageToggle'
import { HeartA } from '@/components/Logo'

export default function Header() {
  const { totalItems, openCart } = useCartStore()
  const { tr } = useTranslation()
  const itemCount = totalItems()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-sm border-b"
      style={{
        background: 'rgba(10,10,10,0.92)',
        borderColor: 'var(--hw-border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Wordmark */}
          <Link href="/" className="flex items-center" aria-label="The Heartwear Store — Home">
            <span
              style={{
                fontFamily: 'var(--font-dm-serif), Georgia, serif',
                fontSize: '1.05rem',
                letterSpacing: '0.02em',
                color: 'var(--hw-white)',
              }}
            >
              The He<HeartA />rtwear Store
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '/',      label: tr.nav_home },
              { href: '/shop',  label: tr.nav_shop },
              { href: '/about', label: tr.nav_about },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: 'var(--font-space-mono), monospace',
                  fontSize: '0.62rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--hw-muted)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--hw-white)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--hw-muted)')}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <LanguageToggle />
            </div>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 transition-colors"
              style={{ color: 'var(--hw-mid)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={`${tr.nav_open_cart} — ${itemCount} ${itemCount !== 1 ? tr.nav_items : tr.nav_item}`}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-mono"
                  style={{ background: 'var(--hw-accent)', color: 'var(--hw-white)' }}
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="md:hidden p-1 transition-colors"
              style={{ color: 'var(--hw-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden border-t px-6 py-6 flex flex-col gap-5 animate-fade-in"
          style={{ background: 'var(--hw-off)', borderColor: 'var(--hw-border)' }}
        >
          {[
            { href: '/',      label: tr.nav_home },
            { href: '/shop',  label: tr.nav_shop },
            { href: '/about', label: tr.nav_about },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-space-mono), monospace',
                fontSize: '0.65rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--hw-mid)',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--hw-border)' }}>
            <LanguageToggle />
          </div>
        </nav>
      )}
    </header>
  )
}
