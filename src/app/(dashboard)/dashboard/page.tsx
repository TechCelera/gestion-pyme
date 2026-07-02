import { createClient } from '@/lib/supabase/server'
import { getCompanyOperatingCurrency, getCompanySettings } from '@/lib/actions/company-settings'
import { getDashboardStats, getReportsData } from '@/lib/actions/movements'
import { isDistribuidoraProfile } from '@/lib/company-operating-profile'
import { computeDistribuidoraResults } from '@/lib/distribuidora/distribuidora-results'
import { redirect } from 'next/navigation'
import { RealDashboard } from '@/components/dashboard/real-dashboard'
import { EmptyState } from '@/components/dashboard/empty-state'
import { DashboardError } from '@/components/dashboard/dashboard-error'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  const settingsResult = await getCompanySettings()
  const isDistribuidora =
    settingsResult.success &&
    settingsResult.data != null &&
    isDistribuidoraProfile(settingsResult.data.operatingProfile)

  let statsResult: Awaited<ReturnType<typeof getDashboardStats>>
  let reportsResult: Awaited<ReturnType<typeof getReportsData>>
  let weekReportsResult: Awaited<ReturnType<typeof getReportsData>> | null = null
  let currencyResult: Awaited<ReturnType<typeof getCompanyOperatingCurrency>>
  try {
    const [stats, reports, currency] = await Promise.all([
      getDashboardStats(),
      getReportsData(),
      getCompanyOperatingCurrency(),
    ])
    statsResult = stats
    reportsResult = reports
    currencyResult = currency
    if (isDistribuidora) {
      weekReportsResult = await getReportsData('esta_semana')
    }
  } catch (error) {
    console.error('DashboardPage uncaught error:', error)
    return <DashboardError message="Error al cargar el dashboard. Intenta recargar la página." />
  }

  if (!statsResult.success || !statsResult.data) {
    return <DashboardError message={statsResult.error || 'No se pudieron cargar las estadísticas'} />
  }

  if (statsResult.data.totalMovements === 0) {
    return <EmptyState />
  }

  const reportsData = reportsResult.success ? reportsResult.data : null
  const reportsError = reportsResult.success
    ? null
    : (reportsResult.error ?? 'No se pudieron cargar los datos de reportes')

  if (!reportsResult.success) {
    console.error('Dashboard reports failed:', reportsError)
  }

  const operatingCurrency =
    currencyResult.success && currencyResult.data ? currencyResult.data : 'ARS'

  let distribuidoraWeek: {
    periodLabel: string
    results: ReturnType<typeof computeDistribuidoraResults>
  } | null = null

  if (isDistribuidora && weekReportsResult?.success && weekReportsResult.data) {
    const { incomeStatement } = weekReportsResult.data
    distribuidoraWeek = {
      periodLabel: incomeStatement.periodLabel,
      results: computeDistribuidoraResults(
        incomeStatement.totalIncome,
        incomeStatement.expenseBreakdown
      ),
    }
  }

  return (
    <RealDashboard
      stats={statsResult.data}
      reportsData={reportsData}
      reportsError={reportsError}
      currency={operatingCurrency}
      isDistribuidora={isDistribuidora}
      distribuidoraWeek={distribuidoraWeek}
    />
  )
}
