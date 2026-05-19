import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { formFieldControlSlotClass } from '@/components/ui/form-control-styles'
import { cn } from '@/lib/utils'

export type FormFieldProps = {
  label: ReactNode
  htmlFor?: string
  hint?: ReactNode
  error?: ReactNode
  children: ReactNode
  className?: string
  /** Fija altura del slot para alinear input + select en la misma fila. */
  alignControl?: boolean
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  alignControl = false,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5 min-w-0', className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium leading-tight">
        {label}
      </Label>
      {alignControl ? (
        <div className={formFieldControlSlotClass}>{children}</div>
      ) : (
        children
      )}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
