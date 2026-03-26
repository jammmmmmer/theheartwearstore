import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

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
