'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { getDashboardStats, type DashboardStats } from '@/lib/actions/transactions'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { DemoDashboard } from '@/components/dashboard/demo-dashboard'
import { RealDashboard } from '@/components/dashboard/real-dashboard'
import { EmptyState } from '@/components/dashboard/empty-state'
import { DashboardError } from '@/components/dashboard/dashboard-error'

export default function DashboardPage() {
  // Hydration guard — must be the first conditional render
  const [mounted, setMounted] = useState(false)

  // Auth store read is unconditional (hooks rule) but only USED after mounted
  const isDemoMode = useAuthStore((state) => state.isDemoMode)

  // Local state for real user branch
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Trigger mounted after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch stats for real users
  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getDashboardStats()
      if (result.success && result.data) {
        setStats(result.data)
      } else {
        setError(result.error || 'Error al cargar las estadísticas')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Only fetch stats after hydration and only for real users
  useEffect(() => {
    if (!mounted) return
    if (isDemoMode) return
    fetchStats()
  }, [mounted, isDemoMode, fetchStats])

  // BEFORE hydration: identical skeleton on server and client
  if (!mounted) {
    return <DashboardSkeleton />
  }

  // AFTER hydration: branch based on auth state with fade-in
  const content = (() => {
    if (isDemoMode) {
      return <DemoDashboard />
    }

    if (loading && !stats && !error) {
      return <DashboardSkeleton />
    }

    if (error) {
      return <DashboardError message={error} onRetry={fetchStats} />
    }

    if (!stats) {
      return <DashboardSkeleton />
    }

    if (stats.totalTransactions === 0) {
      return <EmptyState />
    }

    return <RealDashboard stats={stats} />
  })()

  return (
    <div className="animate-in fade-in duration-500">
      {content}
    </div>
  )
}
