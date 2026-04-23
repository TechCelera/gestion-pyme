'use client'

import { useEffect, useRef } from 'react'
import { seedCompanyDefaults } from '@/lib/actions/seed'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Componente invisible que siembra cuentas y categorías por defecto
 * en el primer acceso al dashboard de una empresa nueva.
 */
export function SeedOnFirstAccess() {
  const hasRun = useRef(false)
  const isDemoMode = useAuthStore((state) => state.isDemoMode)

  useEffect(() => {
    // No sembrar en modo demo
    if (isDemoMode) return

    // Ejecutar solo una vez por sesión
    if (hasRun.current) return
    hasRun.current = true

    // Verificar si ya se sembró (persistido en localStorage)
    const seededKey = 'gestion-pyme-seeded'
    if (localStorage.getItem(seededKey)) return

    // Llamar al seed
    seedCompanyDefaults().then((result) => {
      if (result.success) {
        localStorage.setItem(seededKey, 'true')
      }
    })
  }, [isDemoMode])

  return null
}
