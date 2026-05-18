import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthShell({ title, description, children, footer, className }: AuthShellProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen items-center justify-center bg-background p-4',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
        aria-hidden
      />
      <Card className="relative w-full max-w-md border-border/80 shadow-lg">
        <CardHeader className="space-y-3 pb-2 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-sm font-bold tracking-tight text-primary">
            GP
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold text-primary">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-balance">{description}</CardDescription>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {footer ? <div className="border-t border-border/60 pt-4">{footer}</div> : null}
        </CardContent>
      </Card>
    </div>
  )
}
