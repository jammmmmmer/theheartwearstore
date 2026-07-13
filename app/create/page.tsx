'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { prepareImageForUpload } from '@/lib/compress-image'

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
      const compressed = await prepareImageForUpload(file)
      if (!compressed) {
        throw new Error('This image is too large to upload — please try a smaller file (under 6MB works best).')
      }

      // 1. Init: upload the image once, get the garment list + a group id.
      const initForm = new FormData()
      initForm.append('image', compressed)
      if (title.trim()) initForm.append('title', title.trim())
      const initRes = await fetch('/api/custom/create', { method: 'POST', body: initForm })
      // Never assume JSON: platform-level failures (body too large, timeout)
      // return plain text like "Internal Error. ID: …".
      const initText = await initRes.text()
      let init: { imageId?: string; groupId?: string; title?: string; styleKeys?: string[]; error?: string }
      try {
        init = JSON.parse(initText)
      } catch {
        throw new Error(
          initRes.status === 413 || /internal error/i.test(initText)
            ? 'The upload was rejected because the image is too large. Please try a smaller file.'
            : `Upload failed (server error ${initRes.status}). Please try again.`
        )
      }
      if (!initRes.ok || !init.imageId || !init.groupId) {
        throw new Error(init.error || `Server error ${initRes.status}`)
      }

      // 2. Create one product per garment style (parallel — separate requests
      //    keep each within the function time budget), all sharing the group id.
      const styleKeys = init.styleKeys?.length ? init.styleKeys : ['classic']
      const results = await Promise.all(
        styleKeys.map((sk) =>
          fetch('/api/custom/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageId: init.imageId, groupId: init.groupId, styleKey: sk,
              placementKey: placement, title: init.title,
            }),
          })
            .then((r) => r.json())
            .catch(() => ({ error: 'request failed' }))
        )
      ) as { productId?: string; isDefault?: boolean; error?: string }[]

      const made = results.filter((r) => r && r.productId)
      if (!made.length) {
        throw new Error(results.find((r) => r?.error)?.error || 'Could not create your tee')
      }

      // Land on the default garment's product page (the group's switcher covers the rest).
      const primary = made.find((r) => r.isDefault) ?? made[0]
      router.push(`/shop/${primary.productId}`)
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
