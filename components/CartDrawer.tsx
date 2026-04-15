'use client'

import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { useTranslation } from '@/lib/language-context'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore()
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
      if (url) window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const drawerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100%',
    width: '100%',
    maxWidth: '420px',
    background: 'var(--hw-off)',
    borderLeft: '1px solid var(--hw-border)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 60px rgba(0,0,0,0.6)',
    transition: 'transform 0.3s ease-out',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in"
          style={{ background: 'rgba(10,10,10,0.75)' }}
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      <aside style={drawerStyle} aria-label={tr.cart_title} aria-modal="true" role="dialog">

        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--hw-border)' }}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} strokeWidth={1.5} style={{ color: 'var(--hw-muted)' }} />
            <h2 style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif', fontSize: '1.15rem', color: 'var(--hw-white)' }}>
              {tr.cart_title}
            </h2>
          </div>
          <button
            onClick={closeCart}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--hw-muted)', padding: '4px' }}
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
              <ShoppingBag size={40} strokeWidth={1} style={{ color: 'var(--hw-border)' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--hw-muted)' }}>{tr.cart_empty}</p>
              <button onClick={closeCart} className="btn-outline text-xs">{tr.cart_continue}</button>
            </div>
          ) : (
            <ul style={{ borderTop: '1px solid var(--hw-border)' }}>
              {items.map((item) => (
                <li
                  key={`${item.product_id}-${item.variant_id}`}
                  className="flex gap-4 py-5"
                  style={{ borderBottom: '1px solid var(--hw-border)' }}
                >
                  <div
                    className="relative overflow-hidden flex-shrink-0"
                    style={{ width: '72px', height: '72px', background: 'var(--hw-surface)', border: '1px solid var(--hw-border)' }}
                  >
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="72px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={16} strokeWidth={1} style={{ color: 'var(--hw-muted)' }} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: '0.88rem', color: 'var(--hw-white)', lineHeight: 1.3, marginBottom: '2px' }} className="truncate">
                      {item.title}
                    </p>
                    <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--hw-muted)', marginBottom: '6px' }}>
                      {item.variant_title}
                    </p>
                    <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.72rem', color: 'var(--hw-accent2)' }}>
                      {formatPrice(item.price)}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center" style={{ border: '1px solid var(--hw-border)', background: 'var(--hw-surface)' }}>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', borderRight: '1px solid var(--hw-border)', cursor: 'pointer', padding: '4px 10px', color: 'var(--hw-mid)', fontFamily: 'var(--font-space-mono)', fontSize: '0.75rem' }}
                          aria-label="Decrease quantity"
                        >−</button>
                        <span style={{ padding: '4px 12px', fontFamily: 'var(--font-space-mono)', fontSize: '0.72rem', color: 'var(--hw-white)', minWidth: '32px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', borderLeft: '1px solid var(--hw-border)', cursor: 'pointer', padding: '4px 10px', color: 'var(--hw-mid)', fontFamily: 'var(--font-space-mono)', fontSize: '0.75rem' }}
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--hw-muted)', padding: '4px' }}
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.72rem', color: 'var(--hw-accent2)', flexShrink: 0, paddingTop: '2px' }}>
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t px-6 py-5 space-y-4" style={{ borderColor: 'var(--hw-border)' }}>
            {error && (
              <p style={{ fontSize: '0.75rem', color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px 12px' }}>
                {error}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '0.85rem', color: 'var(--hw-muted)' }}>{tr.cart_subtotal}</span>
              <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.85rem', color: 'var(--hw-white)' }}>{formatPrice(subtotal)}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-space-mono)', fontSize: '0.58rem', letterSpacing: '0.08em', color: 'var(--hw-muted)' }}>
              {tr.cart_shipping_note}
            </p>
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="btn-primary w-full justify-center"
              style={{ opacity: isLoading ? 0.6 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? (
                <>
                  <span style={{ width: '14px', height: '14px', border: '2px solid rgba(10,10,10,0.3)', borderTopColor: 'var(--hw-black)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                  {tr.product_redirecting}
                </>
              ) : tr.cart_checkout}
            </button>
            <div className="flex items-center justify-between">
              <button onClick={closeCart} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-space-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', color: 'var(--hw-muted)', textDecoration: 'underline' }}>
                {tr.cart_continue}
              </button>
              <button onClick={clearCart} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-space-mono)', fontSize: '0.58rem', letterSpacing: '0.1em', color: 'var(--hw-border)' }}>
                {tr.cart_clear}
              </button>
            </div>
          </div>
        )}
      </aside>

    </>
  )
}
