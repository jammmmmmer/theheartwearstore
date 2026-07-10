/**
 * /admin/review — admin approval queue (protected by proxy.ts).
 *
 * Shows two lists, read server-side with the service role:
 *  - Pending designs (pending_products, status = pending) → approve to shop / reject
 *  - Customer creations (products.is_custom = true) → add to shop collection / hide
 */

import { supabaseAdmin } from '@/lib/supabase'
import AdminReviewClient, { PendingItem, CustomItem } from '@/components/AdminReviewClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Review Queue' }

async function loadQueue(): Promise<{ pending: PendingItem[]; customs: CustomItem[] }> {
  try {
    const db = supabaseAdmin()
    const [{ data: pending }, { data: customs }] = await Promise.all([
      db
        .from('pending_products')
        .select('id, title, mockup_url, topic, created_at, collection_ids')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      db
        .from('products')
        .select('id, title, images, price_from, created_at')
        .eq('is_custom', true)
        .eq('is_enabled', true)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    const customBase = (customs ?? []).map((p) => {
      const imgs = (p.images as { src: string; is_default?: boolean }[] | null) ?? []
      const src = imgs.find((i) => i.is_default)?.src ?? imgs[0]?.src ?? ''
      return { id: p.id as string, title: p.title as string, image: src, price_from: (p.price_from as number) ?? 0 }
    })

    // Current collection memberships for the customer-creation products.
    const collByProduct = new Map<string, string[]>()
    if (customBase.length) {
      const { data: pc } = await db
        .from('product_collections')
        .select('product_id, collection_id')
        .in('product_id', customBase.map((c) => c.id))
      for (const row of pc ?? []) {
        const arr = collByProduct.get(row.product_id as string) ?? []
        arr.push(row.collection_id as string)
        collByProduct.set(row.product_id as string, arr)
      }
    }
    const customItems: CustomItem[] = customBase.map((c) => ({
      ...c,
      collectionIds: collByProduct.get(c.id) ?? [],
    }))

    // Attach community vote counts and surface the most-voted designs first.
    const pendingRows = (pending ?? []) as {
      id: string; title: string; mockup_url: string | null; topic: string | null; created_at: string; collection_ids: string[] | null
    }[]
    const voteCounts = new Map<string, number>()
    if (pendingRows.length) {
      const { data: votes } = await db
        .from('design_votes')
        .select('pending_product_id')
        .in('pending_product_id', pendingRows.map((p) => p.id))
      for (const v of votes ?? []) {
        const key = v.pending_product_id as string
        voteCounts.set(key, (voteCounts.get(key) ?? 0) + 1)
      }
    }
    const pendingItems: PendingItem[] = pendingRows
      .map((p) => ({
        id: p.id,
        title: p.title,
        mockup_url: p.mockup_url,
        topic: p.topic,
        created_at: p.created_at,
        votes: voteCounts.get(p.id) ?? 0,
        collectionIds: p.collection_ids ?? [],
      }))
      .sort((a, b) => b.votes - a.votes || (a.created_at < b.created_at ? 1 : -1))

    return { pending: pendingItems, customs: customItems }
  } catch {
    return { pending: [], customs: [] }
  }
}

export default async function AdminReviewPage() {
  const { pending, customs } = await loadQueue()
  return <AdminReviewClient pending={pending} customs={customs} />
}
