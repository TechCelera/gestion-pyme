'use client'

import { useEffect } from 'react'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
import { hydrateAuthStoreUser } from '@/lib/auth/hydrate-auth-user'
import { useAuthStore } from '@/stores/auth-store'
import { hasDemoModeCookie } from '@/lib/demo-mode-client'

function syncDemoFromCookie(): void {
  if (hasDemoModeCookie() && !useAuthStore.getState().isDemoMode) {
    useAuthStore.getState().setDemoUser()
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser)
  const setDemoUser = useAuthStore((state) => state.setDemoUser)
  const clearUser = useAuthStore((state) => state.clearUser)

  const supabase = createSafeBrowserClient()

  useEffect(() => {
    syncDemoFromCookie()

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

      if (hasDemoModeCookie()) {
        setDemoUser()
      } else {
        clearUser()
      }
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
  }, [setUser, setDemoUser, clearUser, supabase])

  return <>{children}</>
}
