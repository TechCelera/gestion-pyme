'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, Plus } from 'lucide-react'
import Link from 'next/link'

export function EmptyState() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de la situación de tu empresa</p>
      </div>

      {/* Empty state card */}
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#7B68EE]/10 flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-[#7B68EE]" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            ¡Bienvenido a tu Dashboard!
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Aún no tienes transacciones registradas. Comienza agregando tu primera transacción para ver el resumen de tu empresa.
          </p>
          <Link href="/transactions">
            <Button className="bg-[#7B68EE] hover:bg-[#7B68EE]/90">
              <Plus className="mr-2 h-4 w-4" />
              Agregar transacción
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
