/**
 * POST /api/custom/create
 *
 * PUBLIC, anonymous custom-design upload → orderable product.
 * - No auth (open to the public), but IP rate-limited.
 * - Uploads the image to Printify, creates ONE draft product for the chosen
 *   placement, then writes it straight into `products` as is_custom = true
 *   (is_enabled = true so it's orderable, but excluded from the shop listing).
 * - NO approval step: the uploader can order it immediately. Custom tees are
 *   final sale (surfaced to the buyer on the create page and product page).
 *
 * Accepts multipart form-data: image (File), title (string), placementKey (string).
 * Returns { ok, productId } — the client redirects to /shop/<productId>.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  uploadImageToPrintify,
  createDraftProduct,
  publishProduct,
  getProduct,
} from '@/lib/printify'
import { getDefaultCatalogItem } from '@/lib/catalog'

export const runtime = 'nodejs'
export const maxDuration = 60

// Abuse controls
const RATE_LIMIT = 5 // uploads
const RATE_WINDOW_MS = 60 * 60 * 1000 // per hour, per IP
const MAX_BYTES = 6 * 1024 * 1024 // Netlify function body ceiling

// Placement geometry (mirrors the admin upload flow).
const PLACEMENTS: Record<
  string,
  { label: string; areas: { position: string; images: { x: number; y: number; scale: number; angle: number }[] }[] }
> = {
  small_front: {
    label: 'Small — Right Chest Front',
    areas: [{ position: 'front', images: [{ x: 0.72, y: 0.22, scale: 0.22, angle: 0 }] }],
  },
  full_front: {
    label: 'Full Image — Front',
    areas: [{ position: 'front', images: [{ x: 0.5, y: 0.5, scale: 1, angle: 0 }] }],
  },
  full_back_small_front: {
    label: 'Full Image — Back + Small Chest Front',
    areas: [
      { position: 'back', images: [{ x: 0.5, y: 0.5, scale: 1, angle: 0 }] },
      { position: 'front', images: [{ x: 0.72, y: 0.22, scale: 0.22, angle: 0 }] },
    ],
  },
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

/** Returns true if this IP is over the hourly limit. Records the attempt otherwise. */
async function rateLimited(ip: string): Promise<boolean> {
  const db = supabaseAdmin()
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString()
  const { count } = await db
    .from('custom_upload_events')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since)

  if ((count ?? 0) >= RATE_LIMIT) return true
  await db.from('custom_upload_events').insert({ ip })
  return false
}

export async function POST(request: NextRequest) {
  const shopId = process.env.PRINTIFY_SHOP_ID!

  try {
    const ip = clientIp(request)
    if (await rateLimited(ip)) {
      return NextResponse.json(
        { error: 'You have reached the hourly upload limit. Please try again later.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Image must be PNG, JPG, or WebP' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Image is too large (max 6MB).' }, { status: 400 })
    }

    const placementKey = (formData.get('placementKey') as string | null) ?? 'full_front'
    const placement = PLACEMENTS[placementKey]
    if (!placement) {
      return NextResponse.json({ error: 'Invalid placement' }, { status: 400 })
    }

    const rawTitle = (formData.get('title') as string | null)?.trim()
    const title = (rawTitle || 'Custom Design').slice(0, 80)

    // 1. Upload image to Printify
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const uploaded = await uploadImageToPrintify(base64, `custom-${Date.now()}.png`)

    // 2. Create the draft product for the chosen placement
    const catalogItem = await getDefaultCatalogItem()
    const enabledSet = new Set(catalogItem.enabled_variant_ids)
    const print_areas = placement.areas.map((area) => ({
      variant_ids: catalogItem.all_variant_ids,
      placeholders: [
        { position: area.position, images: area.images.map((img) => ({ ...img, id: uploaded.id })) },
      ],
    }))

    const draft = await createDraftProduct(shopId, {
      title: `${title} (Custom)`,
      description:
        'Your custom design, made to order on a 100% combed ring-spun cotton tee. ' +
        'Custom uploads are final sale — no returns or exchanges except for manufacturing defects.',
      tags: ['custom', 'made-to-order', 'unisex', 't-shirt'],
      blueprint_id: catalogItem.blueprint_id,
      print_provider_id: catalogItem.print_provider_id,
      variants: catalogItem.all_variant_ids.map((id) => ({
        id,
        price: catalogItem.price,
        is_enabled: enabledSet.has(id),
      })),
      print_areas,
    })

    const printifyId = draft.id

    // Publish to the Printify portal (custom_integration — won't archive). Non-fatal.
    try {
      await publishProduct(shopId, printifyId)
    } catch (e) {
      console.warn('[custom] publishProduct failed (non-fatal):', e)
    }

    // 3. Fetch the full product (variants/options/images) and write it live as custom.
    const product = (await getProduct(shopId, printifyId)) as {
      id: string
      title: string
      description: string
      tags: string[]
      options: unknown[]
      variants: { price: number; is_enabled: boolean }[]
      images: unknown[]
    }

    const enabledVariants = product.variants.filter((v) => v.is_enabled)
    const priceFrom = enabledVariants.length
      ? Math.min(...enabledVariants.map((v) => v.price))
      : product.variants[0]?.price || 0

    const { data: row, error: insertError } = await supabaseAdmin()
      .from('products')
      .insert({
        printify_id: product.id,
        title: `${title} (Custom)`,
        description: product.description || '',
        tags: product.tags || [],
        options: product.options || [],
        variants: product.variants || [],
        images: product.images || [],
        price_from: priceFrom,
        is_enabled: true,
        is_custom: true,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[custom] DB insert failed:', insertError)
      throw new Error(`DB insert failed: ${insertError.message}`)
    }

    return NextResponse.json({ ok: true, productId: row.id })
  } catch (err) {
    console.error('[custom] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
