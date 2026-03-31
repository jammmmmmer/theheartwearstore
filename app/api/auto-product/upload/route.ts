/**
 * POST /api/auto-product/upload
 * Step 2: Create ONE Printify draft product for a given placement.
 * Called 3× in parallel from the client (one per placement key).
 * Each call is lean enough to fit within the 10-second free-plan limit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createDraftProduct } from '@/lib/printify'
import { signToken } from '@/lib/approval-token'

export const runtime = 'nodejs'

const BLUEPRINT_ID = 145
const PRINT_PROVIDER_ID = 6

const ENABLED_VARIANT_IDS = [
  38158, 38162, 38163, 38164,
  38172, 38176, 38177, 38178,
  38186, 38190, 38191, 38192,
  38200, 38204, 38205, 38206,
  38214, 38218, 38219, 38220,
]
const ALL_VARIANT_IDS = Array.from({ length: 75 }, (_, i) => 38153 + i).filter(
  id => id <= 38231 && id !== 38224 && id !== 38226 && id !== 38228 && id !== 38230
)

const PLACEMENTS = [
  {
    key: 'small_front',
    label: 'Small — Right Chest Front',
    print_areas: [{
      variant_ids: ALL_VARIANT_IDS,
      placeholders: [{
        position: 'front',
        images: [{ x: 0.72, y: 0.22, scale: 0.22, angle: 0 }],
      }],
    }],
  },
  {
    key: 'full_front',
    label: 'Full Image — Front',
    print_areas: [{
      variant_ids: ALL_VARIANT_IDS,
      placeholders: [{
        position: 'front',
        images: [{ x: 0.5, y: 0.5, scale: 1, angle: 0 }],
      }],
    }],
  },
  {
    key: 'full_back_small_front',
    label: 'Full Image — Back + Small Chest Front',
    print_areas: [
      {
        variant_ids: ALL_VARIANT_IDS,
        placeholders: [{
          position: 'back',
          images: [{ x: 0.5, y: 0.5, scale: 1, angle: 0 }],
        }],
      },
      {
        variant_ids: ALL_VARIANT_IDS,
        placeholders: [{
          position: 'front',
          images: [{ x: 0.72, y: 0.22, scale: 0.22, angle: 0 }],
        }],
      },
    ],
  },
]

export async function POST(request: NextRequest) {
  const shopId = process.env.PRINTIFY_SHOP_ID!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  try {
    const body = await request.json() as {
      secret: string
      imageId: string
      title: string
      placementKey: string
    }

    if (!body.secret || body.secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const placement = PLACEMENTS.find(p => p.key === body.placementKey)
    if (!placement) {
      return NextResponse.json({ error: 'Invalid placement key' }, { status: 400 })
    }

    const { imageId, title } = body
    const description = `A unique design from The Heartwear Store. Made from 100% combed ring-spun cotton, printed on demand.`

    // Inject imageId into print areas
    const print_areas = placement.print_areas.map(area => ({
      ...area,
      placeholders: area.placeholders.map(ph => ({
        ...ph,
        images: ph.images.map(img => ({ ...img, id: imageId })),
      })),
    }))

    const product = await createDraftProduct(shopId, {
      title: `${title} (${placement.label})`,
      description,
      tags: ['heartwear', 'unisex', 't-shirt', 'custom'],
      blueprint_id: BLUEPRINT_ID,
      print_provider_id: PRINT_PROVIDER_ID,
      variants: ALL_VARIANT_IDS.map(id => ({
        id,
        price: 3999,
        is_enabled: ENABLED_VARIANT_IDS.includes(id),
      })),
      print_areas,
    })

    const printifyId = product.id
    const mockupUrl = product.images?.find((img: { is_default: boolean }) => img.is_default)?.src
      || product.images?.[0]?.src
      || ''

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

    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

    const pendingId = pending.id
    const [approveToken, rejectToken] = await Promise.all([
      signToken({ pendingId, printifyId, action: 'approve' }),
      signToken({ pendingId, printifyId, action: 'reject' }),
    ])

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
