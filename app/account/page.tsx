'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/language-context'
import { useCurrency } from '@/lib/currency-context'

interface OrderRow {
  id: string
  created_at: string
  status: string
  total_amount: number
  currency: string
  line_items: { title: string; variant_title?: string; quantity: number }[]
  shipping_address: { line1?: string; line2?: string; city?: string; state?: string; postal_code?: string; country?: string } | null
  customer_name: string | null
  tracking_number: string | null
  tracking_url: string | null
}

export default function AccountPage() {
  const { tr } = useTranslation()
  const { display } = useCurrency()

  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [accountEmail, setAccountEmail] = useState('')

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) return
      setAccountEmail(data.session?.user.email ?? '')
      const res = await fetch('/api/account/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (res.ok) setOrders(json.orders ?? [])
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const has = !!data.session
      setSignedIn(has)
      setReady(true)
      if (has) loadOrders()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session)
      if (session) loadOrders()
      else setOrders([])
    })
    return () => sub.subscription.unsubscribe()
  }, [loadOrders])

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage({ kind: 'info', text: tr.account_check_email })
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setSignedIn(false)
    setOrders([])
  }

  const latestShipping = orders.find((o) => o.shipping_address)?.shipping_address ?? null
  const latestName = orders.find((o) => o.customer_name)?.customer_name ?? ''

  if (!ready) {
    return <main className="min-h-screen bg-stone-950" />
  }

  // ── Signed out: auth form ──────────────────────────────────────────────
  if (!signedIn) {
    return (
      <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-16">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-3">The Heartwear Store</p>
            <h1 className="font-playfair text-3xl text-stone-50">
              {mode === 'signin' ? tr.account_signin : tr.account_signup}
            </h1>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-stone-600 mb-2">{tr.account_email}</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm rounded-control focus:outline-none focus:border-stone-500"
              />
            </div>
            <div>
              <label className="block text-[10px] tracking-[0.3em] uppercase text-stone-600 mb-2">{tr.account_password}</label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm rounded-control focus:outline-none focus:border-stone-500"
              />
            </div>
            {message && (
              <p className={`text-xs ${message.kind === 'error' ? 'text-red-400' : 'text-sage-400'}`}>{message.text}</p>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#d64533] text-white py-3.5 text-[10px] tracking-[0.4em] uppercase hover:bg-[#b23222] transition-colors disabled:opacity-40 rounded-control"
            >
              {loading ? '…' : mode === 'signin' ? tr.account_signin : tr.account_signup}
            </button>
          </form>
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null) }}
            className="w-full text-center text-xs text-stone-500 hover:text-stone-300 mt-5 transition-colors"
          >
            {mode === 'signin' ? tr.account_need_account : tr.account_have_account}
          </button>

          {/* Artist sign-up */}
          <div className="mt-8 pt-6 border-t border-stone-800 text-center">
            <p className="text-[10px] tracking-[0.3em] uppercase text-sage-700 mb-2">{tr.artist_cta_kicker}</p>
            <p className="text-sm text-stone-400 mb-3">{tr.artist_cta_desc}</p>
            <a
              href="/artist/join"
              className="inline-block border border-stone-600 text-stone-200 px-5 py-2.5 text-[10px] tracking-[0.3em] uppercase hover:border-stone-400 transition-colors rounded-control"
            >
              {tr.artist_cta_button}
            </a>
          </div>
        </div>
      </main>
    )
  }

  // ── Signed in: dashboard ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-stone-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-2">The Heartwear Store</p>
            <h1 className="font-playfair text-3xl text-stone-50">{tr.account_title}</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[10px] tracking-[0.3em] uppercase text-stone-400 border border-stone-700 hover:border-stone-500 px-4 py-2 transition-colors"
          >
            {tr.account_signout}
          </button>
        </div>

        {/* Account info + shipping */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="border border-stone-800 rounded-card p-5">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">{tr.account_info}</h2>
            {latestName && <p className="text-stone-200 text-sm">{latestName}</p>}
            <p className="text-stone-400 text-sm">{accountEmail}</p>
          </div>
          <div className="border border-stone-800 rounded-card p-5">
            <h2 className="text-[10px] tracking-[0.3em] uppercase text-stone-500 mb-3">{tr.account_shipping}</h2>
            {latestShipping ? (
              <p className="text-stone-400 text-sm leading-relaxed">
                {latestShipping.line1}{latestShipping.line2 ? `, ${latestShipping.line2}` : ''}<br />
                {latestShipping.city}{latestShipping.state ? `, ${latestShipping.state}` : ''} {latestShipping.postal_code}<br />
                {latestShipping.country}
              </p>
            ) : (
              <p className="text-stone-600 text-sm">{tr.account_no_shipping}</p>
            )}
          </div>
        </section>

        {/* Orders */}
        <section>
          <h2 className="text-xs tracking-[0.3em] uppercase text-stone-500 mb-4">{tr.account_orders}</h2>
          {ordersLoading ? (
            <p className="text-stone-600 text-sm">…</p>
          ) : orders.length === 0 ? (
            <p className="text-stone-600 text-sm">{tr.account_no_orders}</p>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="border border-stone-800 rounded-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-stone-200 text-sm font-medium">{tr.account_order} #{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-stone-600 text-xs">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-hw-accent2 text-sm font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {display(o.total_amount)}
                      </p>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-sage-600">{o.status}</p>
                    </div>
                  </div>
                  <ul className="text-stone-400 text-xs space-y-1">
                    {(o.line_items ?? []).map((li, i) => (
                      <li key={i}>{li.quantity}× {li.title}{li.variant_title ? ` — ${li.variant_title}` : ''}</li>
                    ))}
                  </ul>
                  {o.tracking_number && (
                    <a
                      href={o.tracking_url || '#'} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-3 text-[10px] tracking-[0.3em] uppercase text-sage-500 hover:text-sage-400"
                    >
                      {tr.account_tracking} →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
