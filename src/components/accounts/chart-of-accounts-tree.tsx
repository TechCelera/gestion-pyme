'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Info, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import {
  formatChartBalance,
  rollupChartBalances,
  type ChartAccountWithBalance,
} from '@/lib/chart-of-accounts-balances'
import { CHART_ROOT_SECTIONS, chartSectionForRootCode } from '@/lib/chart-of-accounts-display'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface ChartOfAccountsTreeProps {
  rows: ChartAccountWithBalance[]
  currency: string
  asOf: string
  isDemo?: boolean
}

function buildChildrenMap(rows: ChartAccountWithBalance[]) {
  const byParent = new Map<string | null, ChartAccountWithBalance[]>()
  for (const r of rows) {
    const list = byParent.get(r.parentId) ?? []
    list.push(r)
    byParent.set(r.parentId, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code))
  }
  return byParent
}

function countPostableUnderRoot(rootCode: string, rows: ChartAccountWithBalance[]): number {
  return rows.filter(
    (r) => r.isPostable && (r.code === rootCode || r.code.startsWith(`${rootCode}.`))
  ).length
}

function BalanceCell({
  amount,
  currency,
  emphasize,
}: {
  amount: number
  currency: string
  emphasize?: boolean
}) {
  const isZero = Math.abs(amount) < 0.005
  return (
    <span
      className={cn(
        'tabular-nums text-sm text-right shrink-0 min-w-[7rem]',
        emphasize && 'font-semibold',
        isZero ? 'text-muted-foreground' : 'text-foreground'
      )}
    >
      {isZero ? '—' : formatChartBalance(amount, currency)}
    </span>
  )
}

function AccountNode({
  node,
  byParent,
  rolled,
  currency,
  depth,
}: {
  node: ChartAccountWithBalance
  byParent: Map<string | null, ChartAccountWithBalance[]>
  rolled: Map<string, number>
  currency: string
  depth: number
}) {
  const children = byParent.get(node.id) ?? []
  const isGroup = !node.isPostable && children.length > 0
  const amount = rolled.get(node.id) ?? 0

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-[4.5rem_1fr_7.5rem] gap-3 items-center py-2 border-b border-border/50 last:border-0',
          depth > 0 && 'ml-3'
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        <span className="font-mono text-xs text-muted-foreground">{node.code}</span>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className={cn('text-sm truncate', isGroup && 'font-semibold')}>{node.name}</span>
          {node.isPostable ? (
            <Badge variant="outline" className="text-[10px] font-normal shrink-0">
              Imputable
            </Badge>
          ) : null}
        </div>
        <BalanceCell amount={amount} currency={currency} emphasize={isGroup} />
      </div>
      {children.map((c) => (
        <AccountNode
          key={c.id}
          node={c}
          byParent={byParent}
          rolled={rolled}
          currency={currency}
          depth={depth + 1}
        />
      ))}
    </>
  )
}

function SectionBlock({
  root,
  rows,
  byParent,
  rolled,
  currency,
  defaultOpen,
}: {
  root: ChartAccountWithBalance
  rows: ChartAccountWithBalance[]
  byParent: Map<string | null, ChartAccountWithBalance[]>
  rolled: Map<string, number>
  currency: string
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const meta = chartSectionForRootCode(root.code)
  const postableCount = countPostableUnderRoot(root.code, rows)
  const sectionTotal = rolled.get(root.id) ?? 0
  const children = byParent.get(root.id) ?? []

  return (
    <Card className={cn('border-l-4 overflow-hidden', meta?.accentClass ?? 'border-l-muted')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <CardHeader className="py-3 px-4">
          <div className="flex items-start gap-2">
            {open ? (
              <ChevronDown className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-base flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{root.code}</span>
                  {meta?.title ?? root.name}
                  <Badge variant="secondary" className="font-normal text-[10px]">
                    {postableCount} {postableCount === 1 ? 'cuenta' : 'cuentas'}
                  </Badge>
                </CardTitle>
                <BalanceCell amount={sectionTotal} currency={currency} emphasize />
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {meta?.description ?? root.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </button>
      {open ? (
        <CardContent className="pt-0 px-4 pb-4">
          <div className="grid grid-cols-[4.5rem_1fr_7.5rem] gap-3 px-0 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground border-b border-border/60 mb-1">
            <span>Código</span>
            <span>Cuenta</span>
            <span className="text-right">Saldo</span>
          </div>
          {children.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Sin subcuentas en esta sección.</p>
          ) : (
            children.map((c) => (
              <AccountNode
                key={c.id}
                node={c}
                byParent={byParent}
                rolled={rolled}
                currency={currency}
                depth={0}
              />
            ))
          )}
        </CardContent>
      ) : null}
    </Card>
  )
}

export function ChartOfAccountsTree({ rows, currency, asOf, isDemo }: ChartOfAccountsTreeProps) {
  const byParent = useMemo(() => buildChildrenMap(rows), [rows])
  const rolled = useMemo(() => rollupChartBalances(rows), [rows])
  const roots = byParent.get(null) ?? []

  const asOfLabel = useMemo(() => {
    try {
      return format(new Date(`${asOf}T12:00:00`), "d 'de' MMMM yyyy", { locale: es })
    } catch {
      return asOf
    }
  }, [asOf])

  const hasAnyBalance = useMemo(
    () => rows.some((r) => Math.abs(r.balance) >= 0.005),
    [rows]
  )

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No hay plan de cuentas cargado para esta empresa.
        </CardContent>
      </Card>
    )
  }

  const orderedRoots = CHART_ROOT_SECTIONS.map((s) => roots.find((r) => r.code === s.code)).filter(
    (r): r is ChartAccountWithBalance => !!r
  )
  const extraRoots = roots.filter((r) => !CHART_ROOT_SECTIONS.some((s) => s.code === r.code))

  return (
    <div className="space-y-4">
      <Card className="border-[#7B68EE]/25 bg-[#7B68EE]/5">
        <CardContent className="flex gap-3 py-4">
          <Info className="h-5 w-5 text-[#7B68EE] shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-medium text-foreground">Plan de cuentas con saldos</p>
            <p className="text-muted-foreground leading-relaxed">
              Cada fila muestra el <strong className="font-medium text-foreground">saldo acumulado</strong>{' '}
              al corte, calculado desde movimientos <strong className="font-medium text-foreground">aprobados</strong>{' '}
              en el libro diario. Las cuentas agrupadoras suman sus hijas.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Para el día a día usá la pestaña{' '}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Wallet className="h-3.5 w-3.5" />
                Cuentas
              </span>{' '}
              (caja, bancos) y <strong className="font-medium text-foreground">Categorías</strong>.
              {isDemo ? ' Los importes en demo son de ejemplo.' : null}
            </p>
            <p className="text-xs text-muted-foreground">
              Saldos al {asOfLabel}
              {!hasAnyBalance && !isDemo
                ? ' · Todavía no hay movimientos aprobados que generen saldos en el plan.'
                : null}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {orderedRoots.map((root, i) => (
          <SectionBlock
            key={root.id}
            root={root}
            rows={rows}
            byParent={byParent}
            rolled={rolled}
            currency={currency}
            defaultOpen={i < 2}
          />
        ))}
        {extraRoots.map((root) => (
          <SectionBlock
            key={root.id}
            root={root}
            rows={rows}
            byParent={byParent}
            rolled={rolled}
            currency={currency}
            defaultOpen={false}
          />
        ))}
      </div>
    </div>
  )
}
