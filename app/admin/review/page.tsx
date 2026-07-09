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
        .select('id, title, mockup_url, topic, created_at')
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

    const customItems: CustomItem[] = (customs ?? []).map((p) => {
      const imgs = (p.images as { src: string; is_default?: boolean }[] | null) ?? []
      const src = imgs.find((i) => i.is_default)?.src ?? imgs[0]?.src ?? ''
      return { id: p.id as string, title: p.title as string, image: src, price_from: (p.price_from as number) ?? 0 }
    })

    return { pending: (pending ?? []) as PendingItem[], customs: customItems }
  } catch {
    return { pending: [], customs: [] }
  }
}

export default async function AdminReviewPage() {
  const { pending, customs } = await loadQueue()
  return <AdminReviewClient pending={pending} customs={customs} />
}
