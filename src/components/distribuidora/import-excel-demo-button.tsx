'use client'

import { FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

/** ponytail: placeholder hasta import real con Excels de Matías. */
export function ImportExcelDemoButton() {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 shrink-0 gap-1.5 border-dashed border-primary/40 bg-primary/5 px-2.5 sm:px-3"
      onClick={() =>
        toast.info(
          'Demo: acá cargás el export de Excel de Pedro Veglia. Lo conectamos con tu planilla al cerrar el proyecto.',
          { duration: 6000 }
        )
      }
    >
      <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate text-xs sm:text-sm">Importar Excel</span>
    </Button>
  )
}
