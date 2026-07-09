'use client'

import { useState } from 'react'
// Note: using plain <img> tags instead of Next.js <Image> for Printify CDN URLs.
// Next.js Image routes through the server-side optimizer which fails in Docker dev.
// Plain <img> loads directly from the browser.
import { Product, PrintifyVariant, PrintifyOption, Artist } from '@/types'
import { useCartStore } from '@/lib/cart-store'
import { ShoppingBag, Check } from 'lucide-react'
import BuyNowButton from '@/components/BuyNowButton'
import WalletPayButton from '@/components/WalletPayButton'
import SizeChart from '@/components/SizeChart'
import { useTranslation } from '@/lib/language-context'
import { useCurrency } from '@/lib/currency-context'

interface ProductDetailProps {
  product: Product
  artist?: Artist | null
}

export default function ProductDetail({ product, artist }: ProductDetailProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({})
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addItem, openCart } = useCartStore()
  const { tr } = useTranslation()
  const { display } = useCurrency()

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
          <div className="aspect-square hw-stage relative overflow-hidden rounded-card shadow-card">
            {activeImageSrc ? (
              <img
                src={activeImageSrc}
                alt={product.title}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '4%',
                }}
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
                  className={`w-16 h-16 flex-shrink-0 relative overflow-hidden rounded-xl border-2 transition-colors hw-stage ${
                    activeImageIndex === idx
                      ? 'border-stone-50'
                      : 'border-stone-800 hover:border-stone-600'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img.src}
                    alt={`${product.title} view ${idx + 1}`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
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
                  className="text-xs text-stone-400 bg-stone-900 px-3 py-1 rounded-full font-medium"
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
            {artist && (
              <p className="text-xs uppercase tracking-widest text-stone-500 mt-2">
                {tr.product_design_by}{' '}
                <a
                  href={`/artists/${artist.slug}`}
                  className="text-sage-500 hover:text-sage-400 transition-colors normal-case tracking-normal"
                >
                  {artist.display_name}
                </a>
              </p>
            )}
            <p className="text-hw-accent2 text-xl mt-2 font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {selectedVariant
                ? display(selectedVariant.price)
                : `${tr.product_from} ${display(product.price_from)}`}
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
                      className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-control border transition-all ${
                        selected
                          ? 'border-stone-50 bg-stone-50 text-stone-950 shadow-card'
                          : available
                          ? 'border-stone-700 bg-stone-950 text-stone-200 hover:border-stone-500'
                          : 'border-stone-800 bg-stone-950 text-stone-600 cursor-not-allowed opacity-40 line-through'
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
              className={`w-full flex items-center justify-center gap-2 py-4 text-[15px] font-semibold rounded-control transition-all duration-200 ${
                addedToCart
                  ? 'bg-[#3f5a3f] text-white'
                  : canAddToCart
                  ? 'bg-[#d64533] text-white hover:bg-[#b23222]'
                  : 'bg-stone-900 text-stone-600 cursor-not-allowed'
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
                className="w-full flex items-center justify-center gap-2 py-4 text-sm font-medium rounded-control border border-stone-700 text-stone-400 cursor-not-allowed opacity-60"
              >
                {tr.product_buy_now}
              </button>
            )}
          </div>

          {/* Size chart */}
          <SizeChart
            sizes={
              product.options
                // Printify names this option "Sizes" (plural) on some blueprints
                .find((o: PrintifyOption) => o.name.toLowerCase().startsWith('size'))
                ?.values.map((v) => v.title) ?? []
            }
          />

          {/* Trust notes */}
          <ul className="text-xs text-stone-400 space-y-1.5 pt-2 border-t border-stone-800">
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
