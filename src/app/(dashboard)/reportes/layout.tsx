import { Suspense } from 'react'

export default function ReportesLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
