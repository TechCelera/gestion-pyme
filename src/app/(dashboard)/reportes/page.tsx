import { Suspense } from 'react'
import { ReportsPageContent } from '@/components/reports/reports-page-content'
import { ReportsPageFallback } from '@/components/reports/reports-page-fallback'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string | string[] }>
}) {
  const resolved = await searchParams
  const rango = resolveRouteSearchParam(resolved.rango)

  return (
    <Suspense fallback={<ReportsPageFallback />}>
      <ReportsPageContent key={rango ?? 'mes'} rango={rango} />
    </Suspense>
  )
}
