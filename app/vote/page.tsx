'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useTranslation } from '@/lib/language-context'

interface VoteDesign {
  id: string
  title: string
  mockup_url: string | null
  votes: number
  voted: boolean
  artist: { display_name: string; slug: string } | null
}

export default function VotePage() {
  const { tr } = useTranslation()
  const [designs, setDesigns] = useState<VoteDesign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vote/list')
      .then((res) => res.json())
      .then((data: { designs?: VoteDesign[] }) => setDesigns(data.designs ?? []))
      .catch(() => setDesigns([]))
      .finally(() => setLoading(false))
  }, [])

  async function vote(id: string) {
    // Optimistic update
    setDesigns((ds) =>
      ds.map((d) => (d.id === id && !d.voted ? { ...d, voted: true, votes: d.votes + 1 } : d))
    )
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId: id }),
      })
      const data = await res.json() as { votes?: number }
      if (typeof data.votes === 'number') {
        setDesigns((ds) => ds.map((d) => (d.id === id ? { ...d, votes: data.votes! } : d)))
      }
    } catch {
      // leave the optimistic state; a refresh will reconcile
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 max-w-xl mx-auto">
          <h1 className="font-playfair text-4xl text-stone-50 mb-3">{tr.vote_title}</h1>
          <p className="text-stone-500 text-sm">{tr.vote_intro}</p>
        </div>

        {loading ? (
          <p className="text-center text-stone-600 font-mono text-sm tracking-widest">…</p>
        ) : designs.length === 0 ? (
          <div className="text-center py-24 border border-stone-800">
            <p className="text-stone-500 italic font-playfair text-lg">{tr.vote_empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {designs.map((d) => (
              <div key={d.id} className="hw-card overflow-hidden flex flex-col">
                {d.mockup_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.mockup_url} alt={d.title} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-stone-900" />
                )}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <p className="text-stone-200 text-sm leading-snug">{d.title}</p>
                  {d.artist && (
                    <a
                      href={`/artists/${d.artist.slug}`}
                      className="text-[10px] tracking-[0.2em] uppercase text-stone-600 hover:text-stone-400 transition-colors"
                    >
                      {tr.vote_by} {d.artist.display_name}
                    </a>
                  )}
                  <button
                    onClick={() => !d.voted && vote(d.id)}
                    disabled={d.voted}
                    className={`mt-auto flex items-center justify-center gap-2 py-3 min-h-[44px] text-xs font-semibold rounded-full border transition-colors ${
                      d.voted
                        ? 'border-sage-400 text-sage-400 cursor-default'
                        : 'border-stone-700 text-stone-300 hover:border-[#d64533] hover:text-[#d64533]'
                    }`}
                  >
                    <Heart size={12} fill={d.voted ? 'currentColor' : 'none'} />
                    {d.voted ? tr.vote_voted : tr.vote_button}
                    <span className="font-mono">({d.votes})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
