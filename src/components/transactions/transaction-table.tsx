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
import { TransactionStatusBadge } from './transaction-status-badge'
import type { Transaction } from '@/lib/actions/transactions'
import type { TransactionStatus } from '@/lib/validations/transaction'
import { TRANSACTION_METHOD_LABELS } from '@/lib/constants'

interface TransactionTableProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
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

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  onSendToApproval,
  onApprove,
  onPost,
  isLoading,
}: TransactionTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const canEdit = (status: TransactionStatus) => status === 'draft'
  const canSendToApproval = (status: TransactionStatus) => status === 'draft'
  const canApprove = (status: TransactionStatus) => status === 'pending'
  const canPost = (status: TransactionStatus) => status === 'approved'
  const canDelete = (status: TransactionStatus) => status === 'draft'

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

  if (transactions.length === 0) {
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
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              onMouseEnter={() => setHoveredRow(transaction.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <TableCell className="text-center">
                {format(new Date(transaction.date), 'dd/MM/yyyy', dateRowFormatOpts)}
              </TableCell>
              <TableCell className="text-center">{typeLabels[transaction.type] || transaction.type}</TableCell>
              <TableCell className="text-center">
                <span className="inline-flex text-xs px-1.5 py-0.5 rounded bg-muted">
                  {TRANSACTION_METHOD_LABELS[transaction.method] || transaction.method}
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-center">
                {transaction.description}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-xs text-muted-foreground text-center">
                    {transaction.projectName ?? 'General empresa'}
                  </span>
                  {transaction.requiresBudgetApproval ? (
                    <span className="text-[11px] text-amber-700 bg-amber-100 rounded px-1.5 py-0.5 w-fit">
                      Requiere aprobación presupuesto
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="font-medium text-center">
                {formatCurrency(transaction.amount, transaction.currency)}
              </TableCell>
              <TableCell className="text-center">
                <TransactionStatusBadge status={transaction.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  {canEdit(transaction.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onEdit(transaction)}
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canSendToApproval(transaction.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onSendToApproval(transaction.id)}
                      title="Enviar a aprobación"
                      className="text-amber-700"
                    >
                      <CircleArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canApprove(transaction.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onApprove(transaction.id)}
                      title="Aprobar"
                      className="text-[#7B68EE]"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canPost(transaction.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onPost(transaction.id)}
                      title="Postear"
                      className="text-green-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete(transaction.status) && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDelete(transaction.id)}
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
