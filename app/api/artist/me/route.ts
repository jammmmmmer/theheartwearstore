/**
 * GET /api/artist/me — the caller's profile, submissions, and earnings.
 * Auth: Supabase access token (Authorization: Bearer).
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getArtistFromRequest } from '@/lib/artist-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await getArtistFromRequest(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = supabaseAdmin()

  const [{ data: submissions }, { data: earnings }] = await Promise.all([
    db
      .from('pending_products')
      .select('id, title, mockup_url, status, created_at')
      .eq('artist_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('artist_earnings')
      .select('commission_amount, currency, status, created_at')
      .eq('artist_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  // Totals per currency and status
  const totals: Record<string, { accrued: number; paid: number }> = {}
  for (const e of earnings ?? []) {
    const cur = e.currency ?? 'cad'
    totals[cur] ??= { accrued: 0, paid: 0 }
    if (e.status === 'paid') totals[cur].paid += e.commission_amount
    else totals[cur].accrued += e.commission_amount
  }

  return NextResponse.json({
    email: auth.email,
    artist: auth.artist,
    submissions: submissions ?? [],
    earnings: { totals, recent: (earnings ?? []).slice(0, 20) },
  })
}
