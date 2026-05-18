/** Tabs en /cuentas (URL ?tab=). */
export type CuentasTabKey = 'accounts' | 'chart'

export function parseCuentasTab(tab: string | null): CuentasTabKey {
  if (tab === 'chart') return 'chart'
  return 'accounts'
}

export function cuentasTabHref(tab: CuentasTabKey): string {
  if (tab === 'accounts') return '/cuentas'
  return '/cuentas?tab=chart'
}
