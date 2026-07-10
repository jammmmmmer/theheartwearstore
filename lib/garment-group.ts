/**
 * Turn an approved primary product (e.g. the classic tee) into a full garment
 * group: tag the primary with a shared group_id, then create + persist the other
 * garment styles (V-Neck, Heavyweight, Women's) reusing the same artwork.
 *
 * Called from the approve paths so only APPROVED designs spawn the full garment
 * set. Best-effort — a failed garment is skipped, never blocking the approval.
 */

import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from './supabase'
import { expandDesignToGarments } from './split-product'

type PrintAreas = Parameters<typeof expandDesignToGarments>[0]['printAreas']

export async function buildGarmentGroup(params: {
  shopId: string
  primaryPrintifyId: string
  primaryStyleKey?: string
  title: string
  description: string
  tags: string[]
  printAreas: PrintAreas
  artistId?: string | null
}): Promise<string> {
  const db = supabaseAdmin()
  const groupId = randomUUID()
  const primaryStyle = params.primaryStyleKey ?? 'classic'

  // Tag the already-written primary product as the group's anchor.
  await db
    .from('products')
    .update({ group_id: groupId, style_key: primaryStyle })
    .eq('printify_id', params.primaryPrintifyId)

  try {
    const results = await expandDesignToGarments({
      shopId: params.shopId,
      primaryStyleKey: primaryStyle,
      title: params.title,
      description: params.description,
      tags: params.tags,
      printAreas: params.printAreas,
    })

    for (const r of results) {
      const enabled = r.full.variants.filter((v) => v.is_enabled)
      const priceFrom = enabled.length
        ? Math.min(...enabled.map((v) => v.price))
        : r.full.variants[0]?.price || 0

      await db.from('products').upsert(
        {
          printify_id: r.printifyId,
          printify_id_us: r.printifyIdUs,
          title: r.full.title || params.title,
          description: r.full.description || params.description,
          tags: r.full.tags || params.tags,
          options: r.full.options || [],
          variants: r.full.variants || [],
          images: r.full.images || [],
          price_from: priceFrom,
          is_enabled: true,
          is_custom: false,
          artist_id: params.artistId ?? null,
          group_id: groupId,
          style_key: r.styleKey,
        },
        { onConflict: 'printify_id' }
      )
    }
  } catch (e) {
    console.warn('[garment-group] expansion failed (non-fatal):', e)
  }

  return groupId
}
