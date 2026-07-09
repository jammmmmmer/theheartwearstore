/**
 * Anonymous voter fingerprint: salted hash of IP + user agent.
 * Not bulletproof (VPNs, shared NATs) but enough to stop casual ballot
 * stuffing on design votes without requiring accounts.
 */

import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'

export function voterFingerprint(request: NextRequest): string {
  const ip =
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  const ua = request.headers.get('user-agent') ?? ''
  const salt = process.env.APPROVAL_SECRET ?? 'heartwear'
  return createHash('sha256').update(`${salt}|${ip}|${ua}`).digest('hex')
}
