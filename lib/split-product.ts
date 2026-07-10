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

import { getSplitCatalog, CatalogItem } from './catalog'
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
    print_areas: areas.map((area) => ({
      variant_ids: item.all_variant_ids,
      placeholders: [
        { position: area.position, images: area.images.map((img) => ({ ...img, id: imageId })) },
      ],
    })),
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
