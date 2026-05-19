import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** Altura estándar de controles en formularios de la app (drawers, páginas). */
export const formControlHeightClass = 'h-10 min-h-10'

/** Botones alineados a inputs en formularios (segmentos, toggles). */
export const formButtonClass = cn(formControlHeightClass, 'px-2 text-sm')

/**
 * Variantes de tamaño para Input y MoneyInput.
 * Usar `controlSize="form"` en formularios de producto; `default` en filtros/tablas compactas.
 */
export const inputControlVariants = cva(
  'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      controlSize: {
        default: 'h-8 py-1',
        form: cn(formControlHeightClass, 'box-border py-0 leading-10'),
      },
    },
    defaultVariants: {
      controlSize: 'default',
    },
  }
)

/** Slot que alinea input y select a la misma altura dentro de FormField. */
export const formFieldControlSlotClass =
  'flex h-10 w-full min-h-10 items-stretch [&_[data-slot=input]]:h-10 [&_[data-slot=input]]:min-h-10 [&_[data-slot=select-trigger]]:h-10 [&_[data-slot=select-trigger]]:min-h-10'
