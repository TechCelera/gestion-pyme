'use client'

import { useRouter } from 'next/navigation'
import { PageTabsBar, type PageTabItem } from '@/components/ui/page-tabs'

type PageUrlTabsProps = {
  value: string
  tabs: PageTabItem[]
  hrefForValue: (value: string) => string
  className?: string
}

/** Pestañas de filtro que sincronizan la URL vía `router.replace` (sin scroll). */
export function PageUrlTabs({ value, tabs, hrefForValue, className }: PageUrlTabsProps) {
  const router = useRouter()

  return (
    <PageTabsBar
      value={value}
      onValueChange={(next) => {
        router.replace(hrefForValue(next), { scroll: false })
      }}
      tabs={tabs}
      className={className}
    />
  )
}

export function pageTabsFromPresets<T extends string>(
  presets: ReadonlyArray<{ key: T; label: string }>
): PageTabItem[] {
  return presets.map(({ key, label }) => ({ value: key, label }))
}
