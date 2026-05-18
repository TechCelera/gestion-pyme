import type { LucideIcon } from 'lucide-react'
import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChartEmptyStateProps {
  title?: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export function ChartEmptyState({
  title = 'No hay datos para mostrar',
  description = 'Cuando registres movimientos en este período, verás el gráfico aquí.',
  icon: Icon = BarChart3,
  className,
}: ChartEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
