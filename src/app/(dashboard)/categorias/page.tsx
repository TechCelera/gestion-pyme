import { Suspense } from 'react'
import { CategoriasPageContent } from '@/components/categories/categorias-page-content'
import { CategoriasPageFallback } from '@/components/categories/categorias-page-fallback'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

export const dynamic = 'force-dynamic'

export default async function CategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string | string[] }>
}) {
  const resolved = await searchParams
  const tipo = resolveRouteSearchParam(resolved.tipo) ?? null

  return (
    <Suspense fallback={<CategoriasPageFallback />}>
      <CategoriasPageContent key={tipo ?? 'all'} tipo={tipo} />
    </Suspense>
  )
}
