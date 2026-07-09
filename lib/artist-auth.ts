/**
 * Artist authentication for API routes.
 *
 * The browser holds a Supabase Auth session (supabase-js) and sends its
 * access token as `Authorization: Bearer <jwt>`. The server verifies the
 * token against Supabase Auth and loads the caller's artist profile.
 */

import type { NextRequest } from 'next/server'
import { supabaseAdmin } from './supabase'
import type { Artist } from '@/types'

export interface ArtistAuthResult {
  userId: string
  email: string
  /** null until the user has created their artist profile */
  artist: Artist | null
}

export async function getArtistFromRequest(
  request: NextRequest
): Promise<ArtistAuthResult | null> {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length).trim()
  if (!token) return null

  try {
    const admin = supabaseAdmin()
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data?.user) return null

    const { data: artist } = await admin
      .from('artists')
      .select('id, slug, display_name, bio, commission_pct')
      .eq('id', data.user.id)
      .maybeSingle()

    return {
      userId: data.user.id,
      email: data.user.email ?? '',
      artist: (artist as Artist | null) ?? null,
    }
  } catch (err) {
    console.warn('[artist-auth] Token verification failed:', err)
    return null
  }
}

/** URL-safe slug from a display name, e.g. "Marie-Ève D." → "marie-eve-d" */
export function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
