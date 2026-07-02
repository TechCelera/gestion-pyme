import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SyncIndicator } from '@/components/layout/sync-indicator'
import { SeedOnFirstAccess } from '@/components/layout/seed-on-first-access'
import { getCompanySettings } from '@/lib/actions/company-settings'
import { getPendingMovementsCount } from '@/lib/actions/movements'

function SidebarFallback() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar h-screen" />
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [pendingRes, settingsRes] = await Promise.all([
    getPendingMovementsCount(),
    getCompanySettings(),
  ])
  const pendingCount = pendingRes.success ? (pendingRes.data ?? 0) : 0
  const operatingProfile =
    settingsRes.success && settingsRes.data
      ? settingsRes.data.operatingProfile
      : 'default'

  return (
    <div className="flex h-screen">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar pendingCount={pendingCount} operatingProfile={operatingProfile} />
      </Suspense>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <SeedOnFirstAccess />
        <SyncIndicator />
        {children}
      </main>
      <BottomNav pendingCount={pendingCount} operatingProfile={operatingProfile} />
    </div>
  )
}
