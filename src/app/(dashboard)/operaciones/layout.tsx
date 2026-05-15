import { Suspense } from 'react'

export default function OperacionesLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
