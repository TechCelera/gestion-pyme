import { Suspense } from 'react'
import { ReportsPageContent } from '@/components/reports/reports-page-content'
import { ReportsPageFallback } from '@/components/reports/reports-page-fallback'

export const dynamic = 'force-dynamic'

export default function ReportsPage() {
  return (
    <Suspense fallback={<ReportsPageFallback />}>
      <ReportsPageContent />
    </Suspense>
  )
}
