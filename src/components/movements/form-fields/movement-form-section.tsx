import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type MovementFormSectionProps = {
  children: ReactNode
  className?: string
  heading?: string
  description?: string
}

/** Bloque visual estándar del formulario guiado de operaciones. */
export function MovementFormSection({
  children,
  className,
  heading,
  description,
}: MovementFormSectionProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-border/80 bg-muted/20 p-3 space-y-3',
        className
      )}
    >
      {heading ? (
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
