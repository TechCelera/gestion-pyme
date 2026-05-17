import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getReportsData } from '@/lib/actions/movements'
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

  let statsResult: Awaited<ReturnType<typeof getDashboardStats>>
  let reportsResult: Awaited<ReturnType<typeof getReportsData>>
  try {
    const [stats, reports] = await Promise.all([getDashboardStats(), getReportsData()])
    statsResult = stats
    reportsResult = reports
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

  return (
    <RealDashboard
      stats={statsResult.data}
      reportsData={reportsData}
      reportsError={reportsError}
    />
  )
}
