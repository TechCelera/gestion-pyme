'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BarChart3 } from 'lucide-react'
import { getProjectFinancialAnalysis } from '@/lib/actions/projects'
import { ProjectAnalysisFallback } from '@/components/projects/project-analysis-fallback'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { ReportsPeriodTabs } from '@/components/reports/reports-period-tabs'
import { formatCurrency } from '@/lib/format/currency'
import { useCompanyOperatingCurrency } from '@/hooks/use-company-operating-currency'

export function ProjectAnalysisContent({
  id,
  rango,
}: {
  id: string
  rango?: string
}) {
  if (!id) {
    notFound()
  }

  return <ProjectAnalysisInner id={id} rango={rango} />
}

function ProjectAnalysisInner({ id, rango }: { id: string; rango: string | undefined }) {
  const { currency } = useCompanyOperatingCurrency(true)
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

      <ReportsPeriodTabs value={a.rangeKey} basePath={`/proyectos/${id}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(a.budgetAmount, currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gastos aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-red-600 dark:text-red-400">
              {formatCurrency(a.expensesApproved, currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos aprobados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(a.incomeApproved, currency)}
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
              {formatCurrency(a.varianceVsBudget, currency)}
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
