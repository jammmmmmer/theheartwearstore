'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.ok) {
      router.push('/upload-design')
    } else {
      setError('Invalid username or password')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="The Heartwear Store" width={56} height={56} />
          </div>
          <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-2">The Heartwear Store</p>
          <h1 className="font-playfair text-2xl text-stone-50">Sign In</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.35em] uppercase text-stone-600 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-stone-900 border border-stone-700 text-stone-200 px-4 py-3 text-sm focus:outline-none focus:border-stone-500 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-xs tracking-wide">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage-700 border border-sage-600 text-stone-100 py-4 text-[10px] tracking-[0.4em] uppercase hover:bg-sage-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  )
}
