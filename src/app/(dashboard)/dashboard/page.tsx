import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/actions/transactions'
import { redirect } from 'next/navigation'
import { DemoDashboard } from '@/components/dashboard/demo-dashboard'
import { RealDashboard } from '@/components/dashboard/real-dashboard'
import { EmptyState } from '@/components/dashboard/empty-state'
import { DashboardError } from '@/components/dashboard/dashboard-error'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const demoCookie = cookieStore.get('demo_mode')?.value === 'true'

  // a. Modo demo via cookie
  if (demoCookie) {
    return <DemoDashboard />
  }

  // b. Verificar sesión real
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Cargar estadísticas
  const result = await getDashboardStats()

  if (!result.success || !result.data) {
    return (
      <DashboardError
        message={result.error || 'Error al cargar las estadísticas'}
      />
    )
  }

  if (result.data.totalTransactions === 0) {
    return <EmptyState />
  }

  return <RealDashboard stats={result.data} />
}
