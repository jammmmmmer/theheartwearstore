'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'form' | 'uploading' | 'done' | 'error'

interface PlacementOption {
  key: string
  label: string
  mockupUrl: string
  approveUrl: string
  rejectUrl: string
}

export default function UploadDesignPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('form')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const [options, setOptions] = useState<PlacementOption[]>([])
  const [cardStates, setCardStates] = useState<Record<string, 'idle' | 'loading' | 'approved' | 'rejected'>>({})
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [loggedInUser, setLoggedInUser] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const user = document.cookie.split('; ').find(r => r.startsWith('hs_user='))?.split('=')[1] ?? ''
    setLoggedInUser(decodeURIComponent(user))
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const handleApprove = async (opt: PlacementOption) => {
    setCardStates(s => ({ ...s, [opt.key]: 'loading' }))
    try {
      const res = await fetch(opt.approveUrl)
      // The approve route redirects — check final URL to confirm success
      if (!res.ok || !res.url.includes('status=approved')) {
        throw new Error('Approve did not complete successfully')
      }
      setCardStates(s => ({ ...s, [opt.key]: 'approved' }))
    } catch {
      setCardStates(s => ({ ...s, [opt.key]: 'idle' }))
      alert('Approve failed — try again')
    }
  }

  const handleReject = async (opt: PlacementOption) => {
    setCardStates(s => ({ ...s, [opt.key]: 'loading' }))
    try {
      const res = await fetch(opt.rejectUrl)
      if (!res.ok) throw new Error()
      setCardStates(s => ({ ...s, [opt.key]: 'rejected' }))
    } catch {
      setCardStates(s => ({ ...s, [opt.key]: 'idle' }))
      alert('Reject failed — try again')
    }
  }

  // Compress image to stay under Netlify's 6MB function body limit
  const compressImage = (f: File): Promise<File> => {
    return new Promise((resolve) => {
      // Under 3MB — fine as-is
      if (f.size < 3 * 1024 * 1024) { resolve(f); return }
      const img = new Image()
      const url = URL.createObjectURL(f)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 2000
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) resolve(new File([blob], f.name, { type: 'image/png' }))
          else resolve(f)
        }, 'image/png')
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(f) }
      img.src = url
    })
  }

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setStage('uploading')
    setErrorMsg('')

    try {
      // Read secret from session cookie
      const resolvedSecret = document.cookie
        .split('; ')
        .find(r => r.startsWith('hs_session='))
        ?.split('=')[1] ?? ''

      if (!resolvedSecret) throw new Error('Session expired — please sign in again')

      // Step 1: upload image to Printify, get imageId
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('image', compressed)
      formData.append('secret', resolvedSecret)
      if (title.trim()) formData.append('title', title.trim())

      const imgRes = await fetch('/api/auto-product/upload-image', { method: 'POST', body: formData })
      const imgText = await imgRes.text()
      let imgData: { ok?: boolean; imageId?: string; title?: string; error?: string }
      try { imgData = JSON.parse(imgText) } catch { throw new Error(`${imgRes.status}: ${imgText.slice(0, 300)}`) }
      if (!imgRes.ok) throw new Error(imgData.error || `Server error ${imgRes.status}`)

      const { imageId, title: resolvedTitle } = imgData as { imageId: string; title: string }

      // Step 2: create 3 products in parallel, one API call each
      const placementKeys = ['small_front', 'full_front', 'full_back_small_front']
      const results = await Promise.all(
        placementKeys.map(async (placementKey) => {
          const res = await fetch('/api/auto-product/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret: resolvedSecret, imageId, title: resolvedTitle, placementKey }),
          })
          const text = await res.text()
          let data: PlacementOption & { ok?: boolean; error?: string }
          try { data = JSON.parse(text) } catch { throw new Error(`Server error ${res.status} — try again`) }
          if (!res.ok) throw new Error((data as { error?: string }).error || `Server error ${res.status}`)
          return data as PlacementOption
        })
      )

      setOptions(results)
      setStage('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStage('error')
    }
  }

  const reset = () => {
    setStage('form'); setFile(null); setPreview(null)
    setTitle(''); setOptions([]); setCardStates({}); setSelectedKey(null)
  }

  if (stage === 'done') {
    return (
      <main className="min-h-screen bg-stone-950 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-3">The Heartwear Store</p>
            <h1 className="font-playfair text-3xl text-stone-50 mb-2">Choose Your Placement</h1>
            <p className="text-stone-500 text-sm">3 mockups generated. Approve the ones you want published — reject to delete the draft.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {options.map((opt, i) => {
              const state = cardStates[opt.key] ?? 'idle'
              const isSelected = selectedKey === opt.key
              const isApproved = state === 'approved'
              const isRejected = state === 'rejected'
              const isLoading = state === 'loading'

              return (
                <div
                  key={opt.key}
                  onClick={() => { if (state === 'idle') setSelectedKey(opt.key) }}
                  className={`border transition-all duration-200 cursor-pointer ${
                    isApproved ? 'border-sage-500 bg-sage-900/20' :
                    isRejected ? 'border-stone-700 bg-stone-900/20 opacity-40' :
                    isSelected ? 'border-sage-600 bg-stone-900/60 ring-1 ring-sage-700' :
                    'border-stone-800 bg-stone-900/40 hover:border-stone-600'
                  }`}
                >
                  {/* Label */}
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-[9px] tracking-[0.4em] uppercase text-sage-600 mb-1">Option {i + 1}</p>
                    <p className="text-stone-300 text-sm font-medium">{opt.label}</p>
                  </div>

                  {/* Mockup */}
                  {opt.mockupUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={opt.mockupUrl} alt={opt.label} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-stone-900 flex items-center justify-center">
                      <p className="text-stone-600 text-xs">Mockup loading…</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-4 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                    {isApproved ? (
                      <div className="text-center text-sage-500 text-[9px] tracking-[0.4em] uppercase py-3">✓ Published</div>
                    ) : isRejected ? (
                      <div className="text-center text-stone-600 text-[9px] tracking-[0.4em] uppercase py-3">✕ Deleted</div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(opt)}
                          disabled={isLoading}
                          className="w-full text-center bg-sage-700 border border-sage-600 text-stone-100 py-3 text-[9px] tracking-[0.4em] uppercase hover:bg-sage-600 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? 'Working…' : '✓ Approve & Publish'}
                        </button>
                        <button
                          onClick={() => handleReject(opt)}
                          disabled={isLoading}
                          className="w-full text-center border border-stone-700 text-stone-600 py-3 text-[9px] tracking-[0.4em] uppercase hover:border-stone-500 hover:text-stone-400 transition-colors disabled:opacity-50"
                        >
                          ✕ Reject & Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center flex flex-col items-center gap-4">
            <a
              href="/shop"
              className="inline-block bg-sage-700 border border-sage-600 text-stone-100 px-10 py-4 text-[10px] tracking-[0.4em] uppercase hover:bg-sage-600 transition-colors"
            >
              OK — Go to Shop
            </a>
            <button onClick={reset} className="text-xs tracking-[0.3em] uppercase text-stone-700 hover:text-stone-500 transition-colors">
              Upload another design
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">

        {loggedInUser && (
          <div className="flex justify-end items-center gap-3 mb-8">
            <span className="text-[10px] tracking-[0.3em] uppercase text-stone-500">
              Signed in as <span className="text-stone-300">{loggedInUser}</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-[9px] tracking-[0.3em] uppercase text-stone-600 hover:text-stone-400 border border-stone-800 hover:border-stone-600 px-3 py-1.5 transition-colors"
            >
              Log out
            </button>
          </div>
        )}

        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-3">The Heartwear Store</p>
          <h1 className="font-playfair text-3xl text-stone-50 mb-2">Upload a Design</h1>
          <p className="text-stone-500 text-sm">Drop your image — we&apos;ll generate 3 placement options for you to approve.</p>
        </div>

        {/* Placement preview pills */}
        <div className="flex gap-2 justify-center mb-8">
          {['Small chest', 'Full front', 'Back + chest'].map((label) => (
            <span key={label} className="text-[8px] tracking-[0.3em] uppercase text-stone-600 border border-stone-800 px-3 py-1">
              {label}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            className={`relative border-2 border-dashed transition-colors cursor-pointer ${
              dragging ? 'border-sage-600 bg-sage-900/10' : 'border-stone-700 hover:border-stone-500'
            }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onInputChange} />
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Design preview" className="w-full max-h-72 object-contain bg-stone-900 p-6" />
                <div className="absolute bottom-2 right-3 text-[9px] tracking-[0.3em] uppercase text-stone-600">Click to change</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                <svg className="w-10 h-10 text-stone-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-stone-400 text-sm mb-1">Drop your design here</p>
                <p className="text-stone-600 text-xs">PNG, JPG or WebP — transparent background works best</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2">
              Product Title <span className="text-stone-700 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Bear Patch Tee"
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>

          {stage === 'error' && <p className="text-red-400 text-xs tracking-wide">{errorMsg}</p>}

          <button
            type="submit"
            disabled={!file || stage === 'uploading'}
            className="w-full bg-sage-700 border border-sage-600 text-stone-100 py-4 text-[10px] tracking-[0.4em] uppercase hover:bg-sage-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {stage === 'uploading' ? 'Generating 3 options…' : '✦ Generate Placement Options ✦'}
          </button>

          <p className="text-center text-[10px] text-stone-700 tracking-wide">
            Creates 3 drafts in Printify — nothing goes live until you approve.
          </p>
        </form>
      </div>
    </main>
  )
}
