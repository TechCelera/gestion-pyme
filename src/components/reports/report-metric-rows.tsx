import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function ReportMetricRows({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('divide-y divide-border/60 text-sm', className)}>{children}</div>
}

export function ReportMetricRow({
  label,
  value,
  valueClassName,
  emphasize,
}: {
  label: string
  value: ReactNode
  valueClassName?: string
  emphasize?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0',
        emphasize && 'font-medium'
      )}
    >
      <span className={cn('shrink-0', emphasize ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span className={cn('tabular-nums text-right', valueClassName)}>{value}</span>
    </div>
  )
}

export function ReportMetricSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="pt-3 border-t border-border/60">
      <p className="text-sm font-medium mb-2">{title}</p>
      {children}
    </div>
  )
}
