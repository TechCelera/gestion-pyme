'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, CheckCircle, Send, Trash2, CircleArrowRight } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { OperationStatusBadge } from './operation-status-badge'
import type { Operation } from '@/lib/actions/operations'
import type { OperationStatus } from '@/lib/validations/operation'
import { OPERATION_METHODS_LABELS } from '@/lib/constants'

interface OperationTableProps {
  operations: Operation[]
  onEdit: (operation: Operation) => void
  onDelete: (id: string) => void
  onSendToApproval: (id: string) => void
  onApprove: (id: string) => void
  onPost: (id: string) => void
  isLoading?: boolean
}

const typeLabels: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  transfer: 'Transferencia',
  adjustment: 'Ajuste',
}

/** Fuera del JSX para evitar ambiguedad del parser con `- { locale }` dentro de `{format(...)}` */
const dateRowFormatOpts = { locale: es }

export function OperationTable({
  operations,
  onEdit,
  onDelete,
  onSendToApproval,
  onApprove,
  onPost,
  isLoading,
}: OperationTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const canEdit = (status: OperationStatus) => status === 'draft'
  const canSendToApproval = (status: OperationStatus) => status === 'draft'
  const canApprove = (status: OperationStatus) => status === 'pending'
  const canPost = (status: OperationStatus) => status === 'approved'
  const canDelete = (status: OperationStatus) => status === 'draft'

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

  if (operations.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-card">
        <p className="text-muted-foreground">No hay operaciones para mostrar</p>
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
          {operations.map((operation) => (
            <TableRow
              key={operation.id}
              onMouseEnter={() => setHoveredRow(operation.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <TableCell className="text-center">
                {format(new Date(operation.date), 'dd/MM/yyyy', dateRowFormatOpts)}
              </TableCell>
              <TableCell className="text-center">{typeLabels[operation.type] || operation.type}</TableCell>
              <TableCell className="text-center">
                <span className="inline-flex text-xs px-1.5 py-0.5 rounded bg-muted">
                  {OPERATION_METHODS_LABELS[operation.method] || operation.method}
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-center">
                {operation.description}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground text-center">
                    {operation.projectName ?? 'General empresa'}
                  </span>
                  {operation.requiresBudgetApproval ? (
                    <span className="text-[11px] text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 w-fit">
                      Requiere aprobación presupuesto
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="font-medium text-center">
                {formatCurrency(operation.amount, operation.currency)}
              </TableCell>
              <TableCell className="text-center">
                <OperationStatusBadge status={operation.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  {canEdit(operation.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onEdit(operation)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canSendToApproval(operation.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onSendToApproval(operation.id)}
                      title="Enviar a aprobación"
                      className="text-amber-700"
                    >
                      <CircleArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canApprove(operation.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onApprove(operation.id)}
                      title="Aprobar"
                      className="text-[#7B68EE]"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canPost(operation.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onPost(operation.id)}
                      title="Postear"
                      className="text-green-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete(operation.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete(operation.id)}
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
