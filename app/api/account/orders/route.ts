/**
 * GET /api/account/orders — a signed-in customer's own order history.
 *
 * Auth: Supabase Auth Bearer token (same session the browser holds).
 * Orders are matched by the authenticated user's email. The orders table is
 * RLS-locked, so we read it with the service role AFTER verifying the token and
 * scope strictly to that email.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthUser } from '@/lib/artist-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin()
      .from('orders')
      .select(
        'id, created_at, status, total_amount, currency, line_items, shipping_address, customer_name, tracking_number, tracking_carrier, tracking_url'
      )
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true, email: user.email, orders: data ?? [] })
  } catch (err) {
    console.error('[account/orders] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
