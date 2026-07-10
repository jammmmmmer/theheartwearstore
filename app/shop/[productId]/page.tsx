import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Product, Artist } from '@/types'
import ProductDetail from '@/components/ProductDetail'
import RelatedProducts from '@/components/RelatedProducts'

/** Public artist info for attribution, if the product has one. */
async function getArtist(artistId: string | null | undefined): Promise<Artist | null> {
  if (!artistId) return null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('artists')
      .select('id, slug, display_name, bio, commission_pct')
      .eq('id', artistId)
      .maybeSingle()
    return (data as Artist | null) ?? null
  } catch {
    return null
  }
}

/** Other enabled products ranked by shared tags (top 4). */
async function getRelatedProducts(current: Product): Promise<Product[]> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .neq('id', current.id)
      .limit(50)
    if (error || !data) return []

    const currentTags = new Set((current.tags ?? []).map((t) => t.toLowerCase()))
    return (data as Product[])
      .filter((p) => p.is_enabled !== false && p.is_custom !== true)
      .map((p) => ({
        product: p,
        score: (p.tags ?? []).filter((t) => currentTags.has(t.toLowerCase())).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.product)
  } catch {
    return []
  }
}

interface PageProps {
  params: Promise<{ productId: string }>
}

async function getProduct(productId: string): Promise<Product | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error || !data) return null
    const product = data as Product
    // Respect is_enabled flag in JS (Supabase boolean filter has coercion bug)
    if (product.is_enabled === false) return null
    return product
  } catch {
    return null
  }
}

/**
 * Load the garment-style options for a design group (Fit/Style switcher).
 * Returns a single option when the product isn't grouped. Default garment first.
 */
async function getGarmentOptions(product: Product): Promise<import('@/types').GarmentOption[]> {
  const { getStyleCatalog } = await import('@/lib/catalog')
  const styleMeta = new Map<string, { label: string; fit: string; isDefault: boolean }>()
  try {
    for (const s of await getStyleCatalog()) {
      styleMeta.set(s.styleKey, { label: s.styleLabel, fit: s.fit, isDefault: s.isDefault })
    }
  } catch { /* fall back to single product below */ }

  const meta = (k?: string | null) => (k && styleMeta.get(k)) || { label: 'Classic', fit: 'unisex', isDefault: true }

  if (!product.group_id) {
    const m = meta(product.style_key)
    return [{ styleKey: product.style_key ?? 'classic', styleLabel: m.label, fit: m.fit, product }]
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { data } = await supabaseAdmin()
      .from('products')
      .select('*')
      .eq('group_id', product.group_id)
    const rows = ((data ?? []) as Product[]).filter((p) => p.is_enabled !== false)
    if (!rows.length) rows.push(product)
    return rows
      .map((p) => {
        const m = meta(p.style_key)
        return { styleKey: p.style_key ?? 'classic', styleLabel: m.label, fit: m.fit, product: p, _def: m.isDefault }
      })
      .sort((a, b) => (b._def ? 1 : 0) - (a._def ? 1 : 0))
      .map(({ _def, ...o }) => { void _def; return o })
  } catch {
    const m = meta(product.style_key)
    return [{ styleKey: product.style_key ?? 'classic', styleLabel: m.label, fit: m.fit, product }]
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params
  const product = await getProduct(productId)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  const defaultImage = product.images.find((img) => img.is_default) ?? product.images[0]

  return {
    title: product.title,
    description: product.description
      ? product.description.replace(/<[^>]+>/g, '').slice(0, 160)
      : `Shop ${product.title} at The Heartwear Store.`,
    openGraph: {
      title: product.title,
      images: defaultImage ? [{ url: defaultImage.src }] : [],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params
  const product = await getProduct(productId)

  if (!product) {
    notFound()
  }

  const [related, artist, garments] = await Promise.all([
    getRelatedProducts(product),
    getArtist(product.artist_id),
    getGarmentOptions(product),
  ])

  return (
    <>
      <ProductDetail product={product} artist={artist} garments={garments} />
      <RelatedProducts products={related} />
    </>
  )
}
