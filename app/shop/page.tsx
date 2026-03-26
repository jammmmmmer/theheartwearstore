import { Metadata } from 'next'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Page header */}
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-sage-600 mb-3">Handpicked for you</p>
        <h1 className="font-playfair text-5xl text-stone-900 mb-4">The Collection</h1>
        {products.length > 0 && (
          <p className="text-stone-500 text-sm">
            {products.length} {products.length === 1 ? 'style' : 'styles'} available
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-playfair text-2xl italic text-stone-400 mb-3">
            Our collection is on its way.
          </p>
          <p className="text-stone-400 text-sm max-w-md mx-auto">
            We&apos;re curating something special. Check back soon — every piece is worth the wait.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
