'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'
import { useTranslation } from '@/lib/language-context'

interface LookupResult {
  ref: string
  status: string
  created_at: string
  tracking_number?: string
  tracking_carrier?: string
  tracking_url?: string
}

export default function TrackOrderPage() {
  const { tr, lang } = useTranslation()
  const [email, setEmail] = useState('')
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [order, setOrder] = useState<LookupResult | null>(null)

  const statusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: tr.status_pending,
      paid: tr.status_paid,
      submitted: tr.status_submitted,
      fulfilled: tr.status_fulfilled,
      shipped: tr.status_shipped,
      delivered: tr.status_delivered,
      failed: tr.status_failed,
    }
    return map[status] ?? status
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    try {
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, ref }),
      })
      const data = await res.json() as { found?: boolean; order?: LookupResult }
      if (data.found && data.order) {
        setOrder(data.order)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-start justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Package size={32} strokeWidth={1} className="mx-auto mb-4 text-stone-600" />
          <h1 className="font-playfair text-3xl text-stone-50 mb-2">{tr.track_title}</h1>
          <p className="text-stone-500 text-sm">{tr.track_intro}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2">
              {tr.track_email}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2">
              {tr.track_order_ref}
            </label>
            <input
              type="text"
              required
              minLength={6}
              maxLength={12}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. 4F3A9C21"
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>

          {notFound && (
            <p className="text-red-400 text-xs tracking-wide">{tr.track_not_found}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d64533] text-white py-4 text-[15px] font-semibold rounded-control hover:bg-[#b23222] transition-colors disabled:opacity-40"
          >
            {loading ? tr.track_searching : tr.track_button}
          </button>
        </form>

        {order && (
          <div className="mt-8 border border-stone-800 bg-stone-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs tracking-widest text-stone-500">#{order.ref}</span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-sage-500 border border-sage-800 px-3 py-1">
                {statusLabel(order.status)}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {tr.track_placed}{' '}
              {new Date(order.created_at).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
            {order.tracking_number && (
              <div className="pt-3 border-t border-stone-800">
                <p className="text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-1">{tr.track_tracking}</p>
                {order.tracking_url ? (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage-400 text-sm underline underline-offset-4"
                  >
                    {order.tracking_number}
                    {order.tracking_carrier ? ` — ${order.tracking_carrier.toUpperCase()}` : ''}
                  </a>
                ) : (
                  <p className="text-stone-300 text-sm font-mono">
                    {order.tracking_number}
                    {order.tracking_carrier ? ` — ${order.tracking_carrier.toUpperCase()}` : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
