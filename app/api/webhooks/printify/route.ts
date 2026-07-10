import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getProduct } from '@/lib/printify'
import { sendShippedEmail } from '@/lib/customer-email'

/**
 * Extract shipment tracking from a Printify order-event payload.
 * Payload shapes vary slightly across event versions, so probe defensively.
 */
function extractTracking(data: Record<string, unknown> | undefined): {
  carrier?: string
  number?: string
  url?: string
} {
  if (!data) return {}
  const candidates: unknown[] = [
    (data as { shipment?: unknown }).shipment,
    Array.isArray((data as { shipments?: unknown[] }).shipments)
      ? (data as { shipments: unknown[] }).shipments[0]
      : undefined,
    data,
  ]
  for (const c of candidates) {
    if (!c || typeof c !== 'object') continue
    const s = c as Record<string, unknown>
    const number = (s.number ?? s.tracking_number) as string | undefined
    const url = (s.url ?? s.tracking_url) as string | undefined
    const carrier = (typeof s.carrier === 'string' ? s.carrier : undefined)
    if (number || url) return { carrier, number, url }
  }
  return {}
}

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * SECURITY: verify the X-Pfy-Signature header (HMAC-SHA256 of the raw body,
 * computed with the webhook secret configured on the Printify webhook
 * subscription). Without this, anyone can forge order-status updates or
 * force product upserts.
 */
function isValidPrintifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET
  if (!secret) {
    // Not configured yet — allow, but warn loudly. Set PRINTIFY_WEBHOOK_SECRET
    // and configure the same secret on the Printify webhook subscription.
    console.warn(
      '[printify-webhook] PRINTIFY_WEBHOOK_SECRET is not set — webhook signatures are NOT being verified'
    )
    return true
  }
  if (!signatureHeader) return false

  const provided = signatureHeader.replace(/^sha256=/, '').trim()
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}

// Printify validates webhooks with a GET request
export async function GET() {
  return NextResponse.json({ ok: true })
}

// Map Printify event/status strings to our internal order status
function mapPrintifyStatus(
  eventType: string
): 'submitted' | 'fulfilled' | 'shipped' | 'delivered' | 'failed' | null {
  const statusMap: Record<string, 'submitted' | 'fulfilled' | 'shipped' | 'delivered' | 'failed'> =
    {
      'order:created': 'submitted',
      'order:sent-to-production': 'submitted',
      'order:fulfilled': 'fulfilled',
      'order:shipment-created': 'shipped',
      'order:shipment-delivered': 'delivered',
      'order:failed': 'failed',
    }
  return statusMap[eventType] ?? null
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    if (!isValidPrintifySignature(rawBody, request.headers.get('x-pfy-signature'))) {
      console.warn('[printify-webhook] Rejected request with invalid or missing signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody) as {
      type: string
      resource?: {
        id?: string
        data?: {
          id?: string
          [key: string]: unknown
        }
        [key: string]: unknown
      }
    }

    const eventType = body.type

    // Handle product:created events (custom_integration shops fire product:created, not product:published)
    if (eventType === 'product:created' || eventType === 'product:published') {
      const productId = body.resource?.id
      if (!productId) {
        console.warn('product:published webhook received without product ID:', body)
        return NextResponse.json({ received: true })
      }

      const shopId = process.env.PRINTIFY_SHOP_ID!

      const product = await getProduct(shopId, String(productId)) as {
        id: string
        title: string
        description: string
        tags: string[]
        options: unknown[]
        variants: { price: number; is_enabled: boolean }[]
        images: unknown[]
        print_provider_id?: number
      }

      // Split fulfilment: US-region provider products (e.g. Monster Digital) are
      // fulfilment alternates linked via products.printify_id_us — they must NOT
      // become standalone shop rows. Skip syncing them.
      const { data: usRows } = await supabaseAdmin()
        .from('catalog_items')
        .select('print_provider_id')
        .eq('region', 'US')
      const usProviderIds = new Set((usRows ?? []).map((r) => r.print_provider_id as number))
      if (product.print_provider_id && usProviderIds.has(product.print_provider_id)) {
        console.log(`[webhook] skipping US-provider product ${productId} (fulfilment alternate)`)
        return NextResponse.json({ received: true })
      }

      const enabledVariants = product.variants.filter(v => v.is_enabled)
      const priceFrom = enabledVariants.length
        ? Math.min(...enabledVariants.map(v => v.price))
        : product.variants[0]?.price || 0

      const { error: upsertError } = await supabaseAdmin()
        .from('products')
        .upsert({
          printify_id: product.id,
          title: product.title,
          description: product.description || '',
          tags: product.tags || [],
          options: product.options || [],
          variants: product.variants || [],
          images: product.images || [],
          price_from: priceFrom,
          is_enabled: true,
        }, { onConflict: 'printify_id' })

      if (upsertError) {
        console.error(`[webhook] Failed to upsert product ${productId}:`, upsertError)
      } else {
        console.log(`[webhook] product:published — upserted product ${productId} to Supabase`)
      }

      return NextResponse.json({ received: true })
    }

    // Handle order events
    const printifyOrderId =
      body.resource?.id ??
      body.resource?.data?.id

    if (!printifyOrderId) {
      console.warn('Printify webhook received without order ID:', body)
      return NextResponse.json({ received: true })
    }

    const newStatus = mapPrintifyStatus(eventType)

    if (newStatus) {
      const db = supabaseAdmin()

      // Capture tracking details on shipment events
      const tracking =
        eventType === 'order:shipment-created'
          ? extractTracking(body.resource?.data as Record<string, unknown> | undefined)
          : {}

      const { data: updated, error } = await db
        .from('orders')
        .update({
          status: newStatus,
          ...(tracking.number ? { tracking_number: tracking.number } : {}),
          ...(tracking.carrier ? { tracking_carrier: tracking.carrier } : {}),
          ...(tracking.url ? { tracking_url: tracking.url } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('printify_order_id', String(printifyOrderId))
        .select('id, customer_email, customer_name')
        .maybeSingle()

      if (error) {
        console.error(
          `Failed to update order ${printifyOrderId} status to ${newStatus}:`,
          error
        )
      } else {
        console.log(
          `Updated order ${printifyOrderId} status to ${newStatus} (event: ${eventType})`
        )
        // Shipped notification with tracking (non-fatal)
        if (eventType === 'order:shipment-created' && updated?.customer_email) {
          await sendShippedEmail({
            to: updated.customer_email,
            name: updated.customer_name ?? '',
            orderRef: String(updated.id).slice(0, 8).toUpperCase(),
            carrier: tracking.carrier,
            trackingNumber: tracking.number,
            trackingUrl: tracking.url,
          })
        }
      }
    } else {
      console.log(`Unhandled Printify event type: ${eventType}`)
    }

    // Always return 200 so Printify stops retrying
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Error handling Printify webhook:', err)
    // Still return 200 to prevent retries
    return NextResponse.json({ received: true })
  }
}
