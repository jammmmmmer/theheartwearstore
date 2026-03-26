import Hero from '@/components/Hero'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'
import { Leaf, Sparkles, Heart } from 'lucide-react'
import Link from 'next/link'

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

const promises = [
  {
    icon: <Sparkles size={24} strokeWidth={1.5} className="text-sage-500" />,
    title: 'Made to Order',
    body: 'Every piece is printed when you order it — zero overproduction, zero waste.',
  },
  {
    icon: <Leaf size={24} strokeWidth={1.5} className="text-sage-500" />,
    title: 'Natural Ethos',
    body: 'We care about what touches your skin and what stays on this earth.',
  },
  {
    icon: <Heart size={24} strokeWidth={1.5} className="text-sage-500" />,
    title: 'For Everyone',
    body: 'Timeless designs that speak across generations — because good taste has no age.',
  },
]

export default async function HomePage() {
  const products = await getFeaturedProducts()

  return (
    <>
      <Hero />

      {/* Featured Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-sage-600 mb-2">New arrivals</p>
            <h2 className="font-playfair text-4xl text-stone-900">Featured Collection</h2>
          </div>
          <Link href="/shop" className="text-sm text-stone-600 hover:text-stone-900 underline underline-offset-4 transition-colors">
            View all styles →
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-lg font-playfair italic">Our collection is coming soon.</p>
            <p className="text-sm mt-2">Check back shortly — great things are being made.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Our Promise section */}
      <section className="bg-stone-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-sage-600 mb-2">Why us</p>
            <h2 className="font-playfair text-4xl text-stone-900">Our Promise</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {promises.map((p) => (
              <div key={p.title} className="flex flex-col items-center text-center gap-4 px-4">
                <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center shadow-sm">
                  {p.icon}
                </div>
                <h3 className="font-playfair text-xl text-stone-900">{p.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-stone-900 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl text-white mb-4 italic">
            Something made just for you
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed mb-8">
            Browse our full collection and find a piece that feels like it was made with your
            heart in mind. Because it was.
          </p>
          <Link href="/shop" className="inline-block bg-stone-50 text-stone-900 px-8 py-3 text-sm tracking-widest uppercase hover:bg-white transition-colors duration-200">
            Shop the Collection
          </Link>
        </div>
      </section>
    </>
  )
}
