/**
 * POST /api/artist/submit — submit a design for moderation.
 * Auth: Supabase access token (Authorization: Bearer).
 * Body: { imageId: string, title: string, agreeTerms: boolean }
 *
 * Creates ONE unpublished Printify draft (full-front placement) on the
 * default catalog garment and queues it in pending_products. Nothing goes
 * live until the owner approves (same signed-token flow as owner uploads).
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createDraftProduct } from '@/lib/printify'
import { signToken } from '@/lib/approval-token'
import { sendApprovalEmail } from '@/lib/send-approval-email'
import { getArtistFromRequest } from '@/lib/artist-auth'
import { getDefaultCatalogItem } from '@/lib/catalog'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_OPEN_SUBMISSIONS = 10 // per artist — basic abuse guard

export async function POST(request: NextRequest) {
  const auth = await getArtistFromRequest(request)
  if (!auth?.artist) {
    return NextResponse.json({ error: 'Unauthorized — create your artist profile first' }, { status: 401 })
  }

  const shopId = process.env.PRINTIFY_SHOP_ID!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  try {
    const body = (await request.json()) as {
      imageId?: string
      title?: string
      agreeTerms?: boolean
    }
    const title = (body.title ?? '').trim().slice(0, 80)

    if (!body.imageId || title.length < 3) {
      return NextResponse.json({ error: 'Image and a title (3+ chars) are required' }, { status: 400 })
    }
    if (body.agreeTerms !== true) {
      return NextResponse.json({ error: 'You must confirm the design is your own original work' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // Abuse guard: cap open (pending) submissions per artist
    const { count } = await db
      .from('pending_products')
      .select('id', { count: 'exact', head: true })
      .eq('artist_id', auth.userId)
      .eq('status', 'pending')
    if ((count ?? 0) >= MAX_OPEN_SUBMISSIONS) {
      return NextResponse.json(
        { error: `You have ${count} designs awaiting review — please wait before submitting more` },
        { status: 429 }
      )
    }

    const catalogItem = await getDefaultCatalogItem()
    const enabledSet = new Set(catalogItem.enabled_variant_ids)

    const product = await createDraftProduct(shopId, {
      title,
      description: `Original design by ${auth.artist.display_name}. Printed on demand by The Heartwear Store. Made from 100% combed ring-spun cotton.`,
      tags: ['heartwear', 'artist', 'community', 't-shirt', auth.artist.slug],
      blueprint_id: catalogItem.blueprint_id,
      print_provider_id: catalogItem.print_provider_id,
      variants: catalogItem.all_variant_ids.map((id) => ({
        id,
        price: catalogItem.price,
        is_enabled: enabledSet.has(id),
      })),
      print_areas: [{
        variant_ids: catalogItem.all_variant_ids,
        placeholders: [{
          position: 'front',
          images: [{ id: body.imageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
        }],
      }],
    })

    const printifyId = product.id
    const mockupUrl =
      product.images?.find((img: { is_default: boolean }) => img.is_default)?.src ??
      product.images?.[0]?.src ?? ''

    const { data: pending, error: dbError } = await db
      .from('pending_products')
      .insert({
        printify_id: printifyId,
        title,
        topic: 'artist-submission',
        mockup_url: mockupUrl,
        status: 'pending',
        artist_id: auth.userId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()
    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

    // Owner review links (email is non-fatal; the /vote gallery also lists it)
    const [approveToken, rejectToken] = await Promise.all([
      signToken({ pendingId: pending.id, printifyId, action: 'approve' }, 30),
      signToken({ pendingId: pending.id, printifyId, action: 'reject' }, 30),
    ])
    try {
      await sendApprovalEmail({
        topic: `artist submission — ${auth.artist.display_name}`,
        title,
        mockupUrl,
        approveUrl: `${siteUrl}/api/auto-product/approve?token=${approveToken}`,
        rejectUrl: `${siteUrl}/api/auto-product/reject?token=${rejectToken}`,
      })
    } catch (emailErr) {
      console.warn('[artist-submit] Approval email failed (non-fatal):', emailErr)
    }

    return NextResponse.json({
      ok: true,
      pendingId: pending.id,
      mockupUrl,
      status: 'pending',
    })
  } catch (err) {
    console.error('[artist-submit] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
