import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Product, Artist } from '@/types'
import ArtistPageClient from '@/components/ArtistPageClient'

interface PageProps {
  params: { slug: string }
}

async function getArtistWithProducts(
  slug: string
): Promise<{ artist: Artist; products: Product[] } | null> {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: artist } = await supabase
      .from('artists')
      .select('id, slug, display_name, bio, commission_pct')
      .eq('slug', slug)
      .maybeSingle()
    if (!artist) return null

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('artist_id', artist.id)
      .limit(60)

    return {
      artist: artist as Artist,
      products: ((products ?? []) as Product[]).filter((p) => p.is_enabled !== false),
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getArtistWithProducts(params.slug)
  if (!data) return { title: 'Artist Not Found' }
  return {
    title: `${data.artist.display_name} — Artist`,
    description: data.artist.bio?.slice(0, 160) || `Designs by ${data.artist.display_name} at The Heartwear Store.`,
  }
}

export const dynamic = 'force-dynamic'

export default async function ArtistPage({ params }: PageProps) {
  const data = await getArtistWithProducts(params.slug)
  if (!data) notFound()

  return <ArtistPageClient artist={data.artist} products={data.products} />
}
