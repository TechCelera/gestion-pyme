'use client'

import type { ComponentType, ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type PageTabItem = {
  value: string
  label: string
  icon?: ComponentType<{ className?: string }>
}

export const pageTabsListClassName =
  'h-auto w-full flex-wrap justify-start gap-1 sm:w-auto'

export const pageTabsTriggerClassName = 'gap-2 sm:flex-none'

function PageTabsListInner({ tabs }: { tabs: PageTabItem[] }) {
  return (
    <TabsList className={pageTabsListClassName}>
      {tabs.map(({ value: tabValue, label, icon: Icon }) => (
        <TabsTrigger key={tabValue} value={tabValue} className={pageTabsTriggerClassName}>
          {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}

type PageTabsBaseProps = {
  value: string
  onValueChange: (value: string) => void
  tabs: PageTabItem[]
  className?: string
}

/** Solo la barra (filtros URL, etc.). */
export function PageTabsBar({ value, onValueChange, tabs, className }: PageTabsBaseProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn('gap-0', className)}>
      <PageTabsListInner tabs={tabs} />
    </Tabs>
  )
}

/** Pestañas con paneles debajo. */
export function PageTabs({ value, onValueChange, tabs, className, children }: PageTabsBaseProps & {
  children?: ReactNode
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn('space-y-4', className)}>
      <PageTabsListInner tabs={tabs} />
      {children}
    </Tabs>
  )
}

export { TabsContent as PageTabsContent }
