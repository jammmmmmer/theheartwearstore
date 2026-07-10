/**
 * Dynamic product catalog configuration.
 *
 * Which garment (blueprint), which print provider, which variants
 * (sizes × colors) and what retail price new products get — previously
 * hardcoded in three files — now lives in the `catalog_items` table and is
 * refreshed from Printify's catalog API via /api/admin/catalog-sync.
 *
 * Adding a hoodie or a new color becomes a data change, not a code change.
 */

import { supabaseAdmin } from './supabase'

export interface CatalogItem {
  blueprint_id: number
  print_provider_id: number
  label: string
  /** Retail price in CAD cents applied to newly created products */
  price: number
  /** Variants offered for sale (subset of all_variant_ids) */
  enabled_variant_ids: number[]
  /** Every variant the print areas must cover */
  all_variant_ids: number[]
}

/**
 * The original hardcoded config (blueprint 145 = Gildan 64000 Softstyle,
 * provider 6, 4 colors × 5 sizes enabled). Used as a fallback when the
 * catalog_items table is missing or empty, so product creation keeps
 * working even before the migration/seed has run.
 */
export const FALLBACK_CATALOG_ITEM: CatalogItem = {
  blueprint_id: 145,
  print_provider_id: 6,
  label: 'Unisex Softstyle Tee (Gildan 64000)',
  price: 3999,
  enabled_variant_ids: [
    38158, 38162, 38163, 38164,
    38172, 38176, 38177, 38178,
    38186, 38190, 38191, 38192,
    38200, 38204, 38205, 38206,
    38214, 38218, 38219, 38220,
  ],
  all_variant_ids: Array.from({ length: 75 }, (_, i) => 38153 + i).filter(
    (id) => id <= 38231 && id !== 38224 && id !== 38226 && id !== 38228 && id !== 38230
  ),
}

function isUsable(item: Partial<CatalogItem> | null | undefined): item is CatalogItem {
  return Boolean(
    item &&
    Number.isFinite(item.blueprint_id) &&
    Number.isFinite(item.print_provider_id) &&
    Number.isFinite(item.price) && (item.price as number) > 0 &&
    Array.isArray(item.enabled_variant_ids) && item.enabled_variant_ids.length > 0 &&
    Array.isArray(item.all_variant_ids) && item.all_variant_ids.length > 0
  )
}

/**
 * The default catalog item used by the upload + AI-generate pipelines.
 * Falls back to the hardcoded config if the table is empty/unavailable.
 */
export async function getDefaultCatalogItem(): Promise<CatalogItem> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('catalog_items')
      .select('blueprint_id, print_provider_id, label, price, enabled_variant_ids, all_variant_ids')
      .eq('is_enabled', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !isUsable(data)) {
      if (error) console.warn('[catalog] Falling back to hardcoded config:', error.message)
      return FALLBACK_CATALOG_ITEM
    }
    return data
  } catch (err) {
    console.warn('[catalog] Falling back to hardcoded config:', err)
    return FALLBACK_CATALOG_ITEM
  }
}

export interface SplitCatalog {
  /** Canada fulfilment (Print Geek) — the primary product shown in the shop. */
  ca: CatalogItem
  /** US fulfilment (Monster Digital) — null when no US row is configured (falls back to single-product). */
  us: CatalogItem | null
}

/**
 * The regional split config: a CA provider + a US provider on the same blueprint.
 * Variant IDs are shared across providers for this blueprint, so an order's
 * variant maps 1:1 to either provider — no remapping needed. Falls back to the
 * single default item (us = null) when the split isn't configured.
 */
export async function getSplitCatalog(): Promise<SplitCatalog> {
  try {
    const { data } = await supabaseAdmin()
      .from('catalog_items')
      .select('blueprint_id, print_provider_id, label, price, enabled_variant_ids, all_variant_ids, region')
      .eq('is_enabled', true)
      .in('region', ['CA', 'US'])

    const rows = (data ?? []) as (CatalogItem & { region: string })[]
    const ca = rows.find((r) => r.region === 'CA')
    const us = rows.find((r) => r.region === 'US')
    if (ca && isUsable(ca)) {
      return { ca, us: us && isUsable(us) ? us : null }
    }
  } catch (err) {
    console.warn('[catalog] Split lookup failed, using single default:', err)
  }
  return { ca: await getDefaultCatalogItem(), us: null }
}
