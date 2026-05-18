import { Suspense } from 'react'
import { OperacionesPageContent } from '@/components/movements/operaciones-page-content'
import { OperacionesPageFallback } from '@/components/movements/operaciones-page-fallback'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

export const dynamic = 'force-dynamic'

export default async function OperacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ flujo?: string | string[] }>
}) {
  const resolved = await searchParams
  const flujo = resolveRouteSearchParam(resolved.flujo)

  return (
    <Suspense fallback={<OperacionesPageFallback />}>
      <OperacionesPageContent key={flujo ?? 'all'} flujo={flujo} />
    </Suspense>
  )
}
