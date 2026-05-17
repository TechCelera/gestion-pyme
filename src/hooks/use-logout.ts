'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { useAuthStore } from '@/stores/auth-store'

export function useLogout() {
  const router = useRouter()
  const clearUser = useAuthStore((state) => state.clearUser)
  const supabase = createSafeBrowserClient()

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      clearUser()
      toast.success('Sesión cerrada')
      router.push('/login')
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }, [clearUser, router, supabase])

  return { logout }
}
