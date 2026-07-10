/**
 * /collections — index of shoppable collections with a cover image + count.
 * Only collections that contain at least one visible product are shown.
 */

import Link from 'next/link'
import { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse The Heartwear Store by collection.',
}

interface CollectionCard {
  name: string
  slug: string
  count: number
  cover: string
}

async function loadCollections(): Promise<CollectionCard[]> {
  noStore()
  try {
    const db = supabaseAdmin()
    const [{ data: colls }, { data: links }, { data: products }] = await Promise.all([
      db.from('collections').select('id, name, slug').order('name', { ascending: true }),
      db.from('product_collections').select('product_id, collection_id'),
      db.from('products').select('id, images, is_enabled, is_custom'),
    ])

    // Visible products → id → cover image src.
    const cover = new Map<string, string>()
    for (const p of products ?? []) {
      if (p.is_enabled === false || p.is_custom === true) continue
      const imgs = (p.images as { src: string; is_default?: boolean }[] | null) ?? []
      cover.set(p.id as string, imgs.find((i) => i.is_default)?.src ?? imgs[0]?.src ?? '')
    }

    const countByColl = new Map<string, number>()
    const coverByColl = new Map<string, string>()
    for (const l of links ?? []) {
      const pid = l.product_id as string
      const cid = l.collection_id as string
      if (!cover.has(pid)) continue
      countByColl.set(cid, (countByColl.get(cid) ?? 0) + 1)
      if (!coverByColl.get(cid)) coverByColl.set(cid, cover.get(pid) as string)
    }

    return ((colls ?? []) as { id: string; name: string; slug: string }[])
      .map((c) => ({ name: c.name, slug: c.slug, count: countByColl.get(c.id) ?? 0, cover: coverByColl.get(c.id) ?? '' }))
      .filter((c) => c.count > 0)
  } catch {
    return []
  }
}

export default async function CollectionsIndexPage() {
  const collections = await loadCollections()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-2">The Heartwear Store</p>
        <h1 className="font-playfair text-4xl text-stone-50">Collections</h1>
      </div>

      {collections.length === 0 ? (
        <p className="text-stone-500 text-sm">No collections yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {collections.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`} className="group block">
              <div className="hw-stage aspect-square overflow-hidden rounded-card relative">
                {c.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.cover}
                    alt={c.name}
                    className="w-full h-full object-contain p-[6%] transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-900" />
                )}
              </div>
              <p className="mt-3 text-stone-100 text-sm font-medium">{c.name}</p>
              <p className="text-stone-500 text-xs">{c.count} {c.count === 1 ? 'design' : 'designs'}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
