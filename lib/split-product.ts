/**
 * Dual-provider ("split") product creation.
 *
 * Creates the SAME design as two Printify products — one on the Canadian
 * provider (Print Geek) and one on the US provider (Monster Digital) — so an
 * order can be fulfilled locally on either side of the border. Variant IDs are
 * shared across providers on this blueprint, so the two products are variant-
 * identical and no remapping is needed at fulfilment.
 *
 * Falls back to a single product when no US provider is configured.
 */

import { getSplitCatalog, getStyleCatalog, CatalogItem } from './catalog'
import { createDraftProduct, publishProduct, getProduct } from './printify'

export interface PlacementArea {
  position: string
  images: { x: number; y: number; scale: number; angle: number }[]
}

interface FullProduct {
  id: string
  title: string
  description: string
  tags: string[]
  options: unknown[]
  variants: { price: number; is_enabled: boolean }[]
  images: unknown[]
}

function buildPayload(
  item: CatalogItem,
  title: string,
  description: string,
  tags: string[],
  imageId: string,
  areas: PlacementArea[]
) {
  const enabledSet = new Set(item.enabled_variant_ids)
  return {
    title,
    description,
    tags,
    blueprint_id: item.blueprint_id,
    print_provider_id: item.print_provider_id,
    variants: item.all_variant_ids.map((id) => ({
      id,
      price: item.price,
      is_enabled: enabledSet.has(id),
    })),
    // ONE print area covering all variants, with one placeholder per position.
    // Printify keys print areas by variant set, so multiple areas over the same
    // variant_ids collide and all but one placement is dropped (e.g. front+back
    // would lose the front). Keep every position in a single area's placeholders.
    print_areas: [
      {
        variant_ids: item.all_variant_ids,
        placeholders: areas.map((area) => ({
          position: area.position,
          images: area.images.map((img) => ({ ...img, id: imageId })),
        })),
      },
    ],
  }
}

export interface SplitCreateResult {
  /** Primary (Canada / Print Geek) Printify product id — shown in the shop. */
  printifyIdCa: string
  /** US (Monster Digital) Printify product id, or null when no US provider configured. */
  printifyIdUs: string | null
  /** Full CA product (variants/options/images) for the products row. */
  caFull: FullProduct
}

export async function createSplitProducts(params: {
  shopId: string
  title: string
  description: string
  tags: string[]
  imageId: string
  areas: PlacementArea[]
}): Promise<SplitCreateResult> {
  const { shopId, title, description, tags, imageId, areas } = params
  const { ca, us } = await getSplitCatalog()

  // Canada product (primary — its mockups are shown in the shop)
  const caDraft = await createDraftProduct(shopId, buildPayload(ca, title, description, tags, imageId, areas))
  try { await publishProduct(shopId, caDraft.id) } catch (e) {
    console.warn('[split] publish CA failed (non-fatal):', e)
  }

  // US product (same design, US provider) — best-effort; failure degrades to CA-only
  let printifyIdUs: string | null = null
  if (us) {
    try {
      const usDraft = await createDraftProduct(shopId, buildPayload(us, title, description, tags, imageId, areas))
      try { await publishProduct(shopId, usDraft.id) } catch (e) {
        console.warn('[split] publish US failed (non-fatal):', e)
      }
      printifyIdUs = usDraft.id
    } catch (e) {
      console.warn('[split] US product creation failed (non-fatal, CA-only):', e)
    }
  }

  const caFull = (await getProduct(shopId, caDraft.id)) as FullProduct
  return { printifyIdCa: caDraft.id, printifyIdUs, caFull }
}

export interface StyleCreateResult {
  styleKey: string
  styleLabel: string
  fit: string
  isDefault: boolean
  /** Retail price (CAD cents) for this garment. */
  price: number
  /** Primary Printify product id (CA when a CA provider exists, else the US product). */
  printifyId: string
  /** US counterpart id, or null (US-only garments have their product AS the primary). */
  printifyIdUs: string | null
  /** Full primary product (variants/options/images) for the products row. */
  full: FullProduct
}

/**
 * Create ONE garment style as Printify products for a design: the CA product
 * (shown in the shop) plus the US counterpart when both providers exist. For a
 * US-only garment, the US product IS the primary. Variant sets can differ across
 * providers, so each product uses its own catalog row's variants.
 *
 * Returns null when the style isn't configured. Called once per style by the
 * creation flow (one request per garment) so no single request creates them all.
 */
export async function createStyleProducts(params: {
  shopId: string
  styleKey: string
  title: string
  description: string
  tags: string[]
  imageId: string
  areas: PlacementArea[]
}): Promise<StyleCreateResult | null> {
  const { shopId, title, description, tags, imageId, areas } = params
  const styles = await getStyleCatalog()
  const style = styles.find((s) => s.styleKey === params.styleKey)
  if (!style || (!style.ca && !style.us)) return null

  // Primary product: CA if this garment has a CA provider, else the US product.
  const primary = style.ca ?? style.us!
  const primaryDraft = await createDraftProduct(shopId, buildPayload(primary, title, description, tags, imageId, areas))
  try { await publishProduct(shopId, primaryDraft.id) } catch (e) {
    console.warn(`[split] publish primary (${style.styleKey}) failed (non-fatal):`, e)
  }

  // US counterpart only when a distinct US provider exists alongside the CA one.
  let printifyIdUs: string | null = null
  if (style.ca && style.us) {
    try {
      const usDraft = await createDraftProduct(shopId, buildPayload(style.us, title, description, tags, imageId, areas))
      try { await publishProduct(shopId, usDraft.id) } catch (e) {
        console.warn(`[split] publish US (${style.styleKey}) failed (non-fatal):`, e)
      }
      printifyIdUs = usDraft.id
    } catch (e) {
      console.warn(`[split] US product for ${style.styleKey} failed (non-fatal, CA-only):`, e)
    }
  }

  const full = (await getProduct(shopId, primaryDraft.id)) as FullProduct
  return {
    styleKey: style.styleKey,
    styleLabel: style.styleLabel,
    fit: style.fit,
    isDefault: style.isDefault,
    price: primary.price,
    printifyId: primaryDraft.id,
    printifyIdUs,
    full,
  }
}

/** A Printify print-area placeholder as returned by getProduct. */
interface ProductPlaceholder {
  position: string
  images: { id: string; x: number; y: number; scale: number; angle: number }[]
}
interface ProductPrintArea {
  variant_ids?: number[]
  placeholders?: ProductPlaceholder[]
}

/**
 * Create the US (Monster Digital) counterpart of an already-created CA product,
 * reusing that product's print areas (same artwork, same placement). Used by the
 * admin approval paths so an approved community design becomes orderable in the
 * US too. Best-effort: returns null when no US provider is configured or on any
 * failure (the CA product remains the sole fulfilment source).
 *
 * @param printAreas the CA product's `print_areas` (from getProduct)
 */
export async function createUsCounterpart(params: {
  shopId: string
  title: string
  description: string
  tags: string[]
  printAreas: ProductPrintArea[] | undefined
}): Promise<string | null> {
  const { shopId, title, description, tags, printAreas } = params
  const { us } = await getSplitCatalog()
  if (!us) return null

  // Collapse the CA product's print areas into one set of non-empty placeholders,
  // keyed by position (front/back). Variant IDs are shared across providers, so
  // the same artwork maps 1:1 onto the US variants.
  const byPosition = new Map<string, ProductPlaceholder>()
  for (const area of printAreas ?? []) {
    for (const ph of area.placeholders ?? []) {
      if (ph.images?.length && !byPosition.has(ph.position)) byPosition.set(ph.position, ph)
    }
  }
  const placeholders = [...byPosition.values()].map((ph) => ({
    position: ph.position,
    images: ph.images.map((img) => ({
      id: img.id, x: img.x, y: img.y, scale: img.scale, angle: img.angle,
    })),
  }))
  if (!placeholders.length) return null

  const enabledSet = new Set(us.enabled_variant_ids)
  try {
    const usDraft = await createDraftProduct(shopId, {
      title,
      description,
      tags,
      blueprint_id: us.blueprint_id,
      print_provider_id: us.print_provider_id,
      variants: us.all_variant_ids.map((id) => ({
        id, price: us.price, is_enabled: enabledSet.has(id),
      })),
      print_areas: [{ variant_ids: us.all_variant_ids, placeholders }],
    })
    try { await publishProduct(shopId, usDraft.id) } catch (e) {
      console.warn('[split] publish US counterpart failed (non-fatal):', e)
    }
    return usDraft.id
  } catch (e) {
    console.warn('[split] US counterpart creation failed (non-fatal, CA-only):', e)
    return null
  }
}
