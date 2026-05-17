import { Loader2 } from 'lucide-react'

export function ProjectAnalysisFallback() {
  return (
    <div className="flex justify-center py-24 p-4 md:p-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
    </div>
  )
}
