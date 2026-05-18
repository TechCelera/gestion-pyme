/** Filtros de listado en /categorias (URL ?tipo=). */
export type CategoriasFilterKey = 'all' | 'income' | 'expense'

export function parseCategoriasFilter(tipo: string | null): CategoriasFilterKey {
  if (tipo === 'income' || tipo === 'expense') return tipo
  return 'all'
}

export function categoriasFilterHref(filter: CategoriasFilterKey): string {
  if (filter === 'all') return '/categorias'
  return `/categorias?tipo=${filter}`
}
