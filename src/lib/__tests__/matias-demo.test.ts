import { describe, expect, it, vi, afterEach } from 'vitest'

import {
  demoLoginEmailPublic,
  demoLoginPasswordPublic,
  isDemoLoginConfigured,
  isDemoLoginEnabledPublic,
  isDemoLoginPrefilled,
} from '@/lib/demo/matias-demo'

describe('matias-demo', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('demo desactivada por defecto', () => {
    expect(isDemoLoginEnabledPublic()).toBe(false)
    expect(isDemoLoginPrefilled()).toBe(false)
  })

  it('demo con credenciales públicas para prefill en login', () => {
    vi.stubEnv('NEXT_PUBLIC_DEMO_LOGIN_ENABLED', '1')
    vi.stubEnv('NEXT_PUBLIC_DEMO_EMAIL', 'demo@test.com')
    vi.stubEnv('NEXT_PUBLIC_DEMO_PASSWORD', 'secret123')
    expect(isDemoLoginConfigured()).toBe(true)
    expect(isDemoLoginPrefilled()).toBe(true)
    expect(demoLoginEmailPublic()).toBe('demo@test.com')
    expect(demoLoginPasswordPublic()).toBe('secret123')
  })
})
