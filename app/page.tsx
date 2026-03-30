export const dynamic = 'force-dynamic'

import { Product } from '@/types'
import HomePageClient from '@/components/HomePageClient'

async function getFeaturedProducts(): Promise<Product[]> {
  // Guard against missing env vars during build/dev
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
      .limit(4)

    if (error) {
      console.error('Error fetching featured products:', error.message)
      return []
    }

    return (data as Product[]) ?? []
  } catch (err) {
    console.error('Failed to fetch featured products:', err)
    return []
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts()

  return <HomePageClient products={products} />
}
