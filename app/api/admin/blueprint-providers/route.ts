/**
 * GET /api/admin/blueprint-providers?blueprint=12  — admin-only.
 * Lists the Printify print providers (id + name) that offer a blueprint,
 * so we can lock the exact provider IDs (Print Geek CA, Monster Digital US)
 * for the dual-provider split config.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getBlueprintProviders } from '@/lib/printify'
import { isUploadAuthorized } from '@/lib/session'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isUploadAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const blueprint = Number(request.nextUrl.searchParams.get('blueprint') ?? '12')
  try {
    const providers = await getBlueprintProviders(blueprint)
    return NextResponse.json({ ok: true, blueprint, providers })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
