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
import { uploadImageToPrintify } from '@/lib/printify'
import { createSplitProducts } from '@/lib/split-product'

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

    // 2. Create BOTH provider products (Print Geek CA + Monster Digital US) — same design.
    const { printifyIdUs, caFull } = await createSplitProducts({
      shopId,
      title: `${title} (Custom)`,
      description:
        'Your custom design, made to order on a 100% combed ring-spun cotton tee. ' +
        'Custom uploads are final sale — no returns or exchanges except for manufacturing defects.',
      tags: ['custom', 'made-to-order', 'unisex', 't-shirt'],
      imageId: uploaded.id,
      areas: placement.areas,
    })

    const enabledVariants = caFull.variants.filter((v) => v.is_enabled)
    const priceFrom = enabledVariants.length
      ? Math.min(...enabledVariants.map((v) => v.price))
      : caFull.variants[0]?.price || 0

    // 3. Write it live as custom, storing both provider products.
    // Upsert (not insert): the Printify webhook may have already synced the CA
    // product row from the publish event — update it with the custom flags + US link.
    const { data: row, error: insertError } = await supabaseAdmin()
      .from('products')
      .upsert({
        printify_id: caFull.id,
        printify_id_us: printifyIdUs,
        title: `${title} (Custom)`,
        description: caFull.description || '',
        tags: caFull.tags || [],
        options: caFull.options || [],
        variants: caFull.variants || [],
        images: caFull.images || [],
        price_from: priceFrom,
        is_enabled: true,
        is_custom: true,
        placement: placement.label,
      }, { onConflict: 'printify_id' })
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
