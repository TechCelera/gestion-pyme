'use client'

import { useEffect } from 'react'
import { categorizeError, type CategorizedError } from '@/lib/utils/errors'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error('Dashboard error boundary caught:', error)
  }, [error])

  const categorized: CategorizedError = categorizeError(error)
  const isAuthError = categorized.category === 'auth'

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6" role="alert" aria-live="assertive">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 flex justify-center">
          {isAuthError ? (
            <svg
              className="h-14 w-14 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          ) : (
            <svg
              className="h-14 w-14 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          )}
        </div>

        <h2 className="mb-2 text-lg font-semibold text-foreground">
          {isAuthError ? 'Sesión expirada' : 'Error al cargar datos'}
        </h2>

        <p className="mb-2 text-sm text-muted-foreground">
          {categorized.message}
        </p>

        <p className="mb-6 text-xs text-muted-foreground">
          {categorized.action}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-[#7B68EE] focus:ring-offset-2"
            autoFocus
          >
            Reintentar
          </button>

          {isAuthError && (
            <a
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-md bg-[#7B68EE] px-4 py-2 text-sm font-medium text-white hover:bg-[#7B68EE]/90 focus:outline-none focus:ring-2 focus:ring-[#7B68EE] focus:ring-offset-2"
            >
              Iniciar sesión
            </a>
          )}
        </div>

        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            ID de referencia: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}