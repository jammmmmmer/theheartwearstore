'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product, PrintifyVariant, PrintifyOption } from '@/types'
import { formatPrice } from '@/lib/utils'
import { useCartStore } from '@/lib/cart-store'
import { ShoppingBag, Check } from 'lucide-react'
import BuyNowButton from '@/components/BuyNowButton'
import WalletPayButton from '@/components/WalletPayButton'
import { useTranslation } from '@/lib/language-context'

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({})
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addItem, openCart } = useCartStore()
  const { tr } = useTranslation()

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
    <div className="bg-stone-950 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <div className="flex flex-col gap-4">
          {/* Main image */}
          <div className="aspect-square bg-stone-900 relative overflow-hidden">
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
              <div className="w-full h-full flex items-center justify-center bg-stone-900">
                <ShoppingBag size={48} strokeWidth={1} className="text-stone-700" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {displayImages.slice(0, 6).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 flex-shrink-0 relative overflow-hidden border-2 transition-colors bg-stone-900 ${
                    activeImageIndex === idx
                      ? 'border-sage-500'
                      : 'border-stone-800 hover:border-stone-600'
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
                  className="text-xs uppercase tracking-widest text-stone-400 bg-stone-800 px-2 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div>
            <h1 className="font-playfair text-3xl sm:text-4xl text-stone-50 leading-snug">
              {product.title}
            </h1>
            <p className="text-sage-400 text-xl mt-2">
              {selectedVariant
                ? formatPrice(selectedVariant.price)
                : `${tr.product_from} ${formatPrice(product.price_from)}`}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <div
              className="text-stone-400 text-sm leading-relaxed prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Option selectors */}
          {product.options.map((option: PrintifyOption) => (
            <div key={option.name} className="flex flex-col gap-3">
              <label className="text-xs uppercase tracking-widest text-stone-500 font-medium">
                {option.name}
                {selectedOptions[option.name] !== undefined && (
                  <span className="text-stone-300 ml-2 normal-case tracking-normal">
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
                      className={`px-4 py-2.5 min-h-[44px] text-sm border transition-colors ${
                        selected
                          ? 'border-sage-500 bg-stone-800 text-stone-50'
                          : available
                          ? 'border-stone-700 bg-stone-900 text-stone-300 hover:border-stone-500'
                          : 'border-stone-800 bg-stone-900 text-stone-600 cursor-not-allowed opacity-30 line-through'
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
                {tr.product_select_prompt}{' '}
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
                  ? 'bg-sage-700 text-white'
                  : canAddToCart
                  ? 'bg-sage-600 text-white hover:bg-sage-500'
                  : 'bg-stone-800 text-stone-600 cursor-not-allowed'
              }`}
            >
              {addedToCart ? (
                <>
                  <Check size={16} />
                  {tr.product_added}
                </>
              ) : (
                <>
                  <ShoppingBag size={16} strokeWidth={1.5} />
                  {tr.product_add_to_cart}
                </>
              )}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-800" />
              <span className="text-xs text-stone-700 uppercase tracking-widest">{tr.cart_or}</span>
              <div className="flex-1 h-px bg-stone-800" />
            </div>

            {selectedVariant ? (
              <div className="flex flex-col gap-2">
                <WalletPayButton product={product} variant={selectedVariant} />
                <BuyNowButton product={product} variant={selectedVariant} />
              </div>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 py-4 text-sm tracking-widest uppercase border border-stone-700 text-stone-300 hover:border-stone-500 cursor-not-allowed opacity-50"
              >
                {tr.product_buy_now}
              </button>
            )}
          </div>

          {/* Trust notes */}
          <ul className="text-xs text-stone-600 space-y-1.5 pt-2 border-t border-stone-800">
            <li>{tr.product_trust_1}</li>
            <li>{tr.product_trust_2}</li>
            <li>{tr.product_trust_3}</li>
            <li>{tr.product_trust_4}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
