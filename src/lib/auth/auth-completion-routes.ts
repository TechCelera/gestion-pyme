import { ROUTES } from '@/lib/constants'

export const AUTH_COMPLETAR_PARAM = 'completar'
export const AUTH_COMPLETAR_VALUE = '1'

export type AuthCompletionSurface = 'login' | 'register'

/** Ruta de retorno tras OAuth cuando el usuario nuevo debe completar datos en la misma pantalla. */
export function buildAuthCompletarReturnPath(
  surface: AuthCompletionSurface,
  nextPath: string = ROUTES.DASHBOARD
): string {
  const base = surface === 'register' ? ROUTES.REGISTER : ROUTES.LOGIN
  const url = new URL(base, 'http://local')
  url.searchParams.set(AUTH_COMPLETAR_PARAM, AUTH_COMPLETAR_VALUE)
  const safeNext =
    nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : ROUTES.DASHBOARD
  if (safeNext !== ROUTES.DASHBOARD) {
    url.searchParams.set('next', safeNext)
  }
  return `${url.pathname}${url.search}`
}

export function isAuthCompletarSearchParams(
  searchParams: URLSearchParams | { get(name: string): string | null }
): boolean {
  return searchParams.get(AUTH_COMPLETAR_PARAM) === AUTH_COMPLETAR_VALUE
}

export function authCompletionSurfaceFromPath(pathname: string): AuthCompletionSurface {
  return pathname.startsWith(ROUTES.REGISTER) ? 'register' : 'login'
}

/** Extrae la ruta final guardada en `?next=` cuando el retorno OAuth trae `?completar=1`. */
export function extractEventualNextFromReturnPath(returnPath: string): string {
  const normalized = returnPath.startsWith('/') ? returnPath : `/${returnPath}`
  const url = new URL(normalized, 'http://local')
  if (!isAuthCompletarSearchParams(url.searchParams)) {
    return normalized
  }
  const nested = url.searchParams.get('next')
  if (nested?.startsWith('/') && !nested.startsWith('//')) {
    return nested
  }
  return ROUTES.DASHBOARD
}
