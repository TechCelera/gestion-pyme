'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle, Trash2, CircleArrowRight, Ban } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { MovementStatusBadge } from './movement-status-badge'
import type { Movement } from '@/lib/actions/movements'
import type { MovementStatus } from '@/lib/validations/movement'
import { MOVEMENT_METHODS_LABELS } from '@/lib/constants'

interface MovementTableProps {
  movements: Movement[]
  onDelete: (id: string) => void
  onSendToApproval: (id: string) => void
  onApprove: (id: string) => void
  onCancel: (id: string) => void
  isLoading?: boolean
}

const typeLabels: Record<string, string> = {
  income: 'Venta / Cobro',
  expense: 'Compra / Pago',
  transfer: 'Pasaje entre cuentas',
  adjustment: 'Ajuste',
}

/** Fuera del JSX para evitar ambiguedad del parser con `- { locale }` dentro de `{format(...)}` */
const dateRowFormatOpts = { locale: es }

export function MovementTable({
  movements,
  onDelete,
  onSendToApproval,
  onApprove,
  onCancel,
  isLoading,
}: MovementTableProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const canSendToApproval = (status: MovementStatus) => status === 'draft'
  const canApprove = (status: MovementStatus) => status === 'pending'
  const canDelete = (status: MovementStatus) => status === 'draft'
  const canCancel = (status: MovementStatus) => status === 'approved'

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Ámbito</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[180px] text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={8}>
                  <div className="h-8 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-card">
        <p className="text-muted-foreground">No hay movimientos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
              <TableHead className="text-center">Fecha</TableHead>
              <TableHead className="text-center">Tipo</TableHead>
              <TableHead className="text-center">Método</TableHead>
              <TableHead className="text-center">Descripción</TableHead>
              <TableHead className="text-center">Ámbito</TableHead>
              <TableHead className="text-center">Monto</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="w-[180px] text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell className="text-center">
                {format(new Date(movement.date), 'dd/MM/yyyy', dateRowFormatOpts)}
              </TableCell>
              <TableCell className="text-center">{typeLabels[movement.type] || movement.type}</TableCell>
              <TableCell className="text-center">
                <span className="inline-flex text-xs px-1.5 py-0.5 rounded bg-muted">
                  {MOVEMENT_METHODS_LABELS[movement.method] || movement.method}
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-center">
                {movement.description}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground text-center">
                    {movement.projectName ?? 'General empresa'}
                  </span>
                  {movement.requiresBudgetApproval ? (
                    <span className="text-[11px] text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 w-fit">
                      Requiere aprobación presupuesto
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="font-medium text-center">
                {formatCurrency(movement.amount, movement.currency)}
              </TableCell>
              <TableCell className="text-center">
                <MovementStatusBadge status={movement.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  {canSendToApproval(movement.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onSendToApproval(movement.id)}
                      title="Enviar a aprobación"
                      className="text-amber-700"
                    >
                      <CircleArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canApprove(movement.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onApprove(movement.id)}
                      title="Aprobar y registrar"
                      className="text-green-600"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canCancel(movement.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onCancel(movement.id)}
                      title="Anular movimiento aprobado"
                      className="text-orange-700"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete(movement.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete(movement.id)}
                      title="Eliminar"
                      className="text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
