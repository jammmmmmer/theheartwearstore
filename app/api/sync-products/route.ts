import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getProducts } from '@/lib/printify'
import { Product } from '@/types'

interface PrintifyProductRaw {
  id: string
  title: string
  description: string
  tags: string[]
  options: unknown[]
  variants: unknown[]
  images: unknown[]
  is_enabled?: boolean
  [key: string]: unknown
}

function mapPrintifyProduct(p: PrintifyProductRaw): Omit<Product, 'id'> & { printify_id: string } {
  // Safely cast typed arrays
  const variants = (p.variants ?? []) as Product['variants']
  const images = (p.images ?? []) as Product['images']
  const options = (p.options ?? []) as Product['options']

  // Find lowest price from enabled variants
  const enabledVariants = variants.filter((v) => v.is_enabled)
  const priceFrom =
    enabledVariants.length > 0
      ? Math.min(...enabledVariants.map((v) => v.price))
      : 0

  return {
    printify_id: p.id,
    title: p.title ?? '',
    description: p.description ?? '',
    tags: p.tags ?? [],
    options,
    variants,
    images,
    price_from: priceFrom,
    is_enabled: p.is_enabled !== false,
  }
}

export async function POST(request: NextRequest) {
  // Validate authorization
  const authHeader = request.headers.get('Authorization')
  const expectedToken = process.env.SYNC_SECRET

  if (!expectedToken) {
    return NextResponse.json({ error: 'SYNC_SECRET not configured' }, { status: 500 })
  }

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const shopId = process.env.PRINTIFY_SHOP_ID
  if (!shopId) {
    return NextResponse.json({ error: 'PRINTIFY_SHOP_ID not configured' }, { status: 500 })
  }

  let synced = 0
  const errors: string[] = []

  try {
    const rawProducts = (await getProducts(shopId)) as PrintifyProductRaw[]
    const db = supabaseAdmin()

    for (const raw of rawProducts) {
      try {
        const mapped = mapPrintifyProduct(raw)

        const { error } = await db
          .from('products')
          .upsert(
            {
              ...mapped,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'printify_id' }
          )

        if (error) {
          errors.push(`Product ${raw.id} (${raw.title}): ${error.message}`)
        } else {
          synced++
        }
      } catch (err) {
        errors.push(
          `Product ${raw.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      }
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: `Failed to fetch from Printify: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ synced, errors })
}
