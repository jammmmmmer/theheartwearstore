'use client'

import { useState, useMemo, useEffect } from 'react'
// Note: using plain <img> tags instead of Next.js <Image> for Printify CDN URLs.
// Next.js Image routes through the server-side optimizer which fails in Docker dev.
// Plain <img> loads directly from the browser.
import { Product, PrintifyVariant, PrintifyOption, PrintifyImage, Artist } from '@/types'
import { useCartStore } from '@/lib/cart-store'
import { ShoppingBag, Check, ZoomIn, X } from 'lucide-react'
import BuyNowButton from '@/components/BuyNowButton'
import WalletPayButton from '@/components/WalletPayButton'
import SizeChart from '@/components/SizeChart'
import { useTranslation } from '@/lib/language-context'
import { useCurrency } from '@/lib/currency-context'

interface ProductDetailProps {
  product: Product
  artist?: Artist | null
}

// Printify's Bella+Canvas mockup scenes for this tee: person-1 & person-3 are
// female models, person-2 & person-4 are male. The store leads with male-model
// lifestyle shots, so the female-model scenes are hidden from the gallery.
// (Flat shots — front/back/sleeves/folded — are always kept.)
const HIDDEN_MODEL_SCENES = ['person-1', 'person-3']
function isHiddenModelShot(src: string): boolean {
  const label = src.match(/camera_label=([^&]+)/)?.[1] ?? ''
  return HIDDEN_MODEL_SCENES.some((scene) => label.startsWith(scene))
}

export default function ProductDetail({ product, artist }: ProductDetailProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({})
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxZoom, setLightboxZoom] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const { addItem, openCart } = useCartStore()
  const { tr } = useTranslation()
  const { display } = useCurrency()

  // The image-bearing option is the colour (the non-size option; Printify names it "Colors").
  const colorOption = product.options.find(
    (o: PrintifyOption) => !o.name.toLowerCase().startsWith('size')
  )
  const colorOptionIndex = colorOption
    ? product.options.findIndex((o: PrintifyOption) => o.name === colorOption.name)
    : -1

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
    // Picking a colour swaps the gallery to that colour's mockups (front shot first).
    if (colorOption && optionName === colorOption.name) {
      setActiveImageIndex(0)
    }
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

  // Variant ids belonging to the currently selected colour (all of its sizes).
  const selectedColorId = colorOption ? selectedOptions[colorOption.name] : undefined
  const selectedColorVariantIds = useMemo(() => {
    if (selectedColorId === undefined || colorOptionIndex === -1) return null
    return new Set(
      product.variants
        .filter((v) => v.options[colorOptionIndex] === selectedColorId)
        .map((v) => v.id)
    )
  }, [product.variants, colorOptionIndex, selectedColorId])

  // Once a colour is chosen, show only that colour's mockups (front shot first).
  // Falls back to all images when no colour is selected or none are tagged.
  const displayImages = useMemo(() => {
    const all = product.images.filter((img) => !isHiddenModelShot(img.src))
    if (!selectedColorVariantIds) return all
    const matched = all.filter((img: PrintifyImage) =>
      img.variant_ids.some((id) => selectedColorVariantIds.has(id))
    )
    if (matched.length === 0) return all
    const rank = (img: PrintifyImage) => {
      if (img.position === 'front') return 0
      if (img.position === 'other') return img.is_default ? 1 : 2
      if (img.position === 'back') return 3
      return 4
    }
    return [...matched].sort((a, b) => rank(a) - rank(b))
  }, [product.images, selectedColorVariantIds])

  const activeImageSrc =
    displayImages[activeImageIndex]?.src ?? displayImages[0]?.src ?? ''

  // Close the zoom lightbox on Escape, and lock body scroll while it's open.
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightboxOpen])

  return (
    <div className="bg-stone-950 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        {/* Images */}
        <div className="flex flex-col gap-4">
          {/* Main image */}
          <div className="aspect-square hw-stage relative overflow-hidden rounded-card shadow-card">
            {activeImageSrc ? (
              <>
                <img
                  src={activeImageSrc}
                  alt={product.title}
                  onClick={() => { setLightboxZoom(false); setLightboxOpen(true) }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '4%',
                    cursor: 'zoom-in',
                  }}
                />
                <button
                  type="button"
                  onClick={() => { setLightboxZoom(false); setLightboxOpen(true) }}
                  aria-label={tr.zoom_label}
                  className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-stone-950/70 hover:bg-stone-950/90 text-stone-100 px-3 py-1.5 text-xs backdrop-blur transition-colors"
                >
                  <ZoomIn size={14} /> {tr.zoom_label}
                </button>
              </>
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

          {/* Chosen print placement */}
          {product.placement && (
            <p className="text-xs text-stone-400">
              <span className="uppercase tracking-widest text-stone-500 font-medium">
                {tr.placement_label}:{' '}
              </span>
              {product.placement}
            </p>
          )}

          {/* Custom-upload final-sale notice */}
          {product.is_custom && (
            <div className="border border-hw-accent2/40 bg-hw-accent2/5 rounded-control px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-hw-accent2 font-semibold">
                {tr.custom_badge}
              </p>
              <p className="mt-1 text-xs text-stone-300 leading-relaxed">
                {tr.custom_final_sale}
              </p>
            </div>
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

      {/* Zoom lightbox */}
      {lightboxOpen && activeImageSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 overflow-auto"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={product.title}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label={tr.close_label}
            className="fixed top-4 right-4 z-[110] flex items-center justify-center w-10 h-10 rounded-full bg-stone-950/70 hover:bg-stone-950/90 text-stone-100 transition-colors"
          >
            <X size={22} />
          </button>
          <img
            src={activeImageSrc}
            alt={product.title}
            onClick={(e) => { e.stopPropagation(); setLightboxZoom((z) => !z) }}
            style={{
              maxWidth: lightboxZoom ? 'none' : '92vw',
              maxHeight: lightboxZoom ? 'none' : '92vh',
              height: lightboxZoom ? '160vh' : 'auto',
              objectFit: 'contain',
              cursor: lightboxZoom ? 'zoom-out' : 'zoom-in',
              transition: 'height 0.2s ease',
            }}
          />
        </div>
      )}
    </div>
  )
}
