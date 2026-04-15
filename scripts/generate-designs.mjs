/**
 * Local script to generate 10 AI t-shirt designs and push them to Printify + Supabase.
 * Run with: node scripts/generate-designs.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envPath = resolve(import.meta.dirname, '../.env.local')
const envLines = readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim()
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APPROVAL_SECRET = process.env.APPROVAL_SECRET
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

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

const TOPICS = [
  'forest bathing', 'ocean healing', 'mountain solitude', 'wildflower meadow',
  'stargazing night', 'river flow', 'ancient trees', 'desert bloom',
  'northern lights', 'misty morning',
]

async function generateDesign(topic) {
  console.log(`  Generating image for: ${topic}`)
  const prompt = `Create a minimalist t-shirt graphic design inspired by the theme: "${topic}".
Style: clean vector art, nature-inspired heart motif, botanical elements, emotional and poetic.
Format: centered design on white background, print-ready, suitable for DTG printing on fabric.
No text, no words, no letters. Pure visual art only. High contrast, bold lines.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
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
    const err = await res.text()
    throw new Error(`Gemini failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  const imagePart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'))
  if (!imagePart?.inlineData?.data) throw new Error('Gemini returned no image')
  return imagePart.inlineData.data // base64
}

async function uploadToPrintify(base64, filename) {
  const res = await fetch(`https://api.printify.com/v1/uploads/images.json`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_name: filename, contents: base64 }),
  })
  if (!res.ok) throw new Error(`Printify upload failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function createPrintifyProduct(title, description, imageId) {
  const body = {
    title,
    description,
    tags: ['nature', 'heart', 'unisex', 't-shirt'],
    blueprint_id: BLUEPRINT_ID,
    print_provider_id: PRINT_PROVIDER_ID,
    variants: ALL_VARIANT_IDS.map(id => ({ id, price: 3999, is_enabled: ENABLED_VARIANT_IDS.includes(id) })),
    print_areas: [{
      variant_ids: ALL_VARIANT_IDS,
      placeholders: [{ position: 'front', images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }],
    }],
  }
  const res = await fetch(`https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PRINTIFY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Printify product failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function publishPrintifyProduct(productId) {
  const res = await fetch(`https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products/${productId}/publish.json`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PRINTIFY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true }),
  })
  if (!res.ok) console.warn(`  publishProduct failed (non-fatal): ${res.status}`)
}

async function upsertToSupabase(product) {
  const enabledVariants = product.variants.filter(v => v.is_enabled)
  const priceFrom = enabledVariants.length ? Math.min(...enabledVariants.map(v => v.price)) : 3999

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      printify_id: product.id,
      title: product.title,
      description: product.description || '',
      tags: product.tags || [],
      options: product.options || [],
      variants: product.variants || [],
      images: product.images || [],
      price_from: priceFrom,
      is_enabled: true,
    }),
  })
  if (!res.ok) throw new Error(`Supabase upsert failed: ${res.status} ${await res.text()}`)
}

async function run() {
  console.log('Starting batch generation of 10 designs...\n')
  let success = 0

  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i]
    console.log(`[${i + 1}/10] Topic: "${topic}"`)
    try {
      const base64 = await generateDesign(topic)

      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)
      const uploaded = await uploadToPrintify(base64, `heartwear-${slug}.png`)
      console.log(`  Uploaded image: ${uploaded.id}`)

      const titleWords = topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      const title = `Heart of ${titleWords} Tee`
      const description = `For those who carry ${topic} in their heart. Soft unisex tee, 100% combed ring-spun cotton.`

      const product = await createPrintifyProduct(title, description, uploaded.id)
      console.log(`  Created product: ${product.id}`)

      await publishPrintifyProduct(product.id)
      console.log(`  Published to Printify`)

      await upsertToSupabase(product)
      console.log(`  Saved to Supabase ✓`)

      success++
    } catch (err) {
      console.error(`  FAILED: ${err.message}`)
    }

    if (i < TOPICS.length - 1) await new Promise(r => setTimeout(r, 3000))
  }

  console.log(`\nDone. ${success}/10 designs created successfully.`)
}

run().catch(console.error)
