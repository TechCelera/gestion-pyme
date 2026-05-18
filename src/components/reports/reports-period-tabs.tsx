'use client'

import { PageFilterBar } from '@/components/ui/page-filter-bar'
import { PageUrlTabs, pageTabsFromPresets } from '@/components/ui/page-url-tabs'
import {
  REPORTS_PERIOD_PRESETS,
  reportsPeriodHint,
  reportsPeriodHref,
  type ReportsRangeKey,
} from '@/lib/utils/reports-period'

const PERIOD_TABS = pageTabsFromPresets(REPORTS_PERIOD_PRESETS)

type ReportsPeriodTabsProps = {
  value: ReportsRangeKey
  /** Ruta base sin query de período (ej. `/reportes`, `/proyectos/abc`). */
  basePath: string
  className?: string
  showHint?: boolean
}

/** Selector de período reutilizable (informes, análisis por proyecto). */
export function ReportsPeriodTabs({
  value,
  basePath,
  className,
  showHint = true,
}: ReportsPeriodTabsProps) {
  const tabs = (
    <PageUrlTabs
      value={value}
      tabs={PERIOD_TABS}
      hrefForValue={(next) => reportsPeriodHref(basePath, next as ReportsRangeKey)}
      className={className}
    />
  )

  if (!showHint) return tabs

  return <PageFilterBar hint={reportsPeriodHint(value)}>{tabs}</PageFilterBar>
}
