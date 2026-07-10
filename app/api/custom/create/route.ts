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
import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadImageToPrintify } from '@/lib/printify'
import { createStyleProducts } from '@/lib/split-product'
import { getStyleCatalog } from '@/lib/catalog'

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

const CUSTOM_DESCRIPTION =
  'Your custom design, made to order. Custom uploads are final sale — no returns or exchanges except for manufacturing defects.'

export async function POST(request: NextRequest) {
  const shopId = process.env.PRINTIFY_SHOP_ID!
  const contentType = request.headers.get('content-type') || ''

  try {
    // ── STYLE MODE (JSON): create ONE garment style for a design group ─────
    // Called once per garment by the client, so no single request creates them all.
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as {
        imageId?: string; groupId?: string; styleKey?: string; placementKey?: string; title?: string
      }
      if (!body.imageId || !body.groupId || !body.styleKey) {
        return NextResponse.json({ error: 'imageId, groupId and styleKey are required' }, { status: 400 })
      }
      const placement = PLACEMENTS[body.placementKey ?? 'full_front']
      if (!placement) return NextResponse.json({ error: 'Invalid placement' }, { status: 400 })
      const title = (body.title?.trim() || 'Custom Design').slice(0, 80)

      const result = await createStyleProducts({
        shopId,
        styleKey: body.styleKey,
        title: `${title} (Custom)`,
        description: CUSTOM_DESCRIPTION,
        tags: ['custom', 'made-to-order', 't-shirt'],
        imageId: body.imageId,
        areas: placement.areas,
      })
      if (!result) {
        return NextResponse.json({ error: `Garment "${body.styleKey}" is not available` }, { status: 400 })
      }

      const enabled = result.full.variants.filter((v) => v.is_enabled)
      const priceFrom = enabled.length
        ? Math.min(...enabled.map((v) => v.price))
        : result.full.variants[0]?.price || 0

      const { data: row, error } = await supabaseAdmin()
        .from('products')
        .upsert({
          printify_id: result.printifyId,
          printify_id_us: result.printifyIdUs,
          title: `${title} (Custom)`,
          description: result.full.description || '',
          tags: result.full.tags || [],
          options: result.full.options || [],
          variants: result.full.variants || [],
          images: result.full.images || [],
          price_from: priceFrom,
          is_enabled: true,
          is_custom: true,
          placement: placement.label,
          group_id: body.groupId,
          style_key: result.styleKey,
        }, { onConflict: 'printify_id' })
        .select('id')
        .single()
      if (error) throw new Error(`DB insert failed: ${error.message}`)

      return NextResponse.json({
        ok: true,
        productId: row.id,
        styleKey: result.styleKey,
        styleLabel: result.styleLabel,
        isDefault: result.isDefault,
      })
    }

    // ── INIT MODE (multipart): rate-limit + upload image, return garment list ──
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
    const rawTitle = (formData.get('title') as string | null)?.trim()
    const title = (rawTitle || 'Custom Design').slice(0, 80)

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const uploaded = await uploadImageToPrintify(base64, `custom-${Date.now()}.png`)

    // Return the garment list; the client fires one style-mode request per garment.
    const styles = await getStyleCatalog()
    return NextResponse.json({
      ok: true,
      mode: 'init',
      imageId: uploaded.id,
      groupId: randomUUID(),
      title,
      styleKeys: styles.length ? styles.map((s) => s.styleKey) : ['classic'],
    })
  } catch (err) {
    console.error('[custom] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
