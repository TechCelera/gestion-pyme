'use client'

import { useEffect } from 'react'
import { createSafeBrowserClient } from '@/lib/supabase/client-safe'
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

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = session.user
        setUser({
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name || '',
          role: user.user_metadata?.role || 'vendedor',
          companyId: user.user_metadata?.company_id || '',
        })
        return
      }
      if (hasDemoModeCookie()) {
        setDemoUser()
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const user = session.user
        setUser({
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name || '',
          role: user.user_metadata?.role || 'vendedor',
          companyId: user.user_metadata?.company_id || '',
        })
      } else if (hasDemoModeCookie() || useAuthStore.getState().isDemoMode) {
        setDemoUser()
      } else {
        clearUser()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setDemoUser, clearUser, supabase])

  return <>{children}</>
}