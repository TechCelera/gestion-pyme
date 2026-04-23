import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SyncIndicator } from '@/components/layout/sync-indicator'
import { SeedOnFirstAccess } from '@/components/layout/seed-on-first-access'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <SyncIndicator />
        <SeedOnFirstAccess />
        {children}
      </main>
      <BottomNav />
    </div>
  )
}