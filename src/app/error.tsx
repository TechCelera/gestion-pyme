'use client'

import { useEffect } from 'react'
import { categorizeError, type CategorizedError } from '@/lib/utils/errors'

interface RootErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error('Root error boundary caught:', error)
  }, [error])

  const categorized: CategorizedError = categorizeError(error)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div
        className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-lg"
        role="alert"
        aria-live="assertive"
      >
        <div className="mb-4 flex justify-center">
          <svg
            className="h-16 w-16 text-destructive"
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
        </div>

        <h1 className="mb-2 text-xl font-bold text-foreground">
          Algo salió mal
        </h1>

        <p className="mb-2 text-sm text-muted-foreground">
          {categorized.message}
        </p>

        {categorized.category !== 'unknown' && (
          <p className="mb-6 text-xs text-muted-foreground">
            {categorized.action}
          </p>
        )}

        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-[#7B68EE] px-4 py-2 text-sm font-medium text-white hover:bg-[#7B68EE]/90 focus:outline-none focus:ring-2 focus:ring-[#7B68EE] focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#7B68EE]"
          autoFocus
        >
          Reintentar
        </button>

        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            ID de error: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}