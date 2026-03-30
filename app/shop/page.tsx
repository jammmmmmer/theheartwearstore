import { Metadata } from 'next'
import { Product } from '@/types'
import ShopPageClient from '@/components/ShopPageClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse The Heartwear Store full collection of thoughtfully made, printed-on-demand clothing.',
}

async function getAllProducts(): Promise<Product[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
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
      .eq('is_enabled', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error.message)
      return []
    }

    return (data as Product[]) ?? []
  } catch (err) {
    console.error('Failed to fetch products:', err)
    return []
  }
}

export default async function ShopPage() {
  const products = await getAllProducts()

  return <ShopPageClient products={products} />
}
