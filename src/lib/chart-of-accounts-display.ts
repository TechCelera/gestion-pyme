/** Solo estilos por raíz del plan (código 1–5). Nombres y saldos vienen de la BD. */

const CHART_ROOT_ACCENT: Record<string, string> = {
  '1': 'border-l-blue-500 bg-blue-500/5',
  '2': 'border-l-amber-500 bg-amber-500/5',
  '3': 'border-l-violet-500 bg-violet-500/5',
  '4': 'border-l-green-500 bg-green-500/5',
  '5': 'border-l-red-500 bg-red-500/5',
}

export function chartAccentClassForRootCode(code: string): string {
  const root = code.split('.')[0] ?? code
  return CHART_ROOT_ACCENT[root] ?? 'border-l-muted bg-muted/20'
}
