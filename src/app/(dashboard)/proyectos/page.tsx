import { Suspense } from 'react'
import { ProyectosPageContent } from '@/components/projects/proyectos-page-content'
import { ProyectosPageFallback } from '@/components/projects/proyectos-page-fallback'

export const dynamic = 'force-dynamic'

export default function ProyectosPage() {
  return (
    <Suspense fallback={<ProyectosPageFallback />}>
      <ProyectosPageContent />
    </Suspense>
  )
}
