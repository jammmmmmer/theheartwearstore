/**
 * Admin session tokens — HMAC-SHA256 signed, httpOnly cookie.
 *
 * Replaces the previous scheme where SYNC_SECRET was stored in a
 * non-httpOnly cookie and read by client JS (a critical secret leak).
 * Uses only Web APIs (TextEncoder, crypto.subtle, btoa/atob) so it
 * works in both the Node.js route runtime and the Edge middleware.
 */

import type { NextRequest } from 'next/server'

export const SESSION_COOKIE = 'hs_session'
export const SESSION_MAX_AGE_DAYS = 7

const encoder = new TextEncoder()

function getSecret(): string {
  const secret = process.env.SESSION_SECRET ?? process.env.APPROVAL_SECRET
  if (!secret) throw new Error('SESSION_SECRET (or APPROVAL_SECRET) must be set')
  return secret
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of Array.from(bytes)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64Url(str: string): Uint8Array<ArrayBuffer> {
  const b64 =
    str.replace(/-/g, '+').replace(/_/g, '/') +
    '=='.slice(0, (4 - (str.length % 4)) % 4)
  const bin = atob(b64)
  const bytes = new Uint8Array(new ArrayBuffer(bin.length))
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

interface SessionPayload {
  u: string // username
  exp: number // unix seconds
}

export async function createSessionToken(
  username: string,
  expiresInDays = SESSION_MAX_AGE_DAYS
): Promise<string> {
  const payload: SessionPayload = {
    u: username,
    exp: Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60,
  }
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign('HMAC', await getKey(), encoder.encode(body))
  return `${body}.${toBase64Url(new Uint8Array(sig))}`
}

/** Returns the username if the token is valid and unexpired, else null. */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<string | null> {
  try {
    if (!token) return null
    const [body, sig] = token.split('.')
    if (!body || !sig) return null
    const valid = await crypto.subtle.verify(
      'HMAC',
      await getKey(),
      fromBase64Url(sig),
      encoder.encode(body)
    )
    if (!valid) return null
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body))
    ) as SessionPayload
    if (!payload.u || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload.u
  } catch {
    return null
  }
}

/**
 * Auth check for admin/upload API routes.
 * Accepts either a valid httpOnly session cookie (browser flows)
 * or `Authorization: Bearer <SYNC_SECRET>` (server-to-server, e.g. cron).
 */
export async function isUploadAuthorized(request: NextRequest): Promise<boolean> {
  const auth = request.headers.get('authorization')
  if (auth && process.env.SYNC_SECRET && auth === `Bearer ${process.env.SYNC_SECRET}`) {
    return true
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value
  return (await verifySessionToken(token)) !== null
}
