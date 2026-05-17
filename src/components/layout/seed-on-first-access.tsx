'use client'

import { useEffect, useRef } from 'react'
import { seedCompanyDefaults } from '@/lib/actions/seed'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Si la empresa no tiene cuentas/categorías, crea el mínimo por país (Caja, banco, ingresos/gastos típicos).
 * Idempotente: no duplica por nombre.
 */
export function SeedOnFirstAccess() {
  const ran = useRef(false)
  const isDemoMode = useAuthStore((state) => state.isDemoMode)

  useEffect(() => {
    if (isDemoMode || ran.current) return
    ran.current = true

    void seedCompanyDefaults()
  }, [isDemoMode])

  return null
}
