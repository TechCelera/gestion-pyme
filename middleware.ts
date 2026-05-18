import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { handleEdgeAuth } from '@/lib/auth/edge-proxy'
import { shouldBypassEdgeAuth } from '@/lib/auth/edge-public-paths'

export default async function middleware(request: NextRequest) {
  if (shouldBypassEdgeAuth(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  return handleEdgeAuth(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image).*)',
  ],
}
