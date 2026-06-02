import { describe, it, expect } from 'vitest'
import type { User } from '@supabase/supabase-js'

import {
  DEFAULT_BOOTSTRAP_COMPANY_NAME,
  needsProfileCompletionFromUser,
  resolveCompanyNeedsCompletion,
  resolvePostAuthPath,
} from '@/lib/auth/profile-completion'
import { ROUTES } from '@/lib/constants'

function userWithMeta(meta: Record<string, unknown>): User {
  return {
    id: 'u1',
    app_metadata: {},
    user_metadata: meta,
    aud: 'authenticated',
    created_at: '',
  } as User
}

describe('needsProfileCompletionFromUser', () => {
  it('no requiere si profile_completed es true', () => {
    expect(
      needsProfileCompletionFromUser(userWithMeta({ profile_completed: true }))
    ).toBe(false)
  })

  it('no requiere si company_name real está en metadata', () => {
    expect(
      needsProfileCompletionFromUser(
        userWithMeta({ company_name: 'Acme SAS', profile_completed: false })
      )
    ).toBe(false)
  })

  it('requiere si falta company_name y no completó perfil', () => {
    expect(needsProfileCompletionFromUser(userWithMeta({ country: 'AR' }))).toBe(true)
  })
})

describe('resolveCompanyNeedsCompletion', () => {
  it('marca incompleto con nombre por defecto del trigger', () => {
    expect(resolveCompanyNeedsCompletion(DEFAULT_BOOTSTRAP_COMPANY_NAME)).toBe(true)
  })

  it('marca completo con nombre real', () => {
    expect(resolveCompanyNeedsCompletion('Mi Negocio')).toBe(false)
  })
})

describe('resolvePostAuthPath', () => {
  it('envía a login con completar inline si falta perfil', () => {
    expect(resolvePostAuthPath(true, ROUTES.DASHBOARD, 'login')).toBe(
      `${ROUTES.LOGIN}?completar=1`
    )
  })

  it('envía a registro con completar inline si falta perfil', () => {
    expect(resolvePostAuthPath(true, ROUTES.DASHBOARD, 'register')).toBe(
      `${ROUTES.REGISTER}?completar=1`
    )
  })

  it('respeta next si el perfil está listo', () => {
    expect(resolvePostAuthPath(false, '/operaciones?flujo=ingresos')).toBe(
      '/operaciones?flujo=ingresos'
    )
  })
})
