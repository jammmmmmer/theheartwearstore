/**
 * POST /api/auto-product/upload-image
 * Step 1: Upload image file to Printify, return imageId + title.
 * Kept lean so it comfortably fits within the 10-second free-plan limit.
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadImageToPrintify } from '@/lib/printify'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const secret = formData.get('secret') as string
    if (!secret || secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Image must be PNG, JPG, or WebP' }, { status: 400 })
    }

    const rawTitle = (formData.get('title') as string | null)?.trim()
    const title = rawTitle || 'Heartwear Design Tee'

    const arrayBuffer = await file.arrayBuffer()
    const base64Contents = Buffer.from(arrayBuffer).toString('base64')
    const fileName = `heartwear-upload-${Date.now()}.png`

    const uploadedImage = await uploadImageToPrintify(base64Contents, fileName)

    return NextResponse.json({ ok: true, imageId: uploadedImage.id, title })
  } catch (err) {
    console.error('[upload-image] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
