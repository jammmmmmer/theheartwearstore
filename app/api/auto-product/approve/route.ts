/**
 * GET /api/auto-product/approve?token=<JWT>
 *
 * Approves a pending product:
 * 1. Verifies the signed token
 * 2. Checks it hasn't already been used
 * 3. Publishes the Printify product
 * 4. Syncs to Supabase products table (is_enabled: true)
 * 5. Marks pending_products row as 'approved'
 * 6. Redirects to result page
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/approval-token'
import { publishProduct, getProduct } from '@/lib/printify'
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
    if (payload.action !== 'approve') {
      return NextResponse.redirect(`${siteUrl}/auto-product/result?status=invalid`)
    }

    // 2. Check pending_products row
    const { data: pending, error: fetchError } = await supabaseAdmin()
      .from('pending_products')
      .select('id, status, printify_id, title')
      .eq('id', payload.pendingId)
      .single()

    if (fetchError || !pending) {
      return NextResponse.redirect(`${siteUrl}/auto-product/result?status=invalid`)
    }

    if (pending.status !== 'pending') {
      return NextResponse.redirect(`${siteUrl}/auto-product/result?status=already-used`)
    }

    // 3. Publish on Printify
    await publishProduct(shopId, payload.printifyId)

    // 4. Fetch full product from Printify and sync to Supabase
    const product = await getProduct(shopId, payload.printifyId) as {
      id: string
      title: string
      description: string
      tags: string[]
      options: unknown[]
      variants: { price: number; is_enabled: boolean }[]
      images: unknown[]
    }

    const enabledVariants = product.variants.filter(v => v.is_enabled)
    const priceFrom = enabledVariants.length
      ? Math.min(...enabledVariants.map(v => v.price))
      : product.variants[0]?.price || 0

    await supabaseAdmin()
      .from('products')
      .upsert({
        printify_id: product.id,
        title: product.title,
        description: product.description || '',
        tags: product.tags || [],
        options: product.options || [],
        variants: product.variants || [],
        images: product.images || [],
        price_from: priceFrom,
        is_enabled: true,
      }, { onConflict: 'printify_id' })

    // 5. Mark as approved
    await supabaseAdmin()
      .from('pending_products')
      .update({ status: 'approved' })
      .eq('id', payload.pendingId)

    return NextResponse.redirect(`${siteUrl}/auto-product/result?status=approved`)
  } catch (err) {
    console.error('[auto-product] Approve error:', err)
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('expired') || msg.includes('Invalid token')) {
      return NextResponse.redirect(`${siteUrl}/auto-product/result?status=invalid`)
    }
    return NextResponse.redirect(`${siteUrl}/auto-product/result?status=error`)
  }
}
