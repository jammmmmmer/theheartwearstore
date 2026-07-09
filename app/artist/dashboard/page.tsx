'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/lib/language-context'
import { formatMoney, Currency } from '@/lib/currency'

interface Submission {
  id: string
  title: string
  mockup_url: string | null
  status: string
  created_at: string
}

interface MeResponse {
  email: string
  artist: { slug: string; display_name: string; bio: string } | null
  submissions: Submission[]
  earnings: { totals: Record<string, { accrued: number; paid: number }> }
}

export default function ArtistDashboardPage() {
  const router = useRouter()
  const { tr } = useTranslation()
  const [token, setToken] = useState<string | null>(null)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [profileState, setProfileState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [profileError, setProfileError] = useState('')

  // Submission form
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [agree, setAgree] = useState(false)
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const loadMe = useCallback(async (accessToken: string) => {
    const res = await fetch('/api/artist/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    return (await res.json()) as MeResponse
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace('/artist/join')
        return
      }
      const accessToken = data.session.access_token
      setToken(accessToken)
      const meData = await loadMe(accessToken)
      if (meData) {
        setMe(meData)
        setDisplayName(meData.artist?.display_name ?? '')
        setBio(meData.artist?.bio ?? '')
      }
      setLoading(false)
    })
  }, [router, loadMe])

  async function refresh() {
    if (!token) return
    const meData = await loadMe(token)
    if (meData) setMe(meData)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setProfileState('saving')
    setProfileError('')
    try {
      const res = await fetch('/api/artist/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayName, bio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setProfileState('saved')
      await refresh()
      setTimeout(() => setProfileState('idle'), 2500)
    } catch (err) {
      setProfileState('error')
      setProfileError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function submitDesign(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !file || !agree) return
    setSubmitState('submitting')
    setSubmitError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const imgRes = await fetch('/api/artist/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const imgData = await imgRes.json()
      if (!imgRes.ok) throw new Error(imgData.error || 'Image upload failed')

      const subRes = await fetch('/api/artist/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageId: imgData.imageId, title, agreeTerms: agree }),
      })
      const subData = await subRes.json()
      if (!subRes.ok) throw new Error(subData.error || 'Submission failed')

      setSubmitState('done')
      setFile(null); setPreview(null); setTitle(''); setAgree(false)
      await refresh()
      setTimeout(() => setSubmitState('idle'), 4000)
    } catch (err) {
      setSubmitState('error')
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/artist/join')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-600 text-sm font-mono tracking-widest">…</p>
      </main>
    )
  }

  const totals = me?.earnings?.totals ?? {}
  const hasEarnings = Object.keys(totals).length > 0
  const hasProfile = Boolean(me?.artist)

  const inputCls =
    'w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500 transition-colors'
  const labelCls = 'block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2'
  const sectionCls = 'border border-stone-800 bg-stone-900/40 p-6'

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-14">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-playfair text-3xl text-stone-50">{tr.dash_title}</h1>
          <div className="flex items-center gap-4">
            {me?.artist && (
              <a
                href={`/artists/${me.artist.slug}`}
                className="text-[9px] tracking-[0.3em] uppercase text-sage-600 hover:text-sage-400 transition-colors"
              >
                {tr.dash_view_page}
              </a>
            )}
            <button
              onClick={handleLogout}
              className="text-[9px] tracking-[0.3em] uppercase text-stone-600 hover:text-stone-400 border border-stone-800 hover:border-stone-600 px-3 py-1.5 transition-colors"
            >
              {tr.dash_logout}
            </button>
          </div>
        </div>

        {/* Profile */}
        <section className={sectionCls}>
          <h2 className="text-[10px] tracking-[0.4em] uppercase text-sage-700 mb-5">{tr.dash_profile}</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className={labelCls}>{tr.dash_display_name}</label>
              <input type="text" required minLength={2} maxLength={60} value={displayName}
                onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{tr.dash_bio}</label>
              <textarea rows={3} maxLength={1000} value={bio}
                onChange={(e) => setBio(e.target.value)} className={inputCls} />
            </div>
            {profileState === 'error' && <p className="text-red-400 text-xs">{profileError}</p>}
            <button type="submit" disabled={profileState === 'saving'}
              className="bg-stone-50 text-stone-950 px-8 py-3 text-sm font-semibold rounded-full hover:bg-stone-100 transition-colors disabled:opacity-40">
              {profileState === 'saved' ? tr.dash_saved : tr.dash_save}
            </button>
          </form>
        </section>

        {/* Submit design */}
        {hasProfile && (
          <section className={sectionCls}>
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-sage-700 mb-5">{tr.dash_submit_design}</h2>
            <form onSubmit={submitDesign} className="space-y-4">
              <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-stone-700 hover:border-stone-500 cursor-pointer transition-colors"
              >
                <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
                  }} />
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Design preview" className="w-full max-h-64 object-contain bg-stone-900 p-4" />
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-stone-400 text-sm mb-1">PNG, JPG, WebP</p>
                    <p className="text-stone-600 text-xs">Transparent background works best</p>
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>{tr.dash_design_title}</label>
                <input type="text" required minLength={3} maxLength={80} value={title}
                  onChange={(e) => setTitle(e.target.value)} className={inputCls} />
              </div>
              <label className="flex items-start gap-3 text-xs text-stone-500 cursor-pointer">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 accent-current" required />
                <span>
                  {tr.dash_agree_terms}{' '}
                  <a href="/artist-terms" target="_blank" className="underline underline-offset-2 text-stone-400">
                    {tr.dash_terms_link}
                  </a>
                </span>
              </label>
              {submitState === 'error' && <p className="text-red-400 text-xs">{submitError}</p>}
              {submitState === 'done' && <p className="text-sage-400 text-xs">{tr.dash_submitted}</p>}
              <button type="submit" disabled={!file || !agree || submitState === 'submitting'}
                className="w-full bg-[#d64533] text-white py-4 text-[15px] font-semibold rounded-control hover:bg-[#b23222] transition-colors disabled:opacity-40">
                {submitState === 'submitting' ? tr.dash_submitting : tr.dash_submit_button}
              </button>
            </form>
          </section>
        )}

        {/* Earnings */}
        {hasProfile && (
          <section className={sectionCls}>
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-sage-700 mb-5">{tr.dash_earnings}</h2>
            {!hasEarnings ? (
              <p className="text-stone-600 text-sm">{tr.dash_no_earnings}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(totals).map(([cur, t]) => (
                  <div key={cur} className="space-y-2">
                    <div>
                      <p className="text-[9px] tracking-[0.3em] uppercase text-stone-600">{tr.dash_accrued}</p>
                      <p className="text-stone-100 text-xl font-mono">{formatMoney(t.accrued, cur as Currency)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[0.3em] uppercase text-stone-600">{tr.dash_paid}</p>
                      <p className="text-stone-400 text-sm font-mono">{formatMoney(t.paid, cur as Currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Submissions */}
        {hasProfile && (
          <section className={sectionCls}>
            <h2 className="text-[10px] tracking-[0.4em] uppercase text-sage-700 mb-5">{tr.dash_submissions}</h2>
            {!me?.submissions?.length ? (
              <p className="text-stone-600 text-sm">{tr.dash_no_submissions}</p>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {me.submissions.map((s) => (
                  <li key={s.id} className="border border-stone-800">
                    {s.mockup_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.mockup_url} alt={s.title} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square bg-stone-900" />
                    )}
                    <div className="p-3">
                      <p className="text-stone-300 text-xs truncate mb-1">{s.title}</p>
                      <span className={`text-[8px] tracking-[0.25em] uppercase ${
                        s.status === 'approved' ? 'text-sage-500' :
                        s.status === 'rejected' ? 'text-red-500' : 'text-stone-500'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
