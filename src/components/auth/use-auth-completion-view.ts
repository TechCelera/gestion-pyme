'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  getAccountCompletionStatus,
  type AccountCompletionPrefill,
} from '@/lib/actions/complete-account'
import { AUTH_COMPLETAR_PARAM, AUTH_COMPLETAR_VALUE } from '@/lib/auth/auth-completion-routes'
import { navigateAfterAuth } from '@/lib/auth/post-auth-navigation'
import { ROUTES } from '@/lib/constants'

export type AuthCompletionView = 'loading' | 'login' | 'complete'

export function useAuthCompletionView(): {
  view: AuthCompletionView
  prefill: AccountCompletionPrefill | null
  nextPath: string
} {
  const searchParams = useSearchParams()
  const completar = searchParams.get(AUTH_COMPLETAR_PARAM) === AUTH_COMPLETAR_VALUE
  const nextPath = useMemo(() => {
    const next = searchParams.get('next') ?? ROUTES.DASHBOARD
    return next.startsWith('/') && !next.startsWith('//') ? next : ROUTES.DASHBOARD
  }, [searchParams])

  const [view, setView] = useState<AuthCompletionView>('loading')
  const [prefill, setPrefill] = useState<AccountCompletionPrefill | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const result = await getAccountCompletionStatus()
      if (cancelled) return

      if (!result.success || !result.data) {
        setView('login')
        return
      }

      const { needsCompletion, prefill: completionPrefill } = result.data

      if (needsCompletion && completionPrefill) {
        setPrefill(completionPrefill)
        setView('complete')
        return
      }

      if (completar && !needsCompletion) {
        navigateAfterAuth(nextPath)
        return
      }

      setView('login')
    })()

    return () => {
      cancelled = true
    }
  }, [completar, nextPath])

  return { view, prefill, nextPath }
}
