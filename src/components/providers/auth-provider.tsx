'use client'

import { useEffect } from 'react'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { hydrateAuthStoreUser } from '@/lib/auth/hydrate-auth-user'
import { useAuthStore } from '@/stores/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clearUser)

  useEffect(() => {
    const supabase = createSafeBrowserClient()
    let cancelled = false

    async function applySession(session: Awaited<
      ReturnType<typeof supabase.auth.getSession>
    >['data']['session']) {
      if (cancelled) return

      if (session?.user) {
        try {
          const storeUser = await hydrateAuthStoreUser(session)
          if (!cancelled) setUser(storeUser)
        } catch {
          if (!cancelled) clearUser()
        }
        return
      }

      clearUser()
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setUser, clearUser])

  return <>{children}</>
}
