/**
 * POST /api/artist/upload-image — artist design image → Printify image ID.
 * Auth: Supabase access token (Authorization: Bearer).
 * The artist must have a profile before uploading.
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToPrintify } from '@/lib/printify'
import { getArtistFromRequest } from '@/lib/artist-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const auth = await getArtistFromRequest(request)
  if (!auth?.artist) {
    return NextResponse.json({ error: 'Unauthorized — create your artist profile first' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Image must be PNG, JPG, or WebP' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64Contents = Buffer.from(arrayBuffer).toString('base64')
    const fileName = `artist-${auth.artist.slug}-${Date.now()}.png`

    const uploadedImage = await uploadImageToPrintify(base64Contents, fileName)

    return NextResponse.json({ ok: true, imageId: uploadedImage.id })
  } catch (err) {
    console.error('[artist-upload-image] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
