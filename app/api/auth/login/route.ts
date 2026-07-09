import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_DAYS } from '@/lib/session'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  // SECURITY: credentials come from env only — no fallback in source.
  const credString = process.env.UPLOAD_CREDENTIALS
  if (!credString) {
    console.error('[auth] UPLOAD_CREDENTIALS is not configured — login disabled')
    return NextResponse.json({ error: 'Login is not configured' }, { status: 503 })
  }

  const users: Record<string, string> = {}
  for (const pair of credString.split(',')) {
    const [u, p] = pair.split('|')
    if (u && p) users[u.trim()] = p.trim()
  }

  if (!username || !password || users[username] !== password) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  // SECURITY: the session cookie is a signed, expiring token bound to the
  // username — httpOnly so client JS can never read it. SYNC_SECRET is no
  // longer sent to the browser in any form.
  const token = await createSessionToken(username)
  const maxAge = 60 * 60 * 24 * SESSION_MAX_AGE_DAYS
  const secure = process.env.NODE_ENV === 'production'

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge,
  })
  // Display-only cookie (username shown in the UI) — contains no secrets
  res.cookies.set('hs_user', username, {
    httpOnly: false, secure, sameSite: 'lax', path: '/', maxAge,
  })
  return res
}
