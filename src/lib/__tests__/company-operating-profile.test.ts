import { describe, expect, it } from 'vitest'

import {
  isDistribuidoraProfile,
  normalizeOperatingProfile,
} from '@/lib/company-operating-profile'

describe('company-operating-profile', () => {
  it('normalizeOperatingProfile usa default si falta o es inválido', () => {
    expect(normalizeOperatingProfile(undefined)).toBe('default')
    expect(normalizeOperatingProfile(null)).toBe('default')
    expect(normalizeOperatingProfile('')).toBe('default')
    expect(normalizeOperatingProfile('erp')).toBe('default')
  })

  it('normalizeOperatingProfile acepta distribuidora case-insensitive', () => {
    expect(normalizeOperatingProfile('distribuidora')).toBe('distribuidora')
    expect(normalizeOperatingProfile('Distribuidora')).toBe('distribuidora')
  })

  it('isDistribuidoraProfile', () => {
    expect(isDistribuidoraProfile('distribuidora')).toBe(true)
    expect(isDistribuidoraProfile('default')).toBe(false)
  })
})
