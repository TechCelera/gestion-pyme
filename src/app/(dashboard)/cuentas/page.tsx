import { Suspense } from 'react'
import { CuentasPageContent } from '@/components/accounts/cuentas-page-content'
import { CuentasPageFallback } from '@/components/accounts/cuentas-page-fallback'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

export const dynamic = 'force-dynamic'

export default async function CuentasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const resolved = await searchParams
  const tab = resolveRouteSearchParam(resolved.tab) ?? null

  return (
    <Suspense fallback={<CuentasPageFallback />}>
      <CuentasPageContent key={tab ?? 'accounts'} tab={tab} />
    </Suspense>
  )
}
