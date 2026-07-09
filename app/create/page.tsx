'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'form' | 'uploading' | 'error'

const PLACEMENTS = [
  { key: 'full_front', label: 'Full front', hint: 'Large print, centered on the chest' },
  { key: 'small_front', label: 'Small chest', hint: 'Small print on the right chest' },
  { key: 'full_back_small_front', label: 'Back + small front', hint: 'Big back print, small chest logo' },
] as const

export default function CreatePage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('form')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [placement, setPlacement] = useState<string>('full_front')
  const [agreed, setAgreed] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Compress large images below Netlify's 6MB function limit.
  const compressImage = (f: File): Promise<File> => {
    return new Promise((resolve) => {
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
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          resolve(blob ? new File([blob], f.name, { type: 'image/png' }) : f)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !agreed) return
    setStage('uploading')
    setErrorMsg('')
    try {
      const compressed = await compressImage(file)
      const formData = new FormData()
      formData.append('image', compressed)
      formData.append('placementKey', placement)
      if (title.trim()) formData.append('title', title.trim())

      const res = await fetch('/api/custom/create', { method: 'POST', body: formData })
      const text = await res.text()
      let data: { ok?: boolean; productId?: string; error?: string }
      try { data = JSON.parse(text) } catch { throw new Error(`Server error ${res.status}`) }
      if (!res.ok || !data.productId) throw new Error(data.error || `Server error ${res.status}`)

      // Straight to the (unlisted) product page to pick size/colour and order.
      router.push(`/shop/${data.productId}`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStage('error')
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-3">The Heartwear Store</p>
          <h1 className="font-playfair text-3xl text-stone-50 mb-2">Make It Yours</h1>
          <p className="text-stone-500 text-sm">
            Upload your artwork, choose a placement, and order a tee that&apos;s uniquely yours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropzone */}
          <div
            className={`relative border-2 border-dashed transition-colors cursor-pointer rounded-control ${
              dragging ? 'border-sage-600 bg-sage-900/10' : 'border-stone-700 hover:border-stone-500'
            }`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Design preview" className="w-full max-h-72 object-contain bg-stone-900 p-6 rounded-control" />
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

          {/* Title */}
          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2">
              Name your design <span className="text-stone-700 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mountain Sunrise"
              maxLength={80}
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm rounded-control placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>

          {/* Placement */}
          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-3">Placement</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PLACEMENTS.map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => setPlacement(p.key)}
                  className={`text-left px-3 py-3 rounded-control border transition-all ${
                    placement === p.key
                      ? 'border-sage-500 bg-sage-900/20 text-stone-100'
                      : 'border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-600'
                  }`}
                >
                  <span className="block text-xs font-medium">{p.label}</span>
                  <span className="block text-[10px] text-stone-500 mt-0.5 leading-snug">{p.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Final-sale agreement */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-sage-600 w-4 h-4"
            />
            <span className="text-xs text-stone-400 leading-relaxed">
              I understand custom designs are made to order and <span className="text-stone-200">final sale</span> —
              no returns or exchanges except for manufacturing defects. I confirm I have the right to use this artwork.
            </span>
          </label>

          {stage === 'error' && <p className="text-red-400 text-xs tracking-wide">{errorMsg}</p>}

          <button
            type="submit"
            disabled={!file || !agreed || stage === 'uploading'}
            className="w-full bg-[#d64533] border border-[#d64533] text-white py-4 text-[10px] tracking-[0.4em] uppercase hover:bg-[#b23222] transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-control"
          >
            {stage === 'uploading' ? 'Creating your tee…' : 'Create My Tee'}
          </button>

          <p className="text-center text-[10px] text-stone-700 tracking-wide">
            You&apos;ll pick size &amp; colour on the next step. Nothing is charged until checkout.
          </p>
        </form>
      </div>
    </main>
  )
}
