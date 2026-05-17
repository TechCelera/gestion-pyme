'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { notFound, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { getProjectFinancialAnalysis } from '@/lib/actions/projects'
import { ProjectAnalysisFallback } from '@/components/projects/project-analysis-fallback'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import type { ReportsRangeKey } from '@/lib/utils/reports-period'

const PERIOD_LINKS: { key: ReportsRangeKey; label: string; href: string }[] = [
  { key: 'mes', label: 'Este mes', href: 'mes' },
  { key: 'mes_anterior', label: 'Mes anterior', href: 'mes_anterior' },
  { key: 'trimestre', label: 'Este trimestre', href: 'trimestre' },
  { key: 'trim_anterior', label: 'Trimestre anterior', href: 'trim_anterior' },
]

function formatAr(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function ProjectAnalysisContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const rango = searchParams.get('rango') ?? undefined

  if (!id) {
    notFound()
  }

  return <ProjectAnalysisInner key={`${id}-${rango ?? 'mes'}`} id={id} rango={rango} />
}

function ProjectAnalysisInner({ id, rango }: { id: string; rango: string | undefined }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<
    Awaited<ReturnType<typeof getProjectFinancialAnalysis>>['data']
  >(undefined)

  useEffect(() => {
    let cancelled = false

    void getProjectFinancialAnalysis(id, rango).then((result) => {
      if (cancelled) return
      if (!result.success || !result.data) {
        setError(result.error ?? 'Error desconocido')
        setAnalysis(undefined)
      } else {
        setAnalysis(result.data)
        setError(null)
      }
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [id, rango])

  if (!isLoading && error?.toLowerCase().includes('no encontrado')) {
    notFound()
  }

  if (isLoading) {
    return <ProjectAnalysisFallback />
  }

  if (error || !analysis) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/proyectos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a proyectos
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>No se pudo cargar el análisis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error ?? 'Error desconocido'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const a = analysis

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/proyectos">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Proyectos
        </Link>
      </Button>

      <PageHeader
        title={a.name}
        description={`Presupuesto vs movimientos aprobados en el período · ${a.periodLabel}`}
      />

      <div className="flex flex-wrap gap-2">
        {PERIOD_LINKS.map(({ key, label, href }) => (
          <Button key={key} variant={a.rangeKey === key ? 'default' : 'outline'} size="sm" asChild>
            <Link href={href === 'mes' ? `/proyectos/${id}` : `/proyectos/${id}?rango=${href}`}>
              {label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatAr(a.budgetAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gastos aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              {formatAr(a.expensesApproved)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatAr(a.incomeApproved)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Saldo vs presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold tabular-nums ${
                a.varianceVsBudget < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
              }`}
            >
              {formatAr(a.varianceVsBudget)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Positivo: aún queda cupo antes de agotar el presupuesto (según gastos aprobados).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
