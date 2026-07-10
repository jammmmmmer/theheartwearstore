/**
 * POST /api/admin/moderate  — admin-only moderation actions.
 *
 * Auth: httpOnly admin session cookie (or Bearer SYNC_SECRET), via isUploadAuthorized.
 *
 * Actions (JSON body):
 *   { action: 'approve', pendingId }  → publish a pending_products design to the shop
 *   { action: 'reject',  pendingId }  → delete the Printify draft, mark rejected
 *   { action: 'promote', productId }  → add a customer custom tee to the shop collection (is_custom=false)
 *   { action: 'hide',    productId }  → remove a product from the store (is_enabled=false)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getProduct, publishProduct, deleteProduct, updateProduct } from '@/lib/printify'
import { isUploadAuthorized } from '@/lib/session'
import { createUsCounterpart } from '@/lib/split-product'
import { applyPendingCollectionsToProduct } from '@/lib/collections'
import { buildGarmentGroup } from '@/lib/garment-group'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!(await isUploadAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shopId = process.env.PRINTIFY_SHOP_ID!
  const db = supabaseAdmin()

  try {
    const { action, pendingId, productId } = (await request.json()) as {
      action: 'approve' | 'reject' | 'promote' | 'hide'
      pendingId?: string
      productId?: string
    }

    if (action === 'approve') {
      const { data: pending } = await db
        .from('pending_products')
        .select('id, status, printify_id, artist_id')
        .eq('id', pendingId)
        .single()
      if (!pending || pending.status !== 'pending') {
        return NextResponse.json({ error: 'Not a pending design' }, { status: 400 })
      }

      const product = (await getProduct(shopId, pending.printify_id)) as {
        id: string
        title: string
        description: string
        tags: string[]
        options: unknown[]
        variants: { price: number; is_enabled: boolean }[]
        images: unknown[]
        print_areas?: { variant_ids?: number[]; placeholders?: { position: string; images: { id: string; x: number; y: number; scale: number; angle: number }[] }[] }[]
      }
      const enabled = product.variants.filter((v) => v.is_enabled)
      const priceFrom = enabled.length
        ? Math.min(...enabled.map((v) => v.price))
        : product.variants[0]?.price || 0

      // Split fulfilment: create the US (Monster Digital) counterpart so the
      // approved design is orderable in the US too. Best-effort → CA-only on null.
      const printifyIdUs = await createUsCounterpart({
        shopId,
        title: product.title,
        description: product.description || '',
        tags: product.tags || [],
        printAreas: product.print_areas,
      })

      const { error: upsertError } = await db.from('products').upsert(
        {
          printify_id: product.id,
          printify_id_us: printifyIdUs,
          title: product.title,
          description: product.description || '',
          tags: product.tags || [],
          options: product.options || [],
          variants: product.variants || [],
          images: product.images || [],
          price_from: priceFrom,
          is_enabled: true,
          is_custom: false,
          artist_id: pending.artist_id ?? null,
        },
        { onConflict: 'printify_id' }
      )
      if (upsertError) throw new Error(`Upsert failed: ${upsertError.message}`)

      // Carry the collections chosen at upload onto the live product.
      const { data: prodRow } = await db
        .from('products')
        .select('id')
        .eq('printify_id', product.id)
        .maybeSingle()
      if (prodRow?.id) await applyPendingCollectionsToProduct(pendingId!, prodRow.id as string)

      // Expand into the full garment group (V-Neck, Heavyweight, Women's).
      await buildGarmentGroup({
        shopId,
        primaryPrintifyId: product.id,
        title: product.title,
        description: product.description || '',
        tags: product.tags || [],
        printAreas: product.print_areas,
        artistId: pending.artist_id ?? null,
      })

      try { await publishProduct(shopId, pending.printify_id) } catch (e) {
        console.warn('[moderate] publishProduct failed (non-fatal):', e)
      }
      await db.from('pending_products').update({ status: 'approved' }).eq('id', pendingId)
      return NextResponse.json({ ok: true })
    }

    if (action === 'reject') {
      const { data: pending } = await db
        .from('pending_products')
        .select('id, status, printify_id')
        .eq('id', pendingId)
        .single()
      if (!pending || pending.status !== 'pending') {
        return NextResponse.json({ error: 'Not a pending design' }, { status: 400 })
      }
      try { await deleteProduct(shopId, pending.printify_id) } catch (e) {
        console.warn('[moderate] deleteProduct failed (non-fatal):', e)
      }
      await db.from('pending_products').update({ status: 'rejected' }).eq('id', pendingId)
      return NextResponse.json({ ok: true })
    }

    if (action === 'promote') {
      // Promoting a customer creation into the shop collection: drop the custom
      // flag and strip the trailing " (Custom)" suffix from the shop title.
      const { data: prod } = await db
        .from('products')
        .select('title, printify_id, printify_id_us')
        .eq('id', productId)
        .single()
      const cleanTitle = (prod?.title ?? '').replace(/\s*\(custom\)\s*$/i, '').trim()
      const { error } = await db
        .from('products')
        .update({ is_custom: false, ...(cleanTitle ? { title: cleanTitle } : {}) })
        .eq('id', productId)
      if (error) throw new Error(error.message)

      // Best-effort: mirror the cleaned title onto the Printify product(s) so the
      // dashboard and order labels match the shop. Non-fatal — DB is source of truth.
      if (cleanTitle) {
        for (const pid of [prod?.printify_id, prod?.printify_id_us]) {
          if (!pid) continue
          try { await updateProduct(shopId, String(pid), { title: cleanTitle }) } catch (e) {
            console.warn(`[moderate] Printify title update failed for ${pid} (non-fatal):`, e)
          }
        }
      }
      return NextResponse.json({ ok: true })
    }

    if (action === 'hide') {
      const { error } = await db.from('products').update({ is_enabled: false }).eq('id', productId)
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[moderate] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
