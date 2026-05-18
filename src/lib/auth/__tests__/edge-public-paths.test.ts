import { describe, expect, it } from 'vitest'

import { isPublicAuthPath, shouldBypassEdgeAuth } from '@/lib/auth/edge-public-paths'

describe('shouldBypassEdgeAuth', () => {
  it('deja pasar manifest y favicon sin auth', () => {
    expect(shouldBypassEdgeAuth('/manifest.json')).toBe(true)
    expect(shouldBypassEdgeAuth('/manifest.webmanifest')).toBe(true)
    expect(shouldBypassEdgeAuth('/favicon.ico')).toBe(true)
  })

  it('deja pasar iconos estáticos y rutas metadata de Next', () => {
    expect(shouldBypassEdgeAuth('/icon.svg')).toBe(true)
    expect(shouldBypassEdgeAuth('/icons/icon-192x192.png')).toBe(true)
    expect(shouldBypassEdgeAuth('/icon')).toBe(true)
    expect(shouldBypassEdgeAuth('/apple-icon')).toBe(true)
  })

  it('no bypass en rutas de app protegidas', () => {
    expect(shouldBypassEdgeAuth('/configuracion')).toBe(false)
    expect(shouldBypassEdgeAuth('/dashboard')).toBe(false)
  })
})

describe('isPublicAuthPath', () => {
  it('incluye flujos de recuperación de contraseña', () => {
    expect(isPublicAuthPath('/recuperar-contrasena')).toBe(true)
    expect(isPublicAuthPath('/nueva-contrasena')).toBe(true)
    expect(isPublicAuthPath('/auth/callback')).toBe(true)
  })
})
