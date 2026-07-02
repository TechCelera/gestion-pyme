import { hasSupabasePublicEnv } from './auth'

function readCredential(
  primaryEmail: string | undefined,
  fallbackEmail: string,
  primaryPassword: string | undefined,
  fallbackPassword: string
): { email: string; password: string } | null {
  const email = (primaryEmail ?? fallbackEmail).trim()
  const password = (primaryPassword ?? fallbackPassword).trim()
  if (!email || !password) return null
  return { email, password }
}

export function matiasAdminCredentials(): { email: string; password: string } | null {
  return readCredential(
    process.env.E2E_MATIAS_ADMIN_EMAIL ?? process.env.DEMO_EMAIL,
    'matias-demo@gestion-pyme.app',
    process.env.E2E_MATIAS_ADMIN_PASSWORD ?? process.env.DEMO_PASSWORD,
    'DemoMatias2026!'
  )
}

export function matiasOperatorCredentials(): { email: string; password: string } | null {
  return readCredential(
    process.env.E2E_MATIAS_OPERATOR_EMAIL ?? process.env.DEMO_OPERATOR_EMAIL,
    'operador-matias-demo@gestion-pyme.app',
    process.env.E2E_MATIAS_OPERATOR_PASSWORD ?? process.env.DEMO_OPERATOR_PASSWORD,
    'DemoMatias2026!'
  )
}

export function hasMatiasDemoCredentials(): boolean {
  return Boolean(
    hasSupabasePublicEnv() && matiasAdminCredentials() && matiasOperatorCredentials()
  )
}
