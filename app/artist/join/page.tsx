'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Palette } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/language-context'

export default function ArtistJoinPage() {
  const router = useRouter()
  const { tr } = useTranslation()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/artist/dashboard')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) {
          router.replace('/artist/dashboard')
        } else {
          setMessage({ kind: 'info', text: tr.artist_check_email })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace('/artist/dashboard')
      }
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Palette size={32} strokeWidth={1} className="mx-auto mb-4 text-stone-600" />
          <h1 className="font-playfair text-3xl text-stone-50 mb-2">{tr.artist_join_title}</h1>
          <p className="text-stone-500 text-sm">{tr.artist_join_intro}</p>
        </div>

        {/* Mode tabs */}
        <div className="flex mb-6 border border-stone-800">
          {(['signup', 'signin'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setMessage(null) }}
              className={`flex-1 py-3 text-[10px] tracking-[0.3em] uppercase transition-colors ${
                mode === m ? 'bg-stone-800 text-stone-100' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              {m === 'signup' ? tr.artist_signup : tr.artist_signin}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2">
              {tr.artist_email}
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
              {tr.artist_password}
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>

          {message && (
            <p className={`text-xs tracking-wide ${message.kind === 'error' ? 'text-red-400' : 'text-sage-400'}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d64533] text-white py-4 text-[15px] font-semibold rounded-control hover:bg-[#b23222] transition-colors disabled:opacity-40"
          >
            {mode === 'signup' ? tr.artist_signup : tr.artist_signin}
          </button>

          <p className="text-center text-[10px] text-stone-700 tracking-wide">
            <a href="/artist-terms" className="underline underline-offset-2 hover:text-stone-500">
              {tr.artist_terms_title}
            </a>
          </p>
        </form>
      </div>
    </main>
  )
}
