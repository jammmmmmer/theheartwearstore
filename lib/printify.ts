const PRINTIFY_BASE_URL = 'https://api.printify.com/v1'

function getHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'PrintifyAPIClient/1.0',
  }
}

interface PrintifyOrderPayload {
  external_id: string
  label: string
  line_items: {
    product_id: string
    variant_id: number
    quantity: number
  }[]
  shipping_method: number // 1 = standard
  send_shipping_notification: boolean
  address_to: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    country: string
    region: string
    address1: string
    address2?: string
    city: string
    zip: string
  }
}

export async function getShops(): Promise<unknown[]> {
  const res = await fetch(`${PRINTIFY_BASE_URL}/shops.json`, {
    headers: getHeaders(),
  })
  if (!res.ok) {
    throw new Error(`Printify getShops failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function getProducts(shopId: string): Promise<unknown[]> {
  const allProducts: unknown[] = []
  let page = 1
  const limit = 50

  while (true) {
    const res = await fetch(
      `${PRINTIFY_BASE_URL}/shops/${shopId}/products.json?page=${page}&limit=${limit}`,
      { headers: getHeaders() }
    )
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Printify getProducts failed: ${res.status} ${res.statusText} - ${body}`)
    }
    const data = await res.json() as { data: unknown[]; current_page: number; last_page: number }
    allProducts.push(...data.data)

    if (data.current_page >= data.last_page) {
      break
    }
    page++
  }

  return allProducts
}

export async function getProduct(shopId: string, productId: string): Promise<unknown> {
  const res = await fetch(
    `${PRINTIFY_BASE_URL}/shops/${shopId}/products/${productId}.json`,
    { headers: getHeaders() }
  )
  if (!res.ok) {
    throw new Error(`Printify getProduct failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// ─── Auto-product functions ────────────────────────────────────────────────

export async function uploadImageToPrintify(
  base64Contents: string,
  fileName: string
): Promise<{ id: string; preview_url: string }> {
  const res = await fetch(`${PRINTIFY_BASE_URL}/uploads/images.json`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ file_name: fileName, contents: base64Contents }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printify uploadImage failed: ${res.status} - ${err}`)
  }
  return res.json()
}

export async function createDraftProduct(
  shopId: string,
  payload: {
    title: string
    description: string
    tags: string[]
    blueprint_id: number
    print_provider_id: number
    variants: { id: number; price: number; is_enabled: boolean }[]
    print_areas: {
      variant_ids: number[]
      placeholders: {
        position: string
        images: { id: string; x: number; y: number; scale: number; angle: number }[]
      }[]
    }[]
  }
): Promise<{ id: string; images: { src: string; is_default: boolean }[] }> {
  const res = await fetch(`${PRINTIFY_BASE_URL}/shops/${shopId}/products.json`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printify createDraftProduct failed: ${res.status} - ${err}`)
  }
  return res.json()
}

export async function publishProduct(shopId: string, productId: string): Promise<void> {
  const res = await fetch(
    `${PRINTIFY_BASE_URL}/shops/${shopId}/products/${productId}/publish.json`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        title: true, description: true, images: true,
        variants: true, tags: true, keyFeatures: true, shipping_template: true,
      }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Printify publishProduct failed: ${res.status} - ${err}`)
  }
}

export async function deleteProduct(shopId: string, productId: string): Promise<void> {
  const res = await fetch(
    `${PRINTIFY_BASE_URL}/shops/${shopId}/products/${productId}.json`,
    { method: 'DELETE', headers: getHeaders() }
  )
  if (!res.ok && res.status !== 404) {
    const err = await res.text()
    throw new Error(`Printify deleteProduct failed: ${res.status} - ${err}`)
  }
}

// ─── Orders ────────────────────────────────────────────────────────────────

export async function createOrder(
  shopId: string,
  order: PrintifyOrderPayload
): Promise<{ id: string; [key: string]: unknown }> {
  const res = await fetch(
    `${PRINTIFY_BASE_URL}/shops/${shopId}/orders.json`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(order),
    }
  )
  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Printify createOrder failed: ${res.status} ${res.statusText} - ${errorText}`)
  }
  return res.json()
}
