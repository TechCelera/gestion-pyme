import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Intercambia el código PKCE del enlace de confirmación / magic link. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('error', 'auth_callback')
  return NextResponse.redirect(loginUrl)
}
