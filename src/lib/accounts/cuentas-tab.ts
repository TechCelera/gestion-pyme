/** Tabs en /cuentas (URL ?tab=). */
export type CuentasTabKey = 'accounts' | 'chart'

export const CUENTAS_TAB_PRESETS: ReadonlyArray<{ key: CuentasTabKey; label: string }> = [
  { key: 'accounts', label: 'Cuentas' },
  { key: 'chart', label: 'Plan de cuentas' },
]

export function parseCuentasTab(tab: string | null): CuentasTabKey {
  if (tab === 'chart') return 'chart'
  return 'accounts'
}

export function cuentasTabHref(tab: CuentasTabKey): string {
  if (tab === 'accounts') return '/cuentas'
  return '/cuentas?tab=chart'
}

export function cuentasTabHint(tab: CuentasTabKey): string {
  switch (tab) {
    case 'chart':
      return 'Estructura contable de la empresa con saldos al día (solo lectura).'
    default:
      return 'Caja, bancos y demás cuentas que usas en movimientos del día a día.'
  }
}
