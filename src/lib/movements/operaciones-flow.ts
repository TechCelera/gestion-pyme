/** Filtros de listado en /operaciones (URL ?flujo=). */
export type OperacionesFlowKey = 'all' | 'ingresos' | 'egresos'

const INGRESO_ALIASES = new Set(['ingresos', 'ventas'])
const EGRESO_ALIASES = new Set(['egresos', 'compras'])

export function parseOperacionesFlow(flujo: string | null): OperacionesFlowKey {
  if (flujo && INGRESO_ALIASES.has(flujo)) return 'ingresos'
  if (flujo && EGRESO_ALIASES.has(flujo)) return 'egresos'
  return 'all'
}

export function operacionesFlowToTypeFilter(
  flow: OperacionesFlowKey
): ('income' | 'expense')[] | undefined {
  if (flow === 'ingresos') return ['income']
  if (flow === 'egresos') return ['expense']
  return undefined
}

export function operacionesFlowHref(flow: OperacionesFlowKey): string {
  if (flow === 'all') return '/operaciones'
  return `/operaciones?flujo=${flow}`
}

export const OPERACIONES_FLOW_TABS: { key: OperacionesFlowKey; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'ingresos', label: 'Ingresos' },
  { key: 'egresos', label: 'Egresos' },
]

export function operacionesFlowHint(flow: OperacionesFlowKey): string {
  switch (flow) {
    case 'ingresos':
      return 'Plata que entró a tu empresa.'
    case 'egresos':
      return 'Plata que salió de tu empresa.'
    default:
      return 'Ingresos, egresos y transferencias en un solo listado.'
  }
}
