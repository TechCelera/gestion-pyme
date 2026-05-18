'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CheckCircle,
  Trash2,
  CircleArrowRight,
  Ban,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Eye,
} from 'lucide-react'

import { formatCurrency } from '@/lib/format/currency'
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
import { getMovementTypeLabel, MOVEMENT_METHODS_LABELS } from '@/lib/constants'

interface MovementTableProps {
  movements: Movement[]
  currentUserId?: string | null
  onViewDetail: (movement: Movement) => void
  onDelete: (id: string) => void
  onSendToApproval: (id: string) => void
  onCorrectRejected: (movement: Movement) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onApproveBudget: (id: string) => void
  onCancel: (id: string) => void
  canManageFinanceActions?: boolean
  isLoading?: boolean
}

const dateRowFormatOpts = { locale: es }

export function MovementTable({
  movements,
  currentUserId,
  onViewDetail,
  onDelete,
  onSendToApproval,
  onCorrectRejected,
  onApprove,
  onReject,
  onApproveBudget,
  onCancel,
  canManageFinanceActions = false,
  isLoading,
}: MovementTableProps) {
  const needsBudgetStep = (m: Movement) =>
    Boolean(m.requiresBudgetApproval && !m.budgetApprovedBy)

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
              <TableHead className="w-[220px] text-center">Acciones</TableHead>
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
            <TableHead className="w-[220px] text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const status = movement.status
            const isDraft = status === 'draft'
            const isPending = status === 'pending'
            const isRejected = status === 'rejected'
            const isApproved = status === 'approved'
            const isCreator = currentUserId && movement.createdBy === currentUserId
            const budgetGate = needsBudgetStep(movement)

            return (
              <TableRow key={movement.id}>
                <TableCell className="text-center">
                  {format(new Date(movement.date), 'dd/MM/yyyy', dateRowFormatOpts)}
                </TableCell>
                <TableCell className="text-center">{getMovementTypeLabel(movement.type)}</TableCell>
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
                        {budgetGate ? 'Falta OK de presupuesto' : 'Presupuesto autorizado'}
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
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onViewDetail(movement)}
                      title="Ver detalle"
                      className="text-muted-foreground"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {isDraft && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onSendToApproval(movement.id)}
                          title="Enviar a aprobación"
                          className="text-amber-700"
                        >
                          <CircleArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDelete(movement.id)}
                          title="Eliminar borrador"
                          className="text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}

                    {isPending && !canManageFinanceActions && (
                      <span className="text-xs text-muted-foreground px-2">En revisión</span>
                    )}

                    {isPending && canManageFinanceActions && (
                      <>
                        {budgetGate && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onApproveBudget(movement.id)}
                            title="Autorizar excepción de presupuesto"
                            className="text-amber-700"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onApprove(movement.id)}
                          title={
                            budgetGate
                              ? 'Primero autoriza el presupuesto'
                              : 'Aprobar y registrar en el libro'
                          }
                          className="text-green-600"
                          disabled={budgetGate}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onReject(movement.id)}
                          title="Rechazar con motivo"
                          className="text-orange-700"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}

                    {isRejected && (isCreator || canManageFinanceActions) && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onCorrectRejected(movement)}
                        title="Corregir y reenviar a aprobación"
                        className="text-amber-700"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {isApproved && canManageFinanceActions && (
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
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
