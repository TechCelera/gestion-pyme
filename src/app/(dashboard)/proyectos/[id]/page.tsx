import { Suspense } from 'react'
import { ProjectAnalysisContent } from '@/components/projects/project-analysis-content'
import { ProjectAnalysisFallback } from '@/components/projects/project-analysis-fallback'

export const dynamic = 'force-dynamic'

export default function ProjectAnalysisPage() {
  return (
    <Suspense fallback={<ProjectAnalysisFallback />}>
      <ProjectAnalysisContent />
    </Suspense>
  )
}
