import { redirect } from 'next/navigation'

import { AUTH_COMPLETAR_PARAM, AUTH_COMPLETAR_VALUE } from '@/lib/auth/auth-completion-routes'
import { ROUTES } from '@/lib/constants'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

/** Ruta legada: el flujo vive en login/registro con ?completar=1 */
export default async function LegacyCompleteAccountRedirect({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  const resolved = await searchParams
  const next = resolveRouteSearchParam(resolved.next)
  const url = new URL(ROUTES.LOGIN, 'http://local')
  url.searchParams.set(AUTH_COMPLETAR_PARAM, AUTH_COMPLETAR_VALUE)
  if (next?.startsWith('/') && !next.startsWith('//')) {
    url.searchParams.set('next', next)
  }
  redirect(`${url.pathname}${url.search}`)
}
