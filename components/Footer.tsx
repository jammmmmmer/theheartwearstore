import Link from 'next/link'
import { Leaf } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand column */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Leaf size={16} className="text-sage-400" strokeWidth={1.5} />
              <span className="font-playfair text-lg text-white tracking-wide">
                The Heartwear Store
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
              Made with love. Printed with purpose.
            </p>
          </div>

          {/* Links column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest text-stone-500 font-inter font-medium mb-1">
              Explore
            </h3>
            <Link
              href="/shop"
              className="text-sm text-stone-400 hover:text-white transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-sm text-stone-400 hover:text-white transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm text-stone-400 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Legal column */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest text-stone-500 font-inter font-medium mb-1">
              Legal
            </h3>
            <Link
              href="/privacy"
              className="text-sm text-stone-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-stone-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <p>&copy; {year} The Heartwear Store. All rights reserved.</p>
          <p>Thoughtfully made in Canada.</p>
        </div>
      </div>
    </footer>
  )
}
