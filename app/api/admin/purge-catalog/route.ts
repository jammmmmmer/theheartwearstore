/**
 * POST /api/admin/purge-catalog — admin-only. PERMANENTLY deletes products
 * from Printify AND the shop database.
 *
 * The Printify dashboard blocks deleting store-connected ("Publishing")
 * products; the API can, by unpublishing then deleting. Runs in batches so it
 * stays within the function time limit — the client calls it in a loop until
 * `remaining` reaches 0.
 *
 * Body: { confirm: "PURGE" }  (required guard against accidents)
 * Returns: { ok, totalFound, deleted, remaining, errors }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProducts, unpublishProduct, deleteProduct } from '@/lib/printify'
import { supabaseAdmin } from '@/lib/supabase'
import { isUploadAuthorized } from '@/lib/session'

export const runtime = 'nodejs'
export const maxDuration = 60

const BATCH = 10

export async function POST(request: NextRequest) {
  if (!(await isUploadAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { confirm } = (await request.json().catch(() => ({}))) as { confirm?: string }
  if (confirm !== 'PURGE') {
    return NextResponse.json({ error: 'Confirmation required (confirm: "PURGE")' }, { status: 400 })
  }

  const shopId = process.env.PRINTIFY_SHOP_ID!
  const db = supabaseAdmin()
  const errors: string[] = []

  try {
    const products = (await getProducts(shopId)) as { id: string; title?: string }[]
    const totalFound = products.length
    const batch = products.slice(0, BATCH)

    let deleted = 0
    for (const p of batch) {
      try {
        await unpublishProduct(shopId, p.id) // best-effort
        await deleteProduct(shopId, p.id)
        await db.from('products').delete().eq('printify_id', p.id)
        deleted++
      } catch (e) {
        errors.push(`${p.title ?? p.id}: ${e instanceof Error ? e.message : 'error'}`)
      }
    }

    const remaining = Math.max(0, totalFound - deleted)

    // When Printify is fully cleared, sweep any leftover rows in the DB.
    if (remaining === 0) {
      const { error } = await db.from('products').delete().neq('id', '')
      if (error) errors.push(`db sweep: ${error.message}`)
    }

    return NextResponse.json({ ok: true, totalFound, deleted, remaining, errors })
  } catch (err) {
    console.error('[purge-catalog] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error', errors },
      { status: 500 }
    )
  }
}
