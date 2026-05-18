'use client'

import { Check, Circle } from 'lucide-react'

import { getPasswordChecks } from '@/lib/auth/password-strength'
import { cn } from '@/lib/utils'

type PasswordStrengthHintProps = {
  password: string
  className?: string
}

export function PasswordStrengthHint({ password, className }: PasswordStrengthHintProps) {
  if (!password) return null

  const checks = getPasswordChecks(password)

  return (
    <ul
      className={cn('space-y-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-xs', className)}
      aria-live="polite"
    >
      {checks.map((check) => (
        <li key={check.id} className="flex items-center gap-2">
          {check.met ? (
            <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <Circle className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
          )}
          <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>{check.label}</span>
        </li>
      ))}
    </ul>
  )
}
