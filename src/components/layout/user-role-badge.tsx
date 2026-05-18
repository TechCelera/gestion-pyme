'use client'

import { useAuthStore } from '@/stores/auth-store'
import { getUserRoleLabel, isAdminRole } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface UserRoleBadgeProps {
  className?: string
  /** Compact line for sidebar header */
  variant?: 'default' | 'compact'
}

export function UserRoleBadge({ className, variant = 'default' }: UserRoleBadgeProps) {
  const role = useAuthStore((state) => state.role)
  const fullName = useAuthStore((state) => state.fullName)
  if (!role) return null

  const label = getUserRoleLabel(role)
  const isApprover = isAdminRole(role)

  if (variant === 'compact') {
    return (
      <p className={cn('text-xs text-muted-foreground truncate', className)} title={label}>
        {fullName ? `${fullName} · ` : ''}
        <span className={isApprover ? 'text-primary font-medium' : undefined}>{label}</span>
      </p>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-2 text-xs',
        className
      )}
    >
      {fullName ? <span className="text-muted-foreground">{fullName}</span> : null}
      <span
        className={cn(
          'rounded-full px-2 py-0.5 font-medium',
          isApprover
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {label}
      </span>
      {!isApprover ? (
        <span className="text-muted-foreground">
          Puedes crear movimientos; aprobar y anular los hace administración.
        </span>
      ) : null}
    </div>
  )
}
