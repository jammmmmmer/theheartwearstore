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
import { getProduct, publishProduct, deleteProduct } from '@/lib/printify'
import { isUploadAuthorized } from '@/lib/session'

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
      }
      const enabled = product.variants.filter((v) => v.is_enabled)
      const priceFrom = enabled.length
        ? Math.min(...enabled.map((v) => v.price))
        : product.variants[0]?.price || 0

      const { error: upsertError } = await db.from('products').upsert(
        {
          printify_id: product.id,
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
      const { error } = await db.from('products').update({ is_custom: false }).eq('id', productId)
      if (error) throw new Error(error.message)
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
