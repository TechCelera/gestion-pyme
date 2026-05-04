import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/actions/transactions'
import { redirect } from 'next/navigation'
import { DemoDashboard } from '@/components/dashboard/demo-dashboard'
import { RealDashboard } from '@/components/dashboard/real-dashboard'
import { EmptyState } from '@/components/dashboard/empty-state'
import { DashboardError } from '@/components/dashboard/dashboard-error'

// Force dynamic rendering because we use cookies() and session checks
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // 1. Check demo cookie
  const cookieStore = await cookies()
  const demoCookie = cookieStore.get('demo_mode')?.value === 'true'
  if (demoCookie) {
    return <DemoDashboard />
  }

  // 2. Check auth session (redirect must stay outside try/catch)
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // 3. Fetch stats (only data fetch inside try/catch)
  let result: Awaited<ReturnType<typeof getDashboardStats>>
  try {
    result = await getDashboardStats()
  } catch (error) {
    // CRITICAL: Never let the Server Component crash
    console.error('DashboardPage uncaught error:', error)
    return <DashboardError message="Error al cargar el dashboard. Intenta recargar la página." />
  }

  if (!result.success || !result.data) {
    return <DashboardError message={result.error || 'No se pudieron cargar las estadísticas'} />
  }

  // 4. Branch based on data
  if (result.data.totalTransactions === 0) {
    return <EmptyState />
  }

  return <RealDashboard stats={result.data} />
}
