/**
 * GET /api/auto-product/reject?token=<JWT>
 *
 * Rejects a pending product:
 * 1. Verifies the signed token
 * 2. Checks it hasn't already been used
 * 3. Deletes the Printify draft
 * 4. Marks pending_products row as 'rejected'
 * 5. Redirects to result page
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/approval-token'
import { deleteProduct } from '@/lib/printify'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const shopId = process.env.PRINTIFY_SHOP_ID!

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/auto-product/result?status=invalid`)
  }

  try {
    // 1. Verify JWT
    const payload = await verifyToken(token)
    if (payload.action !== 'reject') {
      return NextResponse.redirect(`${siteUrl}/auto-product/result?status=invalid`)
    }

    // 2. Check pending_products row
    const { data: pending, error: fetchError } = await supabaseAdmin()
      .from('pending_products')
      .select('id, status')
      .eq('id', payload.pendingId)
      .single()

    if (fetchError || !pending) {
      return NextResponse.redirect(`${siteUrl}/auto-product/result?status=invalid`)
    }

    if (pending.status !== 'pending') {
      return NextResponse.redirect(`${siteUrl}/auto-product/result?status=already-used`)
    }

    // 3. Delete draft from Printify
    await deleteProduct(shopId, payload.printifyId)

    // 4. Mark as rejected
    await supabaseAdmin()
      .from('pending_products')
      .update({ status: 'rejected' })
      .eq('id', payload.pendingId)

    return NextResponse.redirect(`${siteUrl}/auto-product/result?status=rejected`)
  } catch (err) {
    console.error('[auto-product] Reject error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('expired') || msg.includes('Invalid token')) {
      return NextResponse.redirect(`${siteUrl}/auto-product/result?status=invalid`)
    }
    return NextResponse.redirect(`${siteUrl}/auto-product/result?status=error`)
  }
}
