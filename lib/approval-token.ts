/**
 * Approval token utilities — HMAC-SHA256 signed JWTs
 * Used to secure approve/reject links in product review emails
 */

const ALGORITHM = 'HS256'

function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString('utf-8')
}

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export interface ApprovalPayload {
  pendingId: string
  printifyId: string
  action: 'approve' | 'reject'
  exp: number
}

export async function signToken(
  payload: Omit<ApprovalPayload, 'exp'>,
  expiresInDays = 7
): Promise<string> {
  const secret = process.env.APPROVAL_SECRET!
  const header = base64url(JSON.stringify({ alg: ALGORITHM, typ: 'JWT' }))
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60
  const body = base64url(JSON.stringify({ ...payload, exp }))
  const signingInput = `${header}.${body}`

  const key = await getKey(secret)
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput))
  const signature = Buffer.from(sig).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${signingInput}.${signature}`
}

export async function verifyToken(token: string): Promise<ApprovalPayload> {
  const secret = process.env.APPROVAL_SECRET!
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token format')

  const [header, body, signature] = parts
  const signingInput = `${header}.${body}`

  const key = await getKey(secret)
  const enc = new TextEncoder()

  // Decode provided signature back to ArrayBuffer
  const sigBuffer = Buffer.from(
    signature.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (signature.length % 4)) % 4),
    'base64'
  )

  const valid = await crypto.subtle.verify('HMAC', key, sigBuffer, enc.encode(signingInput))
  if (!valid) throw new Error('Invalid token signature')

  const payload: ApprovalPayload = JSON.parse(base64urlDecode(body))

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired')
  }

  return payload
}
