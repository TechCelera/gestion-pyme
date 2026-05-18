import { Suspense } from 'react'
import { ProjectAnalysisContent } from '@/components/projects/project-analysis-content'
import { ProjectAnalysisFallback } from '@/components/projects/project-analysis-fallback'
import { resolveRouteSearchParam } from '@/lib/next/resolve-route-search-param'

export const dynamic = 'force-dynamic'

export default async function ProjectAnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ rango?: string | string[] }>
}) {
  const { id } = await params
  const resolved = await searchParams
  const rango = resolveRouteSearchParam(resolved.rango)

  return (
    <Suspense fallback={<ProjectAnalysisFallback />}>
      <ProjectAnalysisContent key={`${id}-${rango ?? 'mes'}`} id={id} rango={rango} />
    </Suspense>
  )
}
