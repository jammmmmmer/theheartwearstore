/**
 * POST /api/admin/publish-all
 * One-time admin route: publishes all products in Supabase to Printify
 * so they appear as "Published" in the Printify portal.
 * Protected by SYNC_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { publishProduct } from '@/lib/printify'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shopId = process.env.PRINTIFY_SHOP_ID!

  const { data: products, error } = await supabaseAdmin()
    .from('products')
    .select('printify_id, title')
    .eq('is_enabled', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: { printify_id: string; title: string; status: string }[] = []

  for (const product of products ?? []) {
    try {
      await publishProduct(shopId, product.printify_id)
      results.push({ printify_id: product.printify_id, title: product.title, status: 'published' })
    } catch (err) {
      results.push({
        printify_id: product.printify_id,
        title: product.title,
        status: `failed: ${err instanceof Error ? err.message : 'unknown'}`,
      })
    }
  }

  return NextResponse.json({ ok: true, results })
}
