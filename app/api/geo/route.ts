/**
 * GET /api/geo — visitor country for default-currency detection.
 * Reads the CDN-provided geo header (Netlify: x-country; fallbacks for
 * other hosts). Returns { country: "CA" | "US" | "" | ... }.
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const country =
    request.headers.get('x-country') ??
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    ''

  return NextResponse.json(
    { country: country.toUpperCase() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
