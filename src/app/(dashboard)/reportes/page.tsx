import { Suspense } from 'react'
import { ReportsPageContent } from '@/components/reports/reports-page-content'
import { ReportsPageFallback } from '@/components/reports/reports-page-fallback'
import { getCompanySettings } from '@/lib/actions/company-settings'
import { getAuthenticatedContext } from '@/lib/auth/server-context'
import { isAdminRole } from '@/lib/auth/roles'
import { isDistribuidoraProfile } from '@/lib/company-operating-profile'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string | string[] }>
}) {
  const resolved = await searchParams
  const rango = resolveRouteSearchParam(resolved.rango)
  const [settings, auth] = await Promise.all([
    getCompanySettings(),
    getAuthenticatedContext(),
  ])
  const isDistribuidora =
    settings.success &&
    settings.data != null &&
    isDistribuidoraProfile(settings.data.operatingProfile)
  const canViewFinancialResults = !isDistribuidora || isAdminRole(auth?.role)

  const operatingProfile =
    settings.success && settings.data ? settings.data.operatingProfile : 'default'

  return (
    <Suspense fallback={<ReportsPageFallback />}>
      <ReportsPageContent
        key={rango ?? 'mes'}
        rango={rango}
        isDistribuidora={isDistribuidora}
        canViewFinancialResults={canViewFinancialResults}
        operatingProfile={operatingProfile}
      />
    </Suspense>
  )
}
