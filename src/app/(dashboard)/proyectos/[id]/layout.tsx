import { Suspense } from 'react'

export default function ProjectAnalysisLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
