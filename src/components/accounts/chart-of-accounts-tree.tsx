'use client'

import type { ChartAccountRow } from '@/lib/actions/chart-of-accounts'

function typeLabel(t: string): string {
  switch (t) {
    case 'asset':
      return 'Activo'
    case 'liability':
      return 'Pasivo'
    case 'equity':
      return 'Patrimonio'
    case 'income':
      return 'Ingreso'
    case 'expense':
      return 'Egreso'
    default:
      return t
  }
}

function Row({
  node,
  byParent,
  depth,
}: {
  node: ChartAccountRow
  byParent: Map<string | null, ChartAccountRow[]>
  depth: number
}) {
  const children = byParent.get(node.id) ?? []
  return (
    <>
      <div
        className="flex gap-2 py-1 border-b border-border/60 text-sm"
        style={{ paddingLeft: depth * 16 }}
      >
        <span className="font-mono text-muted-foreground w-24 shrink-0">{node.code}</span>
        <span className="flex-1">{node.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">{typeLabel(node.accountType)}</span>
      </div>
      {children.map((c) => (
        <Row key={c.id} node={c} byParent={byParent} depth={depth + 1} />
      ))}
    </>
  )
}

export function ChartOfAccountsTree({ rows }: { rows: ChartAccountRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No hay plan de cuentas cargado.</p>
  }
  const byParent = new Map<string | null, ChartAccountRow[]>()
  for (const r of rows) {
    const key = r.parentId
    const list = byParent.get(key) ?? []
    list.push(r)
    byParent.set(key, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
  }
  const roots = byParent.get(null) ?? []
  return (
    <div className="rounded-lg border bg-card p-4 max-h-[560px] overflow-y-auto">
      <p className="text-xs text-muted-foreground mb-3">
        Solo lectura — mapa contable de la empresa.
      </p>
      {roots.map((n) => (
        <Row key={n.id} node={n} byParent={byParent} depth={0} />
      ))}
    </div>
  )
}
