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
import { sendApprovalEmail } from '@/lib/send-approval-email'
import { getDefaultCatalogItem } from '@/lib/catalog'

export const runtime = 'nodejs'
export const maxDuration = 60

// Blueprint/provider/variants/price come from the catalog_items table
// (see lib/catalog.ts) — no longer hardcoded here.

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

// (Approval email HTML lives in lib/send-approval-email.ts — shared with the
// manual upload flow. The previous local duplicate shadowed the import and
// broke the TypeScript build.)

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
    const catalogItem = await getDefaultCatalogItem()
    const enabledSet = new Set(catalogItem.enabled_variant_ids)
    const product = await createDraftProduct(shopId, {
      title,
      description,
      tags: ['nature', 'heart', 'unisex', 't-shirt', slug],
      blueprint_id: catalogItem.blueprint_id,
      print_provider_id: catalogItem.print_provider_id,
      variants: catalogItem.all_variant_ids.map(id => ({
        id,
        price: catalogItem.price,
        is_enabled: enabledSet.has(id),
      })),
      print_areas: [{
        variant_ids: catalogItem.all_variant_ids,
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

    // 8. Send email to Jamie (non-fatal — the product is already pending approval)
    console.log('[auto-product] Sending approval email...')
    try {
      await sendApprovalEmail({ topic, title, mockupUrl, approveUrl, rejectUrl })
    } catch (emailErr) {
      console.warn('[auto-product] Approval email failed (non-fatal):', emailErr)
    }

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
