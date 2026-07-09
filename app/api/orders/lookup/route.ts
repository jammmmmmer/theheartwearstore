/**
 * POST /api/orders/lookup — public order tracking.
 * Body: { email: string, ref: string }  (ref = 8-char order number from
 * the confirmation email, i.e. the first 8 hex chars of the order UUID).
 *
 * Requires BOTH the email and the order ref to match, and returns only
 * non-sensitive fields (status, tracking, date) — no address, no line items.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; ref?: string }
    const email = (body.email ?? '').trim().toLowerCase()
    const ref = (body.ref ?? '').trim().toLowerCase().replace(/[^a-f0-9]/g, '')

    if (!email || !email.includes('@') || ref.length < 6) {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
    }

    const { data: orders, error } = await supabaseAdmin()
      .from('orders')
      .select('id, status, created_at, tracking_number, tracking_carrier, tracking_url')
      .ilike('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(25)

    if (error) {
      console.error('[orders-lookup] Query failed:', error)
      return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
    }

    const match = (orders ?? []).find((o) =>
      String(o.id).toLowerCase().replace(/-/g, '').startsWith(ref) ||
      String(o.id).toLowerCase().startsWith(ref)
    )

    if (!match) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      order: {
        ref: String(match.id).slice(0, 8).toUpperCase(),
        status: match.status,
        created_at: match.created_at,
        tracking_number: match.tracking_number,
        tracking_carrier: match.tracking_carrier,
        tracking_url: match.tracking_url,
      },
    })
  } catch (err) {
    console.error('[orders-lookup] Error:', err)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }
}
