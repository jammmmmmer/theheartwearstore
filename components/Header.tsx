'use client'

import Link from 'next/link'
import { ShoppingBag, Menu, X, User } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/language-context'
import LanguageToggle from '@/components/LanguageToggle'
import CurrencyToggle from '@/components/CurrencyToggle'
import { HeartA } from '@/components/Logo'

export default function Header() {
  const { totalItems, openCart } = useCartStore()
  const { tr } = useTranslation()
  const itemCount = totalItems()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Suppress cart badge on SSR to avoid hydration mismatch with persisted Zustand state
  const [mounted, setMounted] = useState(false)
  // Admin links appear only when an admin is signed in (hs_user cookie). The
  // pages themselves are still protected server-side by proxy.ts, so this only
  // controls visibility of the links, not access.
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    setMounted(true)
    setIsAdmin(document.cookie.split('; ').some(r => r.startsWith('hs_user=') && r.length > 'hs_user='.length))
  }, [])

  return (
    <header className="sticky top-0 z-40 hw-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Wordmark */}
          <Link href="/" className="flex items-center" aria-label="The Heartwear Store — Home">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 700,
                letterSpacing: '0.01em',
                textTransform: 'uppercase',
                color: 'var(--hw-white)',
              }}
            >
              The He<HeartA />rtwear Store
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '/',       label: tr.nav_home },
              { href: '/shop',   label: tr.nav_shop },
              { href: '/collections', label: tr.nav_collections },
              { href: '/create', label: tr.nav_customize },
              { href: '/about',  label: tr.nav_about },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--hw-mid)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--hw-accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--hw-mid)')}
              >
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/review"
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--hw-accent)',
                  textDecoration: 'none',
                }}
              >
                {tr.nav_admin}
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <CurrencyToggle />
              <LanguageToggle />
            </div>

            {/* Account / Sign in */}
            <Link
              href="/account"
              className="flex items-center transition-colors"
              style={{ color: 'var(--hw-mid)' }}
              aria-label={tr.nav_account}
              title={tr.nav_account}
            >
              <User size={20} strokeWidth={1.5} />
            </Link>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative flex items-center gap-2 transition-colors"
              style={{ color: 'var(--hw-mid)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={mounted ? `${tr.nav_open_cart} — ${itemCount} ${itemCount !== 1 ? tr.nav_items : tr.nav_item}` : tr.nav_open_cart}
            >
              <ShoppingBag size={20} strokeWidth={1.5} />
              {mounted && itemCount > 0 && (
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
            { href: '/',       label: tr.nav_home },
            { href: '/shop',   label: tr.nav_shop },
            { href: '/create', label: tr.nav_customize },
            { href: '/about',  label: tr.nav_about },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '1rem',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: 'var(--hw-white)',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/review"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '1rem',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: 'var(--hw-accent)',
                textDecoration: 'none',
              }}
            >
              {tr.nav_admin}
            </Link>
          )}
          <div className="pt-2 border-t flex items-center gap-4" style={{ borderColor: 'var(--hw-border)' }}>
            <CurrencyToggle />
            <LanguageToggle />
          </div>
        </nav>
      )}
    </header>
  )
}
