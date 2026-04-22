import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SyncIndicator } from '@/components/layout/sync-indicator'

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
        {children}
      </main>
      <BottomNav />
    </div>
  )
}