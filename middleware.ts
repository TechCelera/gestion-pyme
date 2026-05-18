import type { NextRequest } from 'next/server'
import { handleEdgeAuth } from '@/lib/auth/edge-proxy'

export default async function middleware(request: NextRequest) {
  return handleEdgeAuth(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
