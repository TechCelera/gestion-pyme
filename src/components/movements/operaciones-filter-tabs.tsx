'use client'

import { ArrowDownLeft, ArrowUpRight, LayoutList } from 'lucide-react'
import { PageFilterBar } from '@/components/ui/page-filter-bar'
import type { PageTabItem } from '@/components/ui/page-tabs'
import { PageUrlTabs } from '@/components/ui/page-url-tabs'
import {
  operacionesFlowHint,
  operacionesFlowHref,
  type OperacionesFlowKey,
} from '@/lib/movements/operaciones-flow'

const FLOW_TABS: PageTabItem[] = [
  { value: 'all', label: 'Todo', icon: LayoutList },
  { value: 'ingresos', label: 'Ingresos', icon: ArrowDownLeft },
  { value: 'egresos', label: 'Egresos', icon: ArrowUpRight },
]

type OperacionesFilterTabsProps = {
  value: OperacionesFlowKey
}

export function OperacionesFilterTabs({ value }: OperacionesFilterTabsProps) {
  return (
    <PageFilterBar hint={operacionesFlowHint(value)}>
      <PageUrlTabs
        value={value}
        tabs={FLOW_TABS}
        hrefForValue={(next) => operacionesFlowHref(next as OperacionesFlowKey)}
      />
    </PageFilterBar>
  )
}
