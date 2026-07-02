import { getCompanyOperatingCurrency, getCompanySettings } from '@/lib/actions/company-settings'
import { getDashboardStats, getReportsData } from '@/lib/actions/movements'
import { getAuthenticatedContext } from '@/lib/auth/server-context'
import { isAdminRole } from '@/lib/auth/roles'
import { isDistribuidoraProfile } from '@/lib/company-operating-profile'
import { computeDistribuidoraResults } from '@/lib/distribuidora/distribuidora-results'
import { redirect } from 'next/navigation'
import { RealDashboard } from '@/components/dashboard/real-dashboard'
import { EmptyState } from '@/components/dashboard/empty-state'
import { DashboardError } from '@/components/dashboard/dashboard-error'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const auth = await getAuthenticatedContext()
  if (!auth) {
    redirect('/login')
  }

  const settingsResult = await getCompanySettings()
  const isDistribuidora =
    settingsResult.success &&
    settingsResult.data != null &&
    isDistribuidoraProfile(settingsResult.data.operatingProfile)
  const canViewFinancialResults = !isDistribuidora || isAdminRole(auth.role)

  const operatingProfile =
    settingsResult.success && settingsResult.data
      ? settingsResult.data.operatingProfile
      : 'default'

  let statsResult: Awaited<ReturnType<typeof getDashboardStats>>
  let reportsResult: Awaited<ReturnType<typeof getReportsData>>
  let currencyResult: Awaited<ReturnType<typeof getCompanyOperatingCurrency>>
  try {
    const [stats, reports, currency] = await Promise.all([
      getDashboardStats(),
      getReportsData(isDistribuidora ? 'hoy' : undefined, { operatingProfile }),
      getCompanyOperatingCurrency(),
    ])
    statsResult = stats
    reportsResult = reports
    currencyResult = currency
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

  let distribuidoraToday: {
    periodLabel: string
    results: ReturnType<typeof computeDistribuidoraResults>
  } | null = null

  if (isDistribuidora && canViewFinancialResults && reportsResult.success && reportsResult.data) {
    const { incomeStatement } = reportsResult.data
    distribuidoraToday = {
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
      canViewFinancialResults={canViewFinancialResults}
      distribuidoraToday={distribuidoraToday}
    />
  )
}
