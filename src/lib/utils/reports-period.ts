import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  subMonths,
  subQuarters,
} from 'date-fns'

export const REPORTS_RANGE_KEYS = [
  'hoy',
  'esta_semana',
  'mes',
  'mes_anterior',
  'trimestre',
  'trim_anterior',
] as const
export type ReportsRangeKey = (typeof REPORTS_RANGE_KEYS)[number]

export const REPORTS_PERIOD_PRESETS: ReadonlyArray<{ key: ReportsRangeKey; label: string }> = [
  { key: 'mes', label: 'Este mes' },
  { key: 'mes_anterior', label: 'Mes anterior' },
  { key: 'trimestre', label: 'Este trimestre' },
  { key: 'trim_anterior', label: 'Trimestre anterior' },
]

export const DISTRIBUIDORA_REPORTS_PERIOD_PRESETS: ReadonlyArray<{
  key: ReportsRangeKey
  label: string
}> = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'esta_semana', label: 'Esta semana' },
  ...REPORTS_PERIOD_PRESETS,
]

const WEEK_OPTS = { weekStartsOn: 1 as const }

function isReportsRangeKey(v: string | null | undefined): v is ReportsRangeKey {
  return v !== undefined && v !== null && (REPORTS_RANGE_KEYS as readonly string[]).includes(v)
}

/** Preset de URL `?rango=` para informes y análisis por proyecto. */
export function parseReportsRange(preset: string | null | undefined): ReportsRangeKey {
  return isReportsRangeKey(preset) ? preset : 'mes'
}

/** Ruta con query `rango` omitida cuando el preset es el mes actual. */
export function reportsPeriodHref(basePath: string, key: ReportsRangeKey): string {
  if (key === 'mes') return basePath
  const separator = basePath.includes('?') ? '&' : '?'
  return `${basePath}${separator}rango=${key}`
}

/** Rango de fechas para informes (presets alineados a §16 DECISIONES). */
export function resolveReportsPeriod(
  preset: string | null | undefined,
  reference = new Date()
): { start: Date; end: Date; key: ReportsRangeKey } {
  const key: ReportsRangeKey = isReportsRangeKey(preset) ? preset : 'mes'

  switch (key) {
    case 'hoy':
      return { start: startOfDay(reference), end: endOfDay(reference), key }
    case 'esta_semana':
      return {
        start: startOfWeek(reference, WEEK_OPTS),
        end: endOfWeek(reference, WEEK_OPTS),
        key,
      }
    case 'mes_anterior': {
      const ref = subMonths(reference, 1)
      return { start: startOfMonth(ref), end: endOfMonth(ref), key }
    }
    case 'trimestre':
      return { start: startOfQuarter(reference), end: endOfQuarter(reference), key }
    case 'trim_anterior': {
      const ref = subQuarters(reference, 1)
      return { start: startOfQuarter(ref), end: endOfQuarter(ref), key }
    }
    default:
      return {
        start: startOfMonth(reference),
        end: endOfMonth(reference),
        key: 'mes',
      }
  }
}

export function reportsPeriodHint(key: ReportsRangeKey): string {
  switch (key) {
    case 'hoy':
      return 'Movimientos aprobados del día de hoy.'
    case 'esta_semana':
      return 'Semana calendario en curso (lun–dom).'
    case 'mes_anterior':
      return 'Mes calendario anterior completo.'
    case 'trimestre':
      return 'Trimestre civil en curso.'
    case 'trim_anterior':
      return 'Trimestre civil anterior completo.'
    default:
      return 'Mes calendario en curso.'
  }
}

export function formatReportsPeriodLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()
  if (sameMonth) {
    return start.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }
  return `${start.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`
}
