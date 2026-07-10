export interface PrintifyVariant {
  id: number
  title: string
  price: number // in cents
  is_enabled: boolean
  options: number[]
  sku: string
}

export interface PrintifyImage {
  src: string
  variant_ids: number[]
  position: string
  is_default: boolean
}

export interface PrintifyOption {
  name: string // e.g. "Size", "Color"
  type: string
  values: { id: number; title: string }[]
}

export interface Product {
  id: string
  printify_id: string
  title: string
  description: string
  tags: string[]
  variants: PrintifyVariant[]
  images: PrintifyImage[]
  options: PrintifyOption[]
  price_from: number // lowest variant price in cents
  is_enabled: boolean
  artist_id?: string | null
  /** True for public-uploaded custom tees — orderable by link but hidden from the shop collection. */
  is_custom?: boolean
  /** Human-readable print placement chosen at creation (e.g. "Full Image — Back + Small Chest Front"). */
  placement?: string | null
  /** Groups the garment-style products for one design (Fit/Style switcher). */
  group_id?: string | null
  /** Which garment style this product is (classic | vneck | heavyweight | womens). */
  style_key?: string | null
}

/** One garment-style option in a design group, for the product-page Fit/Style switcher. */
export interface GarmentOption {
  styleKey: string
  styleLabel: string
  fit: string
  product: Product
}

export interface Artist {
  id: string
  slug: string
  display_name: string
  bio: string
  commission_pct: number
}

export interface CartItem {
  product_id: string
  printify_id: string
  variant_id: number
  title: string
  variant_title: string
  price: number // in cents
  quantity: number
  image: string
}

export interface Order {
  id: string
  stripe_session_id: string
  stripe_payment_intent_id: string
  printify_order_id?: string
  customer_email: string
  customer_name: string
  shipping_address: ShippingAddress
  line_items: CartItem[]
  total_amount: number
  currency: string
  status: 'pending' | 'paid' | 'submitted' | 'fulfilled' | 'shipped' | 'delivered' | 'failed'
  created_at: string
}

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  /** Stored inside the shipping_address JSONB — some carriers require it */
  phone?: string
}
