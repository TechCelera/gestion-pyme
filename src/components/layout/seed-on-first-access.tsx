'use client'

import { useEffect, useRef } from 'react'
import { seedCompanyDefaults } from '@/lib/actions/seed'
/**
 * Si la empresa no tiene cuentas/categorías, crea el mínimo por país (Caja, banco, ingresos/gastos típicos).
 * Idempotente: no duplica por nombre.
 */
export function SeedOnFirstAccess() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    void seedCompanyDefaults()
  }, [])

  return null
}
