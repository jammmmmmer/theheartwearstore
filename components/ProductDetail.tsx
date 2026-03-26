'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product, PrintifyVariant, PrintifyOption } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/lib/cart-store'
import { ShoppingBag, Check } from 'lucide-react'

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({})
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addItem, openCart } = useCartStore()

  // Find the variant that matches all selected options
  const selectedVariant: PrintifyVariant | undefined = product.variants.find((v) => {
    if (!v.is_enabled) return false
    return product.options.every((opt: PrintifyOption, idx: number) => {
      const selectedId = selectedOptions[opt.name]
      if (selectedId === undefined) return false
      return v.options[idx] === selectedId
    })
  })

  // Derive available option values based on current partial selection
  function isOptionValueAvailable(optionName: string, valueId: number): boolean {
    return product.variants.some((v) => {
      if (!v.is_enabled) return false
      const optIdx = product.options.findIndex((o: PrintifyOption) => o.name === optionName)
      if (optIdx === -1) return false
      if (v.options[optIdx] !== valueId) return false

      // Check other currently selected options still match
      return product.options.every((opt: PrintifyOption, idx: number) => {
        if (opt.name === optionName) return true
        const sel = selectedOptions[opt.name]
        if (sel === undefined) return true
        return v.options[idx] === sel
      })
    })
  }

  function handleSelectOption(optionName: string, valueId: number) {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: valueId }))
    setAddedToCart(false)
  }

  function handleAddToCart() {
    if (!selectedVariant) return

    const defaultImage =
      product.images.find((img) => img.variant_ids.includes(selectedVariant.id))?.src ??
      product.images.find((img) => img.is_default)?.src ??
      product.images[0]?.src ??
      ''

    addItem({
      product_id: product.id,
      printify_id: product.printify_id,
      variant_id: selectedVariant.id,
      title: product.title,
      variant_title: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      image: defaultImage,
    })

    setAddedToCart(true)
    setTimeout(() => {
      openCart()
    }, 400)
  }

  const allOptionsSelected =
    product.options.length === 0 ||
    product.options.every((opt: PrintifyOption) => selectedOptions[opt.name] !== undefined)

  const canAddToCart = allOptionsSelected && selectedVariant !== undefined

  const displayImages = product.images.length > 0 ? product.images : []
  const activeImageSrc = displayImages[activeImageIndex]?.src ?? ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Images */}
        <div className="flex flex-col gap-4">
          {/* Main image */}
          <div className="aspect-square bg-stone-100 relative overflow-hidden">
            {activeImageSrc ? (
              <Image
                src={activeImageSrc}
                alt={product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-100">
                <ShoppingBag size={48} strokeWidth={1} className="text-stone-300" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {displayImages.slice(0, 6).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 relative overflow-hidden border-2 transition-colors ${
                    activeImageIndex === idx
                      ? 'border-stone-900'
                      : 'border-transparent hover:border-stone-300'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    src={img.src}
                    alt={`${product.title} view ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="flex flex-col gap-6">
          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-xs uppercase tracking-widest text-sage-600 bg-sage-50 px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div>
            <h1 className="font-playfair text-4xl text-stone-900 leading-snug">
              {product.title}
            </h1>
            <p className="text-stone-500 text-xl mt-2">
              {selectedVariant
                ? formatPrice(selectedVariant.price)
                : `From ${formatPrice(product.price_from)}`}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <div
              className="text-stone-600 text-sm leading-relaxed prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Option selectors */}
          {product.options.map((option: PrintifyOption) => (
            <div key={option.name} className="flex flex-col gap-3">
              <label className="text-xs uppercase tracking-widest text-stone-500 font-medium">
                {option.name}
                {selectedOptions[option.name] !== undefined && (
                  <span className="text-stone-700 ml-2 normal-case tracking-normal">
                    {option.values.find((v) => v.id === selectedOptions[option.name])?.title}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const available = isOptionValueAvailable(option.name, value.id)
                  const selected = selectedOptions[option.name] === value.id
                  return (
                    <button
                      key={value.id}
                      onClick={() => available && handleSelectOption(option.name, value.id)}
                      disabled={!available}
                      className={`px-4 py-2 text-sm border transition-colors ${
                        selected
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : available
                          ? 'border-stone-300 text-stone-700 hover:border-stone-700'
                          : 'border-stone-200 text-stone-300 cursor-not-allowed line-through'
                      }`}
                      aria-pressed={selected}
                      aria-label={`${option.name}: ${value.title}${!available ? ' (unavailable)' : ''}`}
                    >
                      {value.title}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Add to cart */}
          <div className="flex flex-col gap-3 pt-2">
            {!allOptionsSelected && product.options.length > 0 && (
              <p className="text-xs text-stone-500">
                Please select{' '}
                {product.options
                  .filter((o: PrintifyOption) => selectedOptions[o.name] === undefined)
                  .map((o: PrintifyOption) => o.name)
                  .join(' and ')}
              </p>
            )}

            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className={`w-full flex items-center justify-center gap-2 py-4 text-sm tracking-widest uppercase transition-all duration-200 ${
                addedToCart
                  ? 'bg-sage-600 text-white'
                  : canAddToCart
                  ? 'bg-stone-900 text-white hover:bg-stone-700'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {addedToCart ? (
                <>
                  <Check size={16} />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={16} strokeWidth={1.5} />
                  Add to Cart
                </>
              )}
            </button>
          </div>

          {/* Trust notes */}
          <ul className="text-xs text-stone-500 space-y-1.5 pt-2 border-t border-stone-200">
            <li>Printed on demand — unique to your order</li>
            <li>Ships within 3–7 business days</li>
            <li>Free exchanges for sizing issues</li>
            <li>Secure checkout via Stripe</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
