import { Metadata } from 'next'
import { Product } from '@/types'
import ShopPageClient from '@/components/ShopPageClient'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse The Heartwear Store full collection of thoughtfully made, printed-on-demand clothing.',
}

/**
 * Collapse garment-style groups to one card per design (preserving order).
 * The default 'classic' garment represents the group; ungrouped products pass through.
 */
function dedupeByGroup(products: Product[]): Product[] {
  const primary = new Map<string, Product>()
  for (const p of products) {
    if (!p.group_id) continue
    const cur = primary.get(p.group_id)
    if (!cur || (p.style_key === 'classic' && cur.style_key !== 'classic')) primary.set(p.group_id, p)
  }
  const emitted = new Set<string>()
  const out: Product[] = []
  for (const p of products) {
    if (!p.group_id) { out.push(p); continue }
    if (emitted.has(p.group_id)) continue
    emitted.add(p.group_id)
    out.push(primary.get(p.group_id)!)
  }
  return out
}

async function getAllProducts(): Promise<Product[]> {
  noStore()
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Note: .eq('is_enabled', true) has a Supabase JS boolean coercion bug
    // that silently returns 0 rows. Filter in JS instead.
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error.message)
      return []
    }

    // Exclude custom (public-uploaded) tees — they're orderable by link only.
    const visible = (data as Product[]).filter(p => p.is_enabled !== false && p.is_custom !== true)
    // One card per design group (the garment styles share a group_id).
    return dedupeByGroup(visible)
  } catch (err) {
    console.error('Failed to fetch products:', err)
    return []
  }
}

export default async function ShopPage() {
  const products = await getAllProducts()

  return <ShopPageClient products={products} />
}
