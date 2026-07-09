/**
 * POST /api/vote — vote for a pending artist submission.
 * Body: { pendingId: string }
 * One vote per fingerprint per design (unique constraint).
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { voterFingerprint } from '@/lib/vote-fingerprint'

export const runtime = 'nodejs'

const UNIQUE_VIOLATION = '23505'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { pendingId?: string }
    if (!body.pendingId) {
      return NextResponse.json({ error: 'pendingId required' }, { status: 400 })
    }

    const db = supabaseAdmin()

    const { data: pending } = await db
      .from('pending_products')
      .select('id, status, topic')
      .eq('id', body.pendingId)
      .maybeSingle()
    if (!pending || pending.status !== 'pending' || pending.topic !== 'artist-submission') {
      return NextResponse.json({ error: 'Design not open for voting' }, { status: 404 })
    }

    const { error } = await db.from('design_votes').insert({
      pending_product_id: body.pendingId,
      voter_fingerprint: voterFingerprint(request),
    })

    if (error && error.code !== UNIQUE_VIOLATION) {
      throw new Error(error.message)
    }

    const { count } = await db
      .from('design_votes')
      .select('id', { count: 'exact', head: true })
      .eq('pending_product_id', body.pendingId)

    return NextResponse.json({
      ok: true,
      alreadyVoted: error?.code === UNIQUE_VIOLATION,
      votes: count ?? 0,
    })
  } catch (err) {
    console.error('[vote] Error:', err)
    return NextResponse.json({ error: 'vote_failed' }, { status: 500 })
  }
}
