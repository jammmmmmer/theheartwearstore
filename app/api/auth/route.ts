import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { username, password } = await request.json()

  const credString = process.env.UPLOAD_CREDENTIALS ?? 'Jamie|Hunt4Pass,RP|Faggot,Julia|W1ldhorses'
  const users: Record<string, string> = {}
  for (const pair of credString.split(',')) {
    const [u, p] = pair.split('|')
    if (u && p) users[u.trim()] = p.trim()
  }

  if (!username || !password || users[username] !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  return NextResponse.json({ secret: process.env.SYNC_SECRET })
}
