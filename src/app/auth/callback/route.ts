import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/lib/constants'

/** Intercambia el código PKCE del enlace de confirmación / magic link. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? ROUTES.DASHBOARD

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  if (next === ROUTES.RESET_PASSWORD) {
    return NextResponse.redirect(new URL(ROUTES.FORGOT_PASSWORD, origin))
  }

  const loginUrl = new URL(ROUTES.LOGIN, origin)
  loginUrl.searchParams.set('error', 'auth_callback')
  return NextResponse.redirect(loginUrl)
}
