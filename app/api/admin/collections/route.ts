/**
 * /api/admin/collections — admin-only collection management.
 *
 * GET                              → list all collections
 * POST { action:'create', name }   → create a collection (idempotent by slug)
 * POST { action:'assign', collectionIds, productId? | pendingId? }
 *                                  → set the collection membership of a product
 *                                    (product_collections) or pending design
 *                                    (pending_products.collection_ids)
 *
 * Auth: httpOnly admin session cookie (or Bearer SYNC_SECRET) via isUploadAuthorized.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isUploadAuthorized } from '@/lib/session'
import {
  listCollections,
  resolveCollections,
  setProductCollections,
  setPendingCollections,
  slugify,
} from '@/lib/collections'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  if (!(await isUploadAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ collections: await listCollections() })
}

export async function POST(request: NextRequest) {
  if (!(await isUploadAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = (await request.json()) as {
      action: 'create' | 'assign'
      name?: string
      collectionIds?: string[]
      productId?: string
      pendingId?: string
    }

    if (body.action === 'create') {
      const name = (body.name ?? '').trim()
      if (!name || !slugify(name)) {
        return NextResponse.json({ error: 'A collection name is required' }, { status: 400 })
      }
      const [id] = await resolveCollections({ newNames: [name] })
      const list = await listCollections()
      return NextResponse.json({ ok: true, collection: list.find((c) => c.id === id) ?? null })
    }

    if (body.action === 'assign') {
      const collectionIds = Array.isArray(body.collectionIds) ? body.collectionIds.filter(Boolean) : []
      if (body.productId) {
        await setProductCollections(body.productId, collectionIds)
        return NextResponse.json({ ok: true })
      }
      if (body.pendingId) {
        await setPendingCollections(body.pendingId, collectionIds)
        return NextResponse.json({ ok: true })
      }
      return NextResponse.json({ error: 'productId or pendingId required' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[collections] Error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
