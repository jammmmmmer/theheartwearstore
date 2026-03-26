import Image from 'next/image'
import Link from 'next/link'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const defaultImage =
    product.images.find((img) => img.is_default) ?? product.images[0]
  const imageUrl = defaultImage?.src ?? '/placeholder-tshirt.jpg'

  return (
    <Link
      href={`/shop/${product.id}`}
      className="group block"
      aria-label={`View ${product.title}`}
    >
      <div className="overflow-hidden bg-stone-100 aspect-square relative">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-stone-900 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="font-playfair text-stone-900 text-lg leading-snug group-hover:text-stone-700 transition-colors">
          {product.title}
        </h3>
        <p className="text-stone-500 text-sm">
          From {formatPrice(product.price_from)}
        </p>
      </div>
    </Link>
  )
}
