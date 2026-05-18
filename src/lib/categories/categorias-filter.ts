/** Filtros de listado en /categorias (URL ?tipo=). */
export type CategoriasFilterKey = 'all' | 'income' | 'expense'

export const CATEGORIAS_FILTER_PRESETS: ReadonlyArray<{ key: CategoriasFilterKey; label: string }> =
  [
    { key: 'all', label: 'Todas' },
    { key: 'income', label: 'Ingresos' },
    { key: 'expense', label: 'Gastos' },
  ]

export function parseCategoriasFilter(tipo: string | null): CategoriasFilterKey {
  if (tipo === 'income' || tipo === 'expense') return tipo
  return 'all'
}

export function categoriasFilterHref(filter: CategoriasFilterKey): string {
  if (filter === 'all') return '/categorias'
  return `/categorias?tipo=${filter}`
}

export function categoriasFilterHint(filter: CategoriasFilterKey): string {
  switch (filter) {
    case 'income':
      return 'Solo categorías que clasifican ingresos en informes.'
    case 'expense':
      return 'Solo categorías que clasifican gastos en informes.'
    default:
      return 'Todas las categorías de ingreso y gasto.'
  }
}
