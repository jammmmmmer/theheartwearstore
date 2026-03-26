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
}
