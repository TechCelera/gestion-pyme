'use client'

import { PageFilterBar } from '@/components/ui/page-filter-bar'
import { PageUrlTabs, pageTabsFromPresets } from '@/components/ui/page-url-tabs'
import {
  REPORTS_PERIOD_PRESETS,
  reportsPeriodHint,
  reportsPeriodHref,
  type ReportsRangeKey,
} from '@/lib/utils/reports-period'

type PeriodPreset = { key: ReportsRangeKey; label: string }

type ReportsPeriodTabsProps = {
  value: ReportsRangeKey
  /** Ruta base sin query de período (ej. `/reportes`, `/proyectos/abc`). */
  basePath: string
  className?: string
  showHint?: boolean
  presets?: ReadonlyArray<PeriodPreset>
}

/** Selector de período reutilizable (informes, análisis por proyecto). */
export function ReportsPeriodTabs({
  value,
  basePath,
  className,
  showHint = true,
  presets = REPORTS_PERIOD_PRESETS,
}: ReportsPeriodTabsProps) {
  const tabs = (
    <PageUrlTabs
      value={value}
      tabs={pageTabsFromPresets(presets)}
      hrefForValue={(next) => reportsPeriodHref(basePath, next as ReportsRangeKey)}
      className={className}
    />
  )

  if (!showHint) return tabs

  return <PageFilterBar hint={reportsPeriodHint(value)}>{tabs}</PageFilterBar>
}
