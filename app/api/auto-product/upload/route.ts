/**
 * POST /api/auto-product/upload
 * Step 2: Create ONE Printify draft product for a given placement.
 * Called 3× in parallel from the client (one per placement key).
 * Each call is lean enough to fit within the 10-second free-plan limit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createDraftProduct, publishProduct } from '@/lib/printify'
import { signToken } from '@/lib/approval-token'
import { sendApprovalEmail } from '@/lib/send-approval-email'
import { isUploadAuthorized } from '@/lib/session'
import { getDefaultCatalogItem } from '@/lib/catalog'

export const runtime = 'nodejs'
export const maxDuration = 60

// Placement geometry only — blueprint/provider/variants/price now come from
// the catalog_items table (see lib/catalog.ts), not hardcoded constants.
const PLACEMENTS = [
  {
    key: 'small_front',
    label: 'Small — Right Chest Front',
    areas: [
      { position: 'front', images: [{ x: 0.72, y: 0.22, scale: 0.22, angle: 0 }] },
    ],
  },
  {
    key: 'full_front',
    label: 'Full Image — Front',
    areas: [
      { position: 'front', images: [{ x: 0.5, y: 0.5, scale: 1, angle: 0 }] },
    ],
  },
  {
    key: 'full_back_small_front',
    label: 'Full Image — Back + Small Chest Front',
    areas: [
      { position: 'back', images: [{ x: 0.5, y: 0.5, scale: 1, angle: 0 }] },
      { position: 'front', images: [{ x: 0.72, y: 0.22, scale: 0.22, angle: 0 }] },
    ],
  },
]

export async function POST(request: NextRequest) {
  const shopId = process.env.PRINTIFY_SHOP_ID!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  try {
    // Auth: httpOnly session cookie (browser) or Bearer SYNC_SECRET (server)
    if (!(await isUploadAuthorized(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      imageId: string
      title: string
      placementKey: string
    }

    const placement = PLACEMENTS.find(p => p.key === body.placementKey)
    if (!placement) {
      return NextResponse.json({ error: 'Invalid placement key' }, { status: 400 })
    }

    const { imageId, title } = body
    const description = `A unique design from The Heartwear Store. Made from 100% combed ring-spun cotton, printed on demand.`

    // Garment config from the catalog (falls back to the original tee)
    const catalogItem = await getDefaultCatalogItem()
    const enabledSet = new Set(catalogItem.enabled_variant_ids)

    // Build print areas: ONE area covering all variants, with one placeholder per
    // position. Multiple areas over the same variant_ids collide in Printify and
    // all but one placement is dropped (front+back would lose the front print).
    const print_areas = [{
      variant_ids: catalogItem.all_variant_ids,
      placeholders: placement.areas.map(area => ({
        position: area.position,
        images: area.images.map(img => ({ ...img, id: imageId })),
      })),
    }]

    const product = await createDraftProduct(shopId, {
      title: `${title} (${placement.label})`,
      description,
      tags: ['heartwear', 'unisex', 't-shirt', 'custom'],
      blueprint_id: catalogItem.blueprint_id,
      print_provider_id: catalogItem.print_provider_id,
      variants: catalogItem.all_variant_ids.map(id => ({
        id,
        price: catalogItem.price,
        is_enabled: enabledSet.has(id),
      })),
      print_areas,
    })

    const printifyId = product.id
    const mockupUrl = product.images?.find((img: { is_default: boolean }) => img.is_default)?.src
      || product.images?.[0]?.src
      || ''

    // Publish to Printify portal (custom_integration — won't archive)
    try {
      await publishProduct(shopId, printifyId)
    } catch (e) {
      console.warn('[upload] publishProduct failed (non-fatal):', e)
    }

    const { data: pending, error: dbError } = await supabaseAdmin()
      .from('pending_products')
      .insert({
        printify_id: printifyId,
        title: `${title} (${placement.label})`,
        topic: `manual-upload-${placement.key}`,
        mockup_url: mockupUrl,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[upload] DB insert failed — full error:', JSON.stringify(dbError, null, 2))
      console.error('[upload] DB insert failed — code:', dbError.code, '| message:', dbError.message, '| details:', dbError.details, '| hint:', dbError.hint)
      throw new Error(`DB insert failed: ${dbError.code ? `[${dbError.code}] ` : ''}${dbError.message}`)
    }

    const pendingId = pending.id
    const [approveToken, rejectToken] = await Promise.all([
      signToken({ pendingId, printifyId, action: 'approve' }),
      signToken({ pendingId, printifyId, action: 'reject' }),
    ])

    // Send approval email (non-fatal — upload succeeds even if email fails)
    try {
      await sendApprovalEmail({
        topic: `manual upload — ${placement.label}`,
        title: `${title} (${placement.label})`,
        mockupUrl,
        approveUrl: `${siteUrl}/api/auto-product/approve?token=${approveToken}`,
        rejectUrl: `${siteUrl}/api/auto-product/reject?token=${rejectToken}`,
      })
    } catch (emailErr) {
      console.warn('[upload] Approval email failed (non-fatal):', emailErr)
    }

    return NextResponse.json({
      ok: true,
      key: placement.key,
      label: placement.label,
      mockupUrl,
      approveUrl: `${siteUrl}/api/auto-product/approve?token=${approveToken}`,
      rejectUrl: `${siteUrl}/api/auto-product/reject?token=${rejectToken}`,
    })
  } catch (err) {
    console.error('[upload] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
