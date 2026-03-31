/**
 * POST /api/auto-product/upload
 *
 * Same pipeline as /generate but uses a provided image instead of AI:
 * 1. Validate secret
 * 2. Read uploaded image → base64
 * 3. Upload image to Printify
 * 4. Create draft product
 * 5. Store in pending_products
 * 6. Email Jamie with approve/reject links
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadImageToPrintify, createDraftProduct } from '@/lib/printify'
import { signToken } from '@/lib/approval-token'

export const runtime = 'nodejs'
export const maxDuration = 60

const BLUEPRINT_ID = 145
const PRINT_PROVIDER_ID = 6

const ENABLED_VARIANT_IDS = [
  38158, 38162, 38163, 38164,
  38172, 38176, 38177, 38178,
  38186, 38190, 38191, 38192,
  38200, 38204, 38205, 38206,
  38214, 38218, 38219, 38220,
]
const ALL_VARIANT_IDS = Array.from({ length: 75 }, (_, i) => 38153 + i).filter(
  id => id <= 38231 && id !== 38224 && id !== 38226 && id !== 38228 && id !== 38230
)

async function sendApprovalEmail(params: {
  title: string
  mockupUrl: string
  approveUrl: string
  rejectUrl: string
}): Promise<void> {
  const { title, mockupUrl, approveUrl, rejectUrl } = params

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:Georgia,serif;color:#f5f5f4;">
  <div style="max-width:560px;margin:40px auto;padding:32px;background:#1c1917;border-radius:12px;">
    <p style="color:#84a87a;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">New Design Ready for Review</p>
    <h1 style="color:#f5f5f4;font-size:26px;margin:0 0 24px;line-height:1.3">${title}</h1>
    <p style="color:#a8a29e;font-size:14px;margin:0 0 20px">You uploaded this design. Here's how it looks on the shirt:</p>
    ${mockupUrl ? `<img src="${mockupUrl}" alt="${title}" style="width:100%;border-radius:8px;margin-bottom:24px;display:block">` : ''}
    <p style="color:#a8a29e;font-size:14px;margin:0 0 28px">Publish it to the store or delete the draft?</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-right:8px">
          <a href="${approveUrl}" style="display:block;text-align:center;background:#4d7c3e;color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;font-weight:600">
            ✓ Approve &amp; Publish
          </a>
        </td>
        <td style="padding-left:8px">
          <a href="${rejectUrl}" style="display:block;text-align:center;background:#292524;color:#a8a29e;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:15px;border:1px solid #44403c">
            ✕ Reject &amp; Delete
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#57534e;font-size:12px;margin:28px 0 0;text-align:center">These links expire in 7 days and can only be used once.</p>
  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `The Heartwear Store <noreply@${process.env.EMAIL_DOMAIN || 'theheartwearstore.ca'}>`,
      to: process.env.OWNER_EMAIL!,
      subject: `New Design Ready: ${title}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Email send failed: ${res.status} - ${err}`)
  }
}

export async function POST(request: NextRequest) {
  const shopId = process.env.PRINTIFY_SHOP_ID!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  try {
    const formData = await request.formData()

    // Auth check
    const secret = formData.get('secret') as string
    if (!secret || secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read image
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Image must be PNG, JPG, or WebP' }, { status: 400 })
    }

    const rawTitle = (formData.get('title') as string | null)?.trim()
    const title = rawTitle || `Heartwear Design Tee`
    const description = `A unique design from The Heartwear Store. Made from 100% combed ring-spun cotton, printed on demand.`

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64Contents = Buffer.from(arrayBuffer).toString('base64')
    const fileName = `heartwear-upload-${Date.now()}.png`

    console.log('[upload-product] Uploading image to Printify...')
    const uploadedImage = await uploadImageToPrintify(base64Contents, fileName)

    console.log('[upload-product] Creating draft product...')
    const product = await createDraftProduct(shopId, {
      title,
      description,
      tags: ['heartwear', 'unisex', 't-shirt', 'custom'],
      blueprint_id: BLUEPRINT_ID,
      print_provider_id: PRINT_PROVIDER_ID,
      variants: ALL_VARIANT_IDS.map(id => ({
        id,
        price: 3999,
        is_enabled: ENABLED_VARIANT_IDS.includes(id),
      })),
      print_areas: [{
        variant_ids: ALL_VARIANT_IDS,
        placeholders: [{
          position: 'front',
          images: [{ id: uploadedImage.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
        }],
      }],
    })

    const printifyId = product.id
    const mockupUrl = product.images?.find(img => img.is_default)?.src || product.images?.[0]?.src || ''

    console.log('[upload-product] Storing in pending_products...')
    const { data: pending, error: dbError } = await supabaseAdmin()
      .from('pending_products')
      .insert({
        printify_id: printifyId,
        title,
        topic: 'manual-upload',
        mockup_url: mockupUrl,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()

    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

    const pendingId = pending.id
    const [approveToken, rejectToken] = await Promise.all([
      signToken({ pendingId, printifyId, action: 'approve' }),
      signToken({ pendingId, printifyId, action: 'reject' }),
    ])

    const approveUrl = `${siteUrl}/api/auto-product/approve?token=${approveToken}`
    const rejectUrl = `${siteUrl}/api/auto-product/reject?token=${rejectToken}`

    console.log('[upload-product] Sending approval email...')
    await sendApprovalEmail({ title, mockupUrl, approveUrl, rejectUrl })

    console.log(`[upload-product] Done. Product ${printifyId} pending approval.`)
    return NextResponse.json({ ok: true, title, printifyId, pendingId })
  } catch (err) {
    console.error('[upload-product] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
