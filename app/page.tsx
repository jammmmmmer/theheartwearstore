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
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[homepage] Supabase error:', error.message)
      return []
    }

    // Filter enabled products in JS — avoids boolean coercion quirks in the JS client
    const enabled = (data as Product[])
      .filter(p => p.is_enabled !== false && p.is_custom !== true)
      .slice(0, 8)
    return enabled
  } catch (err) {
    console.error('[homepage] Fetch failed:', err)
    return []
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts()

  return <HomePageClient products={products} />
}
