'use client'

import { useEffect, useState } from 'react'

export interface Collection {
  id: string
  name: string
  slug: string
}

/**
 * Multi-select for product collections with inline "create new".
 * Controlled by `value` (selected collection ids) + `onChange`.
 * Creating a new collection persists it immediately via the admin API and
 * selects it. Reused by the upload form and the admin review queue.
 */
export default function CollectionPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  compact?: boolean
}) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/collections')
      .then((r) => (r.ok ? r.json() : { collections: [] }))
      .then((d: { collections?: Collection[] }) => setCollections(d.collections ?? []))
      .catch(() => setCollections([]))
  }, [])

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  async function createCollection() {
    const name = newName.trim()
    if (!name || creating) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name }),
      })
      const d = (await res.json()) as { collection?: Collection; error?: string }
      if (!res.ok || !d.collection) throw new Error(d.error || 'Could not create collection')
      setCollections((cs) =>
        cs.some((c) => c.id === d.collection!.id) ? cs : [...cs, d.collection!].sort((a, b) => a.name.localeCompare(b.name))
      )
      if (!value.includes(d.collection.id)) onChange([...value, d.collection.id])
      setNewName('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-wrap gap-2">
        {collections.length === 0 && (
          <span className="text-stone-600 text-xs">No collections yet — create one below.</span>
        )}
        {collections.map((c) => {
          const on = value.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                on
                  ? 'border-sage-500 bg-sage-900/30 text-sage-300'
                  : 'border-stone-700 text-stone-400 hover:border-stone-500'
              }`}
            >
              {on ? '✓ ' : ''}{c.name}
            </button>
          )
        })}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); createCollection() }
          }}
          placeholder="New collection name"
          className="flex-1 bg-stone-900 border border-stone-700 text-stone-200 px-3 py-2 text-sm placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors rounded"
        />
        <button
          type="button"
          onClick={createCollection}
          disabled={creating || !newName.trim()}
          className="px-4 py-2 text-[10px] tracking-[0.3em] uppercase border border-stone-700 text-stone-300 hover:border-stone-500 transition-colors disabled:opacity-40 rounded"
        >
          {creating ? '…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
