/**
 * /admin/review — admin approval queue (protected by proxy.ts).
 *
 * Shows two lists, read server-side with the service role:
 *  - Pending designs (pending_products, status = pending) → approve to shop / reject
 *  - Customer creations (products.is_custom = true) → add to shop collection / hide
 */

import { supabaseAdmin } from '@/lib/supabase'
import AdminReviewClient, { PendingItem, CustomItem, ShopItem } from '@/components/AdminReviewClient'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Review Queue' }

async function loadQueue(): Promise<{ pending: PendingItem[]; customs: CustomItem[]; shop: ShopItem[] }> {
  try {
    const db = supabaseAdmin()
    const [{ data: pending }, { data: customs }, { data: shopRows }] = await Promise.all([
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
      db
        .from('products')
        .select('id, title, images, price_from, created_at')
        .eq('is_custom', false)
        .eq('is_enabled', true)
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    const toBase = (p: { id: string; title: string; images: unknown; price_from: number | null }) => {
      const imgs = (p.images as { src: string; is_default?: boolean }[] | null) ?? []
      const src = imgs.find((i) => i.is_default)?.src ?? imgs[0]?.src ?? ''
      return { id: p.id as string, title: p.title as string, image: src, price_from: (p.price_from as number) ?? 0 }
    }
    const customBase = (customs ?? []).map(toBase)
    const shopBase = (shopRows ?? []).map(toBase)

    // Current collection memberships for every product shown on this page.
    const collByProduct = new Map<string, string[]>()
    const allIds = [...customBase, ...shopBase].map((p) => p.id)
    if (allIds.length) {
      const { data: pc } = await db
        .from('product_collections')
        .select('product_id, collection_id')
        .in('product_id', allIds)
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
    const shopItems: ShopItem[] = shopBase.map((c) => ({
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

    return { pending: pendingItems, customs: customItems, shop: shopItems }
  } catch {
    return { pending: [], customs: [], shop: [] }
  }
}

export default async function AdminReviewPage() {
  const { pending, customs, shop } = await loadQueue()
  return <AdminReviewClient pending={pending} customs={customs} shop={shop} />
}
