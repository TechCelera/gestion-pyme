'use client'

import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export type TableRowActionItem = {
  key: string
  label: string
  icon: LucideIcon
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

/** Hasta 3 acciones visibles; con más, menú (evita ⋯ para solo editar/eliminar). */
const MAX_INLINE_ACTIONS = 3

type TableRowActionsProps = {
  actions: TableRowActionItem[]
  className?: string
}

export function TableRowActions({ actions, className }: TableRowActionsProps) {
  const visible = actions.filter((a) => !a.disabled)
  if (visible.length === 0) return null

  if (visible.length > MAX_INLINE_ACTIONS) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              title="Más acciones"
              aria-label="Más acciones"
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {visible.map((action) => (
            <DropdownMenuItem
              key={action.key}
              variant={action.destructive ? 'destructive' : 'default'}
              onClick={action.onClick}
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={cn('inline-flex flex-wrap items-center justify-center gap-1', className)}>
      {visible.map((action) => (
        <Button
          key={action.key}
          variant="ghost"
          size="sm"
          className={action.destructive ? 'text-destructive hover:text-destructive' : undefined}
          onClick={action.onClick}
        >
          <action.icon className="mr-1 h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  )
}
