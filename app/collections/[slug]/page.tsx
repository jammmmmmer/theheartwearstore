/**
 * /collections/[slug] — a shoppable collection page.
 * Lists the enabled, non-custom products that belong to the collection,
 * reusing the shop grid (search + tag filters) via ShopPageClient.
 */

import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { Product } from '@/types'
import ShopPageClient from '@/components/ShopPageClient'

export const dynamic = 'force-dynamic'

async function loadCollection(slug: string): Promise<{ name: string; products: Product[] } | null> {
  noStore()
  try {
    const db = supabaseAdmin()
    const { data: collection } = await db
      .from('collections')
      .select('id, name')
      .eq('slug', slug)
      .maybeSingle()
    if (!collection) return null

    const { data: links } = await db
      .from('product_collections')
      .select('product_id')
      .eq('collection_id', collection.id)
    const ids = (links ?? []).map((l) => l.product_id as string)
    if (!ids.length) return { name: collection.name as string, products: [] }

    const { data: products } = await db.from('products').select('*').in('id', ids)
    const visible = ((products ?? []) as Product[]).filter(
      (p) => p.is_enabled !== false && p.is_custom !== true
    )
    return { name: collection.name as string, products: visible }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const data = await loadCollection(slug)
  return { title: data ? `${data.name} — Collection` : 'Collection' }
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await loadCollection(slug)
  if (!data) notFound()

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <p className="text-[10px] tracking-[0.5em] uppercase text-sage-700 mb-2">Collection</p>
        <h1 className="font-playfair text-4xl text-stone-50">{data.name}</h1>
        <p className="text-stone-500 text-sm mt-1">
          {data.products.length} {data.products.length === 1 ? 'design' : 'designs'}
        </p>
      </div>
      <ShopPageClient products={data.products} />
    </div>
  )
}
