'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { clearDemoCookie } from '@/lib/actions/demo-cookie'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { useAuthStore } from '@/stores/auth-store'

export function useLogout() {
  const router = useRouter()
  const isDemoMode = useAuthStore((state) => state.isDemoMode)
  const clearUser = useAuthStore((state) => state.clearUser)
  const supabase = createSafeBrowserClient()

  const logout = useCallback(async () => {
    try {
      await clearDemoCookie().catch(() => {})

      if (!isDemoMode) {
        await supabase.auth.signOut()
      }

      clearUser()
      toast.success(isDemoMode ? 'Sesión demo cerrada' : 'Sesión cerrada')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }, [clearUser, isDemoMode, router, supabase])

  return { logout, isDemoMode }
}
