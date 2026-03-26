'use client'

import Link from 'next/link'
import { ShoppingBag, Leaf, Menu, X } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useState } from 'react'

export default function Header() {
  const { totalItems, openCart } = useCartStore()
  const itemCount = totalItems()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            aria-label="The Heartwear Store — home"
          >
            <Leaf
              size={18}
              className="text-sage-500 group-hover:text-sage-600 transition-colors"
              strokeWidth={1.5}
            />
            <span className="font-playfair text-lg text-stone-900 tracking-wide">
              The Heartwear Store
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm text-stone-600 hover:text-stone-900 tracking-wide transition-colors"
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="text-sm text-stone-600 hover:text-stone-900 tracking-wide transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-sm text-stone-600 hover:text-stone-900 tracking-wide transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart button */}
            <button
              onClick={openCart}
              className="relative p-2 text-stone-700 hover:text-stone-900 transition-colors"
              aria-label={`Open cart — ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-stone-900 text-white text-[10px] font-medium rounded-full flex items-center justify-center leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-2 text-stone-700 hover:text-stone-900 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-stone-50 border-t border-stone-200 px-4 py-4 flex flex-col gap-4 animate-fade-in">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-stone-700 hover:text-stone-900 tracking-wide py-1"
          >
            Home
          </Link>
          <Link
            href="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-stone-700 hover:text-stone-900 tracking-wide py-1"
          >
            Shop
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm text-stone-700 hover:text-stone-900 tracking-wide py-1"
          >
            About
          </Link>
        </nav>
      )}
    </header>
  )
}
