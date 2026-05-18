import { ROUTES } from '@/lib/constants'

/** Navegación completa para que middleware y RSC lean las cookies de sesión. */
export function navigateAfterAuth(path: string = ROUTES.DASHBOARD): void {
  window.location.assign(path)
}
