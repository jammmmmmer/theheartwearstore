/**
 * POST /api/admin/generate-batch
 * Calls /api/auto-product/generate N times to create multiple AI designs.
 * Protected by SYNC_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token || token !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as { count?: number }
  const count = Math.min(body.count ?? 10, 20)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const results = []
  for (let i = 0; i < count; i++) {
    try {
      const res = await fetch(`${siteUrl}/api/auto-product/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SYNC_SECRET}`,
        },
      })
      const data = await res.json()
      results.push({ index: i + 1, ok: res.ok, ...data })
    } catch (err) {
      results.push({ index: i + 1, ok: false, error: err instanceof Error ? err.message : 'unknown' })
    }
    // Small delay between calls to avoid rate limits
    await new Promise(r => setTimeout(r, 2000))
  }

  return NextResponse.json({ ok: true, count, results })
}
