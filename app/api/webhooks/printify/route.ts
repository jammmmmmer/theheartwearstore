import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getProduct } from '@/lib/printify'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    const body = await request.json() as {
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

      const { error } = await db
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('printify_order_id', String(printifyOrderId))

      if (error) {
        console.error(
          `Failed to update order ${printifyOrderId} status to ${newStatus}:`,
          error
        )
      } else {
        console.log(
          `Updated order ${printifyOrderId} status to ${newStatus} (event: ${eventType})`
        )
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
