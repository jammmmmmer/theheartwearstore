'use client'

import { useEffect, useState } from 'react'

export interface Collection {
  id: string
  name: string
  slug: string
}

/**
 * Collection selector: selected collections show as removable chips, a dropdown
 * adds an existing collection, and an inline field creates a brand-new one.
 * Controlled by `value` (selected collection ids) + `onChange`.
 * Reused by the upload form and the admin review queue.
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

  const byId = new Map(collections.map((c) => [c.id, c]))
  const selected = value.filter((id) => byId.has(id))
  const available = collections.filter((c) => !value.includes(c.id))

  const add = (id: string) => { if (id && !value.includes(id)) onChange([...value, id]) }
  const remove = (id: string) => onChange(value.filter((v) => v !== id))

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
        cs.some((c) => c.id === d.collection!.id)
          ? cs
          : [...cs, d.collection!].sort((a, b) => a.name.localeCompare(b.name))
      )
      if (!value.includes(d.collection.id)) onChange([...value, d.collection.id])
      setNewName('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setCreating(false)
    }
  }

  const selectClass =
    'flex-1 min-w-0 bg-stone-900 border border-stone-700 text-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-500 transition-colors rounded'

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {/* Selected collections as removable chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-sage-500 bg-sage-900/30 text-sage-300"
            >
              {byId.get(id)?.name}
              <button
                type="button"
                onClick={() => remove(id)}
                aria-label={`Remove ${byId.get(id)?.name}`}
                className="text-sage-400 hover:text-stone-100 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown to add an existing collection */}
      <div className="flex gap-2">
        <select
          value=""
          onChange={(e) => { add(e.target.value); e.target.value = '' }}
          className={selectClass}
          disabled={available.length === 0}
        >
          <option value="" disabled>
            {available.length ? 'Add to collection…' : (collections.length ? 'All collections added' : 'No collections yet')}
          </option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Create a brand-new collection */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createCollection() } }}
          placeholder="New collection name"
          className="flex-1 min-w-0 bg-stone-900 border border-stone-700 text-stone-200 px-3 py-2 text-sm placeholder:text-stone-700 focus:outline-none focus:border-stone-500 transition-colors rounded"
        />
        <button
          type="button"
          onClick={createCollection}
          disabled={creating || !newName.trim()}
          className="px-4 py-2 text-[10px] tracking-[0.3em] uppercase border border-stone-700 text-stone-300 hover:border-stone-500 transition-colors disabled:opacity-40 rounded"
        >
          {creating ? '…' : 'Create'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
