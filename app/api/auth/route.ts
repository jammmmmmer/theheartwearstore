import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  const credentials = process.env.UPLOAD_CREDENTIALS ?? ''
  const users: Record<string, string> = {}
  for (const pair of credentials.split(',')) {
    const [u, p] = pair.split('|')
    if (u && p) users[u.trim()] = p.trim()
  }

  if (!username || !password || users[username] !== password) {
    return NextResponse.json({ error: 'Invalid credentials', debug: credentials.slice(0, 30) }, { status: 401 })
  }

  return NextResponse.json({ secret: process.env.SYNC_SECRET })
}
