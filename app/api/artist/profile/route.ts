/**
 * POST /api/artist/profile — create or update the caller's artist profile.
 * Auth: Supabase access token (Authorization: Bearer).
 * Body: { displayName: string, bio?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getArtistFromRequest, slugifyName } from '@/lib/artist-auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const auth = await getArtistFromRequest(request)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { displayName?: string; bio?: string }
    const displayName = (body.displayName ?? '').trim().slice(0, 60)
    const bio = (body.bio ?? '').trim().slice(0, 1000)

    if (displayName.length < 2) {
      return NextResponse.json({ error: 'Display name must be at least 2 characters' }, { status: 400 })
    }

    const db = supabaseAdmin()

    if (auth.artist) {
      // Update (slug is stable once created — public URLs shouldn't break)
      const { data, error } = await db
        .from('artists')
        .update({ display_name: displayName, bio })
        .eq('id', auth.userId)
        .select('id, slug, display_name, bio, commission_pct')
        .single()
      if (error) throw new Error(error.message)
      return NextResponse.json({ ok: true, artist: data })
    }

    // Create with a unique slug
    const base = slugifyName(displayName) || 'artist'
    let slug = base
    for (let i = 2; i <= 50; i++) {
      const { data: taken } = await db
        .from('artists').select('id').eq('slug', slug).maybeSingle()
      if (!taken) break
      slug = `${base}-${i}`
    }

    const { data, error } = await db
      .from('artists')
      .insert({ id: auth.userId, slug, display_name: displayName, bio })
      .select('id, slug, display_name, bio, commission_pct')
      .single()
    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, artist: data })
  } catch (err) {
    console.error('[artist-profile] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
