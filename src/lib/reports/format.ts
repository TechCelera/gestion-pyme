export { formatReportCurrency } from '@/lib/format/currency'

export function formatReportMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
}
