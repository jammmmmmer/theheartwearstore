/**
 * GET /api/vote/list — public gallery data: pending artist submissions
 * with vote counts, artist names, and whether the caller already voted.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { voterFingerprint } from '@/lib/vote-fingerprint'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const db = supabaseAdmin()
    const fingerprint = voterFingerprint(request)

    const { data: pending, error } = await db
      .from('pending_products')
      .select('id, title, mockup_url, created_at, artist_id')
      .eq('status', 'pending')
      .eq('topic', 'artist-submission')
      .not('artist_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(60)
    if (error) throw new Error(error.message)
    if (!pending?.length) return NextResponse.json({ designs: [] })

    const ids = pending.map((p) => p.id)
    const artistIds = Array.from(new Set(pending.map((p) => p.artist_id as string)))

    const [{ data: votes }, { data: artists }] = await Promise.all([
      db.from('design_votes').select('pending_product_id, voter_fingerprint').in('pending_product_id', ids),
      db.from('artists').select('id, display_name, slug').in('id', artistIds),
    ])

    const counts = new Map<string, number>()
    const mine = new Set<string>()
    for (const v of votes ?? []) {
      counts.set(v.pending_product_id, (counts.get(v.pending_product_id) ?? 0) + 1)
      if (v.voter_fingerprint === fingerprint) mine.add(v.pending_product_id)
    }
    const artistById = new Map((artists ?? []).map((a) => [a.id, a]))

    return NextResponse.json({
      designs: pending.map((p) => ({
        id: p.id,
        title: p.title,
        mockup_url: p.mockup_url,
        created_at: p.created_at,
        votes: counts.get(p.id) ?? 0,
        voted: mine.has(p.id),
        artist: artistById.get(p.artist_id as string) ?? null,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[vote-list] Error:', err)
    return NextResponse.json({ designs: [], error: 'unavailable' }, { status: 500 })
  }
}
