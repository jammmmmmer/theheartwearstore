'use client'

import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from '@/lib/language-context'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, clearCart } =
    useCartStore()
  const { tr } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = totalPrice()

  async function handleCheckout() {
    if (items.length === 0) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Failed to create checkout session')
      }

      const { url } = await res.json() as { url: string }
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 z-40 animate-fade-in"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-stone-50 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label={tr.cart_title}
        aria-modal="true"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} strokeWidth={1.5} className="text-stone-700" />
            <h2 className="font-playfair text-xl text-stone-900">{tr.cart_title}</h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 text-stone-500 hover:text-stone-900 transition-colors rounded"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag size={40} strokeWidth={1} className="text-stone-300" />
              <p className="text-stone-500 text-sm">{tr.cart_empty}</p>
              <button
                onClick={closeCart}
                className="btn-outline text-xs"
              >
                {tr.cart_continue}
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-stone-200">
              {items.map((item) => (
                <li
                  key={`${item.product_id}-${item.variant_id}`}
                  className="py-5 flex gap-4"
                >
                  {/* Image */}
                  <div className="w-20 h-20 bg-stone-100 flex-shrink-0 relative overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                        <ShoppingBag size={16} className="text-stone-400" strokeWidth={1} />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-stone-900 text-sm font-medium leading-snug truncate">
                      {item.title}
                    </p>
                    <p className="text-stone-500 text-xs mt-0.5">{item.variant_title}</p>
                    <p className="text-stone-700 text-sm mt-1">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity + Remove */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-stone-300">
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.variant_id, item.quantity - 1)
                          }
                          className="px-2.5 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors text-sm"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-sm text-stone-900 border-x border-stone-300 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product_id, item.variant_id, item.quantity + 1)
                          }
                          className="px-2.5 py-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors text-sm"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Line total */}
                  <p className="text-stone-900 text-sm font-medium flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 px-6 py-5 space-y-4">
            {error && (
              <p className="text-red-600 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-stone-600 text-sm">{tr.cart_subtotal}</span>
              <span className="text-stone-900 font-medium">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-stone-400">
              {tr.cart_shipping_note}
            </p>

            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {tr.product_redirecting}
                </>
              ) : (
                tr.cart_checkout
              )}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={closeCart}
                className="text-stone-500 hover:text-stone-900 transition-colors underline underline-offset-2"
              >
                {tr.cart_continue}
              </button>
              <button
                onClick={clearCart}
                className="text-stone-400 hover:text-red-500 transition-colors"
              >
                {tr.cart_clear}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
