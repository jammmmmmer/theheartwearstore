/**
 * Collections: named, shoppable groupings of products (many-to-many via
 * product_collections). Chosen at admin upload, editable in the review queue,
 * and browsable on the storefront.
 */

import { supabaseAdmin } from './supabase'

export interface Collection {
  id: string
  name: string
  slug: string
}

/** URL-safe slug from a collection name. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** All collections, alphabetical. */
export async function listCollections(): Promise<Collection[]> {
  const { data } = await supabaseAdmin()
    .from('collections')
    .select('id, name, slug')
    .order('name', { ascending: true })
  return (data ?? []) as Collection[]
}

/**
 * Resolve a set of collection names + existing ids into a deduped id list,
 * creating any collection whose slug doesn't exist yet. Idempotent per slug.
 */
export async function resolveCollections(params: {
  ids?: string[]
  newNames?: string[]
}): Promise<string[]> {
  const db = supabaseAdmin()
  const ids = new Set((params.ids ?? []).filter(Boolean))

  const names = (params.newNames ?? []).map((n) => n.trim()).filter(Boolean)
  for (const name of names) {
    const slug = slugify(name)
    if (!slug) continue
    // Insert if new; either way fetch the id for this slug.
    await db.from('collections').upsert({ name, slug }, { onConflict: 'slug', ignoreDuplicates: true })
    const { data: row } = await db.from('collections').select('id').eq('slug', slug).maybeSingle()
    if (row?.id) ids.add(row.id as string)
  }
  return Array.from(ids)
}

/** Replace a product's collection memberships with exactly `collectionIds`. */
export async function setProductCollections(productId: string, collectionIds: string[]): Promise<void> {
  const db = supabaseAdmin()
  await db.from('product_collections').delete().eq('product_id', productId)
  if (collectionIds.length) {
    await db
      .from('product_collections')
      .insert(collectionIds.map((collection_id) => ({ product_id: productId, collection_id })))
  }
}

/** Store the chosen collections on a pending design (carried through approval). */
export async function setPendingCollections(pendingId: string, collectionIds: string[]): Promise<void> {
  await supabaseAdmin()
    .from('pending_products')
    .update({ collection_ids: collectionIds })
    .eq('id', pendingId)
}

/** Copy a pending design's chosen collections onto the freshly-approved product. */
export async function applyPendingCollectionsToProduct(pendingId: string, productId: string): Promise<void> {
  try {
    const { data: pending } = await supabaseAdmin()
      .from('pending_products')
      .select('collection_ids')
      .eq('id', pendingId)
      .maybeSingle()
    const ids = (pending?.collection_ids as string[] | null) ?? []
    if (ids.length) await setProductCollections(productId, ids)
  } catch (e) {
    console.warn('[collections] applyPendingCollectionsToProduct failed (non-fatal):', e)
  }
}

/** Collection ids a product currently belongs to. */
export async function getProductCollectionIds(productId: string): Promise<string[]> {
  const { data } = await supabaseAdmin()
    .from('product_collections')
    .select('collection_id')
    .eq('product_id', productId)
  return (data ?? []).map((r) => r.collection_id as string)
}
