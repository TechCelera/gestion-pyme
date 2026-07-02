'use client'

import { Info } from 'lucide-react'

export function DemoBanner() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">Demo Matías Distribuidora</span> — datos de
        ejemplo. El import de Excel de Pedro Veglia se conecta con tu planilla al cerrar el proyecto.
      </p>
    </div>
  )
}
