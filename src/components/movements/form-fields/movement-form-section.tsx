import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type MovementFormSectionProps = {
  children: ReactNode
  className?: string
}

/** Bloque visual estándar del formulario guiado de operaciones. */
export function MovementFormSection({ children, className }: MovementFormSectionProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border/80 bg-muted/20 p-3 space-y-3',
        className
      )}
    >
      {children}
    </section>
  )
}
