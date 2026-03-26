import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Product } from '@/types'
import ProductDetail from '@/components/ProductDetail'

interface PageProps {
  params: { productId: string }
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
      .eq('is_enabled', true)
      .single()

    if (error || !data) return null
    return data as Product
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.productId)

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
  const product = await getProduct(params.productId)

  if (!product) {
    notFound()
  }

  return <ProductDetail product={product} />
}
