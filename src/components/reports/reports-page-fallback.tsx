import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

export function ReportsPageFallback() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <PageHeader title="Reportes" description="Cargando informes…" />
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    </div>
  )
}
