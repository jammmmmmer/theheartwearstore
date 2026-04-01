import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('hs_session')?.value
  const syncSecret = process.env.SYNC_SECRET

  if (!session || session !== syncSecret) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/upload-design'],
}
