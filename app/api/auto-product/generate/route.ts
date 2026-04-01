/**
 * POST /api/auto-product/generate
 *
 * Orchestrates the full pipeline:
 * 1. Fetch trending topics from Google Trends RSS
 * 2. Generate a t-shirt design image via Gemini
 * 3. Upload image to Printify
 * 4. Create a draft product (not visible on store)
 * 5. Store in pending_products table
 * 6. Email Jamie with approve/reject links
 *
 * Auth: Bearer token matching SYNC_SECRET env var
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { uploadImageToPrintify, createDraftProduct } from '@/lib/printify'
import { signToken } from '@/lib/approval-token'

export const runtime = 'nodejs'
export const maxDuration = 60

// Blueprint 145 = Unisex Softstyle T-Shirt (same as existing products)
// Print provider 6 = T Shirt and Sons (same as existing products)
const BLUEPRINT_ID = 145
const PRINT_PROVIDER_ID = 6

// Enabled variants: Black/White/Navy/Sport Grey × S/M/L/XL/2XL
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

async function getTrendingTopic(): Promise<string> {
  try {
    // Google Trends daily trending searches RSS (Canada)
    const res = await fetch(
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=CA',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const xml = await res.text()
    // Extract <title> tags (skip first one which is the feed title)
    const titles = [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)]
      .map(m => m[1])
      .filter(t => t.length > 3 && t.length < 60)

    if (titles.length > 0) {
      // Pick a random one from top 5 for variety
      return titles[Math.floor(Math.random() * Math.min(5, titles.length))]
    }
  } catch (e) {
    console.error('Trends fetch failed, using fallback:', e)
  }

  // Fallback topics with Heartwear brand essence
  const fallbacks = [
    'mental health awareness', 'self love journey', 'nature therapy',
    'slow living', 'mindful moments', 'forest bathing', 'ocean healing',
    'gratitude practice', 'inner peace', 'wild at heart',
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

async function generateDesignWithGemini(topic: string): Promise<string> {
  const prompt = `Create a minimalist t-shirt graphic design inspired by the theme: "${topic}".
Style: clean vector art, nature-inspired heart motif, botanical elements, emotional and poetic.
Format: centered design on white background, print-ready, suitable for DTG printing on fabric.
No text, no words, no letters. Pure visual art only. High contrast, bold lines.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`Gemini image generation failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  const imagePart = data?.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData?.mimeType?.startsWith('image/')
  )

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini did not return an image')
  }

  return imagePart.inlineData.data // base64 string
}

async function sendApprovalEmail(params: {
  topic: string
  title: string
  mockupUrl: string
  approveUrl: string
  rejectUrl: string
}): Promise<void> {
  const { topic, title, mockupUrl, approveUrl, rejectUrl } = params

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0a09;font-family:Georgia,serif;color:#f5f5f4;">
  <div style="max-width:560px;margin:40px auto;padding:32px;background:#1c1917;border-radius:12px;">
    <p style="color:#84a87a;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px">New Design Ready for Review</p>
    <h1 style="color:#f5f5f4;font-size:26px;margin:0 0 24px;line-height:1.3">${title}</h1>

    <p style="color:#a8a29e;font-size:14px;margin:0 0 20px">Inspired by trending topic: <strong style="color:#d6d3d1">${topic}</strong></p>

    ${mockupUrl ? `<img src="${mockupUrl}" alt="${title}" style="width:100%;border-radius:8px;margin-bottom:24px;display:block">` : ''}

    <p style="color:#a8a29e;font-size:14px;margin:0 0 28px">Does this design feel right for The Heartwear Store? One click to decide.</p>

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

    <p style="color:#57534e;font-size:12px;margin:28px 0 0;text-align:center">These links expire in 7 days. Each link can only be used once.</p>
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
  // Auth check
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shopId = process.env.PRINTIFY_SHOP_ID!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  try {
    // 1. Get trending topic
    console.log('[auto-product] Fetching trending topic...')
    const topic = await getTrendingTopic()
    console.log(`[auto-product] Topic: ${topic}`)

    // 2. Generate design image via Gemini
    console.log('[auto-product] Generating design with Gemini...')
    const base64Image = await generateDesignWithGemini(topic)

    // 3. Upload image to Printify
    console.log('[auto-product] Uploading image to Printify...')
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
    const uploadedImage = await uploadImageToPrintify(base64Image, `heartwear-${slug}.png`)

    // 4. Build product title and description
    const titleWords = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    const title = `Heart of ${titleWords} Tee`
    const description = `For those who carry ${topic} in their heart. This soft unisex tee features a nature-inspired design, perfect for dreamers and those who wear their heart on their sleeve. Made from 100% combed ring-spun cotton.`

    // 5. Create draft product in Printify (not published to store)
    console.log('[auto-product] Creating draft product in Printify...')
    const product = await createDraftProduct(shopId, {
      title,
      description,
      tags: ['nature', 'heart', 'unisex', 't-shirt', slug],
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

    // 6. Store in pending_products table
    console.log('[auto-product] Storing in pending_products...')
    const { data: pending, error: dbError } = await supabaseAdmin()
      .from('pending_products')
      .insert({
        printify_id: printifyId,
        title,
        topic,
        mockup_url: mockupUrl,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()

    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`)

    // 7. Sign approve/reject tokens
    const pendingId = pending.id
    const [approveToken, rejectToken] = await Promise.all([
      signToken({ pendingId, printifyId, action: 'approve' }),
      signToken({ pendingId, printifyId, action: 'reject' }),
    ])

    const approveUrl = `${siteUrl}/api/auto-product/approve?token=${approveToken}`
    const rejectUrl = `${siteUrl}/api/auto-product/reject?token=${rejectToken}`

    // 8. Send email to Jamie
    console.log('[auto-product] Sending approval email...')
    await sendApprovalEmail({ topic, title, mockupUrl, approveUrl, rejectUrl })

    console.log(`[auto-product] Done. Product ${printifyId} pending approval.`)
    return NextResponse.json({ ok: true, topic, title, printifyId, pendingId })
  } catch (err) {
    console.error('[auto-product] Generate error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
