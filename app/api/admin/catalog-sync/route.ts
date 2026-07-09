/**
 * POST /api/admin/catalog-sync
 * Refreshes catalog_items from Printify's catalog API.
 * Protected by Bearer SYNC_SECRET.
 *
 * Body (all optional):
 *   { }                                  → re-sync variants for every existing row
 *   { "blueprintId": 77,
 *     "printProviderId": 29,             → add/refresh one item (e.g. a hoodie)
 *     "label": "Unisex Hoodie",
 *     "price": 5999,                     → CAD cents (required for NEW items)
 *     "enabledVariantIds": [...],        → optional; defaults to all variants
 *     "setDefault": true }               → make this the item used by uploads
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCatalogVariants, getCatalogShipping, CatalogShipping } from '@/lib/printify'

export const runtime = 'nodejs'
export const maxDuration = 60

interface SyncOneResult {
  blueprint_id: number
  print_provider_id: number
  label: string
  variant_count: number
  enabled_count: number
}

async function syncOne(params: {
  blueprintId: number
  printProviderId: number
  label?: string
  price?: number
  enabledVariantIds?: number[]
  setDefault?: boolean
}): Promise<SyncOneResult> {
  const db = supabaseAdmin()
  const { blueprintId, printProviderId } = params

  const catalog = await getCatalogVariants(blueprintId, printProviderId)
  const allIds = catalog.variants.map((v) => v.id)
  if (!allIds.length) {
    throw new Error(`Printify returned no variants for blueprint ${blueprintId} / provider ${printProviderId}`)
  }

  // Shipping profiles power pass-through checkout rates (non-fatal if missing)
  let shipping: CatalogShipping | null = null
  try {
    shipping = await getCatalogShipping(blueprintId, printProviderId)
  } catch (err) {
    console.warn(`[catalog-sync] Shipping fetch failed for ${blueprintId}/${printProviderId} (non-fatal):`, err)
  }

  const { data: existing } = await db
    .from('catalog_items')
    .select('label, price, enabled_variant_ids, is_default')
    .eq('blueprint_id', blueprintId)
    .eq('print_provider_id', printProviderId)
    .maybeSingle()

  const price = params.price ?? existing?.price
  if (!price || price <= 0) {
    throw new Error(`"price" (CAD cents) is required for new item ${blueprintId}/${printProviderId}`)
  }

  // Keep only enabled IDs that still exist in the provider's catalog
  const requestedEnabled =
    params.enabledVariantIds ?? existing?.enabled_variant_ids ?? allIds
  const enabledIds = requestedEnabled.filter((id: number) => allIds.includes(id))
  if (!enabledIds.length) {
    throw new Error(`No requested enabled variants exist in the provider catalog for ${blueprintId}/${printProviderId}`)
  }

  const label = params.label ?? existing?.label ?? `Blueprint ${blueprintId} / ${catalog.title ?? `Provider ${printProviderId}`}`

  if (params.setDefault) {
    await db.from('catalog_items').update({ is_default: false }).eq('is_default', true)
  }

  const { error } = await db.from('catalog_items').upsert(
    {
      blueprint_id: blueprintId,
      print_provider_id: printProviderId,
      label,
      price,
      enabled_variant_ids: enabledIds,
      all_variant_ids: allIds,
      variants: catalog.variants,
      variants_synced_at: new Date().toISOString(),
      ...(shipping ? { shipping, shipping_synced_at: new Date().toISOString() } : {}),
      is_default: params.setDefault ?? existing?.is_default ?? false,
      is_enabled: true,
    },
    { onConflict: 'blueprint_id,print_provider_id' }
  )
  if (error) throw new Error(`Upsert failed: ${error.message}`)

  return {
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    label,
    variant_count: allIds.length,
    enabled_count: enabledIds.length,
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      blueprintId?: number
      printProviderId?: number
      label?: string
      price?: number
      enabledVariantIds?: number[]
      setDefault?: boolean
    }

    // Single-item mode
    if (body.blueprintId && body.printProviderId) {
      const result = await syncOne({
        blueprintId: Number(body.blueprintId),
        printProviderId: Number(body.printProviderId),
        label: body.label,
        price: body.price,
        enabledVariantIds: body.enabledVariantIds,
        setDefault: body.setDefault,
      })
      return NextResponse.json({ ok: true, results: [result] })
    }

    // Bulk mode: re-sync every existing item
    const db = supabaseAdmin()
    const { data: items, error } = await db
      .from('catalog_items')
      .select('blueprint_id, print_provider_id')
    if (error) {
      return NextResponse.json({ error: `Query failed: ${error.message}` }, { status: 500 })
    }
    if (!items?.length) {
      return NextResponse.json({
        ok: true,
        message: 'catalog_items is empty — pass blueprintId + printProviderId + price to add one',
        results: [],
      })
    }

    const results: SyncOneResult[] = []
    for (const item of items) {
      results.push(await syncOne({
        blueprintId: item.blueprint_id,
        printProviderId: item.print_provider_id,
      }))
    }
    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('[catalog-sync] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
