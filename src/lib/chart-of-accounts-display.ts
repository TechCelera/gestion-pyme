/** Copy de producto para el plan de cuentas (solo lectura en UI). */

export type ChartSectionMeta = {
  code: string
  title: string
  description: string
  /** Clases Tailwind para borde / fondo de la sección */
  accentClass: string
}

export const CHART_ROOT_SECTIONS: ChartSectionMeta[] = [
  {
    code: '1',
    title: 'Activo',
    description:
      'Recursos de la empresa: efectivo en caja o banco, y lo que te deben clientes u otros.',
    accentClass: 'border-l-blue-500 bg-blue-500/5',
  },
  {
    code: '2',
    title: 'Pasivo',
    description: 'Obligaciones con terceros: principalmente lo que debés a proveedores.',
    accentClass: 'border-l-amber-500 bg-amber-500/5',
  },
  {
    code: '3',
    title: 'Patrimonio',
    description: 'Capital y resultados acumulados: el “valor neto” de la empresa en libros.',
    accentClass: 'border-l-violet-500 bg-violet-500/5',
  },
  {
    code: '4',
    title: 'Ingresos',
    description:
      'Ventas y cobros por actividad. Tus categorías de ingreso en movimientos se enlazan aquí.',
    accentClass: 'border-l-green-500 bg-green-500/5',
  },
  {
    code: '5',
    title: 'Egresos',
    description:
      'Gastos y pagos del negocio. Tus categorías de gasto en movimientos se enlazan aquí.',
    accentClass: 'border-l-red-500 bg-red-500/5',
  },
]

export function chartSectionForRootCode(code: string): ChartSectionMeta | undefined {
  const root = code.split('.')[0]
  return CHART_ROOT_SECTIONS.find((s) => s.code === root)
}
