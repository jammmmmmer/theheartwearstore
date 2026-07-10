import { Product } from '@/types'

/**
 * Collapse garment-style groups to one product per design (preserving order).
 * The 'classic' garment represents the group; ungrouped products pass through.
 * Used anywhere products are listed (shop, homepage, related, collections).
 */
export function dedupeByGroup(products: Product[]): Product[] {
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
