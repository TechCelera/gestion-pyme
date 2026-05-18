import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageFilterBarProps = {
  children: ReactNode
  /** Texto auxiliar bajo las pestañas (mismo patrón que /operaciones). */
  hint?: string
  className?: string
}

/** Contenedor estándar para filtros por URL debajo del encabezado de página. */
export function PageFilterBar({ children, hint, className }: PageFilterBarProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
