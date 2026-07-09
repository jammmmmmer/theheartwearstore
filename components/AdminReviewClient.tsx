'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface PendingItem {
  id: string
  title: string
  mockup_url: string | null
  topic: string | null
  created_at: string
}

export interface CustomItem {
  id: string
  title: string
  image: string
  price_from: number
}

type CardState = 'idle' | 'loading' | 'done'

export default function AdminReviewClient({
  pending,
  customs,
}: {
  pending: PendingItem[]
  customs: CustomItem[]
}) {
  const [states, setStates] = useState<Record<string, CardState>>({})
  const [labels, setLabels] = useState<Record<string, string>>({})

  async function act(
    id: string,
    body: Record<string, string>,
    doneLabel: string
  ) {
    setStates((s) => ({ ...s, [id]: 'loading' }))
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Error ${res.status}`)
      }
      setStates((s) => ({ ...s, [id]: 'done' }))
      setLabels((l) => ({ ...l, [id]: doneLabel }))
    } catch (e) {
      setStates((s) => ({ ...s, [id]: 'idle' }))
      alert(e instanceof Error ? e.message : 'Action failed')
    }
  }

  const price = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-2">The Heartwear Store</p>
            <h1 className="font-playfair text-3xl text-stone-50">Review Queue</h1>
          </div>
          <Link
            href="/upload-design"
            className="text-[10px] tracking-[0.3em] uppercase text-stone-400 border border-stone-700 hover:border-stone-500 px-4 py-2 transition-colors"
          >
            + Upload a design
          </Link>
        </div>

        {/* Pending designs */}
        <section className="mb-14">
          <h2 className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-4">
            Pending designs ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-stone-600 text-sm">Nothing waiting for review.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pending.map((p) => {
                const state = states[p.id] ?? 'idle'
                return (
                  <div key={p.id} className={`border rounded-card overflow-hidden ${state === 'done' ? 'border-sage-700 opacity-60' : 'border-stone-800'}`}>
                    {p.mockup_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.mockup_url} alt={p.title} className="w-full aspect-square object-cover bg-stone-900" />
                    ) : (
                      <div className="w-full aspect-square bg-stone-900" />
                    )}
                    <div className="p-4">
                      <p className="text-stone-200 text-sm font-medium truncate">{p.title}</p>
                      {p.topic && <p className="text-stone-600 text-xs mt-0.5 truncate">{p.topic}</p>}
                      {state === 'done' ? (
                        <p className="text-sage-500 text-[10px] tracking-[0.3em] uppercase py-3 text-center">{labels[p.id]}</p>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button
                            disabled={state === 'loading'}
                            onClick={() => act(p.id, { action: 'approve', pendingId: p.id }, '✓ Posted to shop')}
                            className="flex-1 bg-sage-700 hover:bg-sage-600 text-stone-100 py-2.5 text-[9px] tracking-[0.3em] uppercase transition-colors disabled:opacity-50 rounded"
                          >
                            {state === 'loading' ? '…' : 'Post to shop'}
                          </button>
                          <button
                            disabled={state === 'loading'}
                            onClick={() => act(p.id, { action: 'reject', pendingId: p.id }, '✕ Rejected')}
                            className="flex-1 border border-stone-700 text-stone-500 hover:text-stone-300 py-2.5 text-[9px] tracking-[0.3em] uppercase transition-colors disabled:opacity-50 rounded"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Customer creations */}
        <section>
          <h2 className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-1">
            Customer creations ({customs.length})
          </h2>
          <p className="text-stone-600 text-xs mb-4">Public custom uploads. Add the good ones to the shop collection.</p>
          {customs.length === 0 ? (
            <p className="text-stone-600 text-sm">No customer uploads yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {customs.map((c) => {
                const state = states[c.id] ?? 'idle'
                return (
                  <div key={c.id} className={`border rounded-card overflow-hidden ${state === 'done' ? 'border-sage-700 opacity-60' : 'border-stone-800'}`}>
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt={c.title} className="w-full aspect-square object-cover bg-stone-900" />
                    ) : (
                      <div className="w-full aspect-square bg-stone-900" />
                    )}
                    <div className="p-4">
                      <Link href={`/shop/${c.id}`} className="text-stone-200 text-sm font-medium truncate hover:text-sage-400 block">
                        {c.title}
                      </Link>
                      <p className="text-stone-600 text-xs mt-0.5">From {price(c.price_from)}</p>
                      {state === 'done' ? (
                        <p className="text-sage-500 text-[10px] tracking-[0.3em] uppercase py-3 text-center">{labels[c.id]}</p>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <button
                            disabled={state === 'loading'}
                            onClick={() => act(c.id, { action: 'promote', productId: c.id }, '✓ Added to shop')}
                            className="flex-1 bg-sage-700 hover:bg-sage-600 text-stone-100 py-2.5 text-[9px] tracking-[0.3em] uppercase transition-colors disabled:opacity-50 rounded"
                          >
                            {state === 'loading' ? '…' : 'Add to shop'}
                          </button>
                          <button
                            disabled={state === 'loading'}
                            onClick={() => act(c.id, { action: 'hide', productId: c.id }, '✕ Hidden')}
                            className="flex-1 border border-stone-700 text-stone-500 hover:text-stone-300 py-2.5 text-[9px] tracking-[0.3em] uppercase transition-colors disabled:opacity-50 rounded"
                          >
                            Hide
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
