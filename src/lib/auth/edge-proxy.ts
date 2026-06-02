import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import {
  AUTH_COMPLETAR_PARAM,
  AUTH_COMPLETAR_VALUE,
  authCompletionSurfaceFromPath,
  buildAuthCompletarReturnPath,
  extractEventualNextFromReturnPath,
} from '@/lib/auth/auth-completion-routes'
import { isPublicAuthPath } from '@/lib/auth/edge-public-paths'
import { userNeedsProfileCompletion } from '@/lib/auth/server-profile-completion'
import { ROUTES } from '@/lib/constants'

function isAuthCompletarRequest(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get(AUTH_COMPLETAR_PARAM) === AUTH_COMPLETAR_VALUE
}

function isAuthEntryPath(pathname: string): boolean {
  return pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER
}

/** Session refresh + redirects at the edge (single source of truth). */
export async function handleEdgeAuth(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, searchParams } = request.nextUrl
  const isPublic = isPublicAuthPath(pathname)
  const onCompletar = isAuthCompletarRequest(request)
  const onAuthEntry = isAuthEntryPath(pathname)

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
  }

  if (user) {
    const needsCompletion = await userNeedsProfileCompletion(supabase, user)

    if (needsCompletion) {
      if (onAuthEntry && onCompletar) {
        return supabaseResponse
      }

      if (onAuthEntry && !onCompletar) {
        const surface = authCompletionSurfaceFromPath(pathname)
        const eventualNext = extractEventualNextFromReturnPath(
          searchParams.get('next') ?? ROUTES.DASHBOARD
        )
        return NextResponse.redirect(
          new URL(buildAuthCompletarReturnPath(surface, eventualNext), request.url)
        )
      }

      if (!pathname.startsWith('/auth')) {
        const completeUrl = new URL(
          buildAuthCompletarReturnPath('login', pathname),
          request.url
        )
        return NextResponse.redirect(completeUrl)
      }

      return supabaseResponse
    }

    if (onCompletar) {
      const eventualNext = extractEventualNextFromReturnPath(
        `${pathname}?${searchParams.toString()}`
      )
      return NextResponse.redirect(new URL(eventualNext, request.url))
    }

    if (onAuthEntry) {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url))
    }
  }

  return supabaseResponse
}
