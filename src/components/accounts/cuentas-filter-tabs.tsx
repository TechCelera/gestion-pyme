'use client'

import { BookOpen, Wallet } from 'lucide-react'
import { PageFilterBar } from '@/components/ui/page-filter-bar'
import type { PageTabItem } from '@/components/ui/page-tabs'
import { PageUrlTabs } from '@/components/ui/page-url-tabs'
import { cuentasTabHint, cuentasTabHref, type CuentasTabKey } from '@/lib/accounts/cuentas-tab'

const TAB_ITEMS: PageTabItem[] = [
  { value: 'accounts', label: 'Cuentas', icon: Wallet },
  { value: 'chart', label: 'Plan de cuentas', icon: BookOpen },
]

type CuentasFilterTabsProps = {
  value: CuentasTabKey
}

export function CuentasFilterTabs({ value }: CuentasFilterTabsProps) {
  return (
    <PageFilterBar hint={cuentasTabHint(value)}>
      <PageUrlTabs
        value={value}
        tabs={TAB_ITEMS}
        hrefForValue={(next) => cuentasTabHref(next as CuentasTabKey)}
      />
    </PageFilterBar>
  )
}
