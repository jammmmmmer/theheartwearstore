'use client'

import { useState, useRef, useCallback } from 'react'

type Stage = 'form' | 'uploading' | 'done' | 'error'

interface DoneData {
  title: string
  mockupUrl: string
  approveUrl: string
  rejectUrl: string
}

export default function UploadDesignPage() {
  const [stage, setStage] = useState<Stage>('form')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [secret, setSecret] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [dragging, setDragging] = useState(false)
  const [doneData, setDoneData] = useState<DoneData | null>(null)
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
      const formData = new FormData()
      formData.append('image', file)
      formData.append('secret', secret)
      if (title.trim()) formData.append('title', title.trim())

      const res = await fetch('/api/auto-product/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`)

      setDoneData({
        title: data.title,
        mockupUrl: data.mockupUrl,
        approveUrl: data.approveUrl,
        rejectUrl: data.rejectUrl,
      })
      setStage('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStage('error')
    }
  }

  const reset = () => { setStage('form'); setFile(null); setPreview(null); setTitle(''); setDoneData(null) }

  if (stage === 'done' && doneData) {
    return (
      <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-3">The Heartwear Store</p>
          <h1 className="font-playfair text-3xl text-stone-50 mb-2">Design ready!</h1>
          <p className="text-stone-500 text-sm mb-8">Here&apos;s how it looks on the tee. Approve to publish, or reject to delete the draft.</p>

          {doneData.mockupUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doneData.mockupUrl} alt={doneData.title} className="w-full max-h-80 object-contain bg-stone-900 mb-8" />
          )}

          <p className="text-stone-400 text-sm font-playfair italic mb-8">{doneData.title}</p>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <a
              href={doneData.approveUrl}
              className="flex-1 bg-sage-700 border border-sage-600 text-stone-100 py-4 text-[10px] tracking-[0.4em] uppercase hover:bg-sage-600 transition-colors text-center"
            >
              ✓ Approve &amp; Publish
            </a>
            <a
              href={doneData.rejectUrl}
              className="flex-1 border border-stone-700 text-stone-500 py-4 text-[10px] tracking-[0.4em] uppercase hover:border-stone-500 hover:text-stone-300 transition-colors text-center"
            >
              ✕ Reject &amp; Delete
            </a>
          </div>

          <button onClick={reset} className="text-xs tracking-[0.3em] uppercase text-stone-700 hover:text-stone-500 transition-colors">
            Upload another
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full">

        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-3">The Heartwear Store</p>
          <h1 className="font-playfair text-3xl text-stone-50 mb-2">Upload a Design</h1>
          <p className="text-stone-500 text-sm">Drop your image below. We&apos;ll put it on a tee for you to approve.</p>
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
                <img src={preview} alt="Design preview" className="w-full max-h-80 object-contain bg-stone-900 p-6" />
                <div className="absolute bottom-2 right-3 text-[9px] tracking-[0.3em] uppercase text-stone-600">Click to change</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <svg className="w-10 h-10 text-stone-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-stone-400 text-sm mb-1">Drop your design here</p>
                <p className="text-stone-600 text-xs">PNG, JPG or WebP — works best on transparent or white background</p>
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
              placeholder="e.g. Stitch Heart Tee"
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2">Password</label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              required
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>

          {stage === 'error' && <p className="text-red-400 text-xs tracking-wide">{errorMsg}</p>}

          <button
            type="submit"
            disabled={!file || !secret || stage === 'uploading'}
            className="w-full bg-sage-700 border border-sage-600 text-stone-100 py-4 text-[10px] tracking-[0.4em] uppercase hover:bg-sage-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {stage === 'uploading' ? 'Uploading…' : '✦ Submit Design ✦'}
          </button>

          <p className="text-center text-[10px] text-stone-700 tracking-wide">
            Nothing goes live until you approve it.
          </p>
        </form>
      </div>
    </main>
  )
}
