'use client'

import { ArrowDownLeft, ArrowUpRight, LayoutList } from 'lucide-react'
import { PageFilterBar } from '@/components/ui/page-filter-bar'
import type { PageTabItem } from '@/components/ui/page-tabs'
import { PageUrlTabs } from '@/components/ui/page-url-tabs'
import {
  categoriasFilterHint,
  categoriasFilterHref,
  type CategoriasFilterKey,
} from '@/lib/categories/categorias-filter'

const FILTER_TABS: PageTabItem[] = [
  { value: 'all', label: 'Todas', icon: LayoutList },
  { value: 'income', label: 'Ingresos', icon: ArrowDownLeft },
  { value: 'expense', label: 'Gastos', icon: ArrowUpRight },
]

type CategoriasFilterTabsProps = {
  value: CategoriasFilterKey
}

export function CategoriasFilterTabs({ value }: CategoriasFilterTabsProps) {
  return (
    <PageFilterBar hint={categoriasFilterHint(value)}>
      <PageUrlTabs
        value={value}
        tabs={FILTER_TABS}
        hrefForValue={(next) => categoriasFilterHref(next as CategoriasFilterKey)}
      />
    </PageFilterBar>
  )
}
