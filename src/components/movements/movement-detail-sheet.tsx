'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExternalLink, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { MovementStatusBadge } from './movement-status-badge'
import {
  getMovementById,
  getMovementComponents,
  type Movement,
  type MovementComponentDTO,
  type MovementDetail,
} from '@/lib/actions/movements'
import { getAccounts, type Account } from '@/lib/actions/accounts'
import { getContacts, type ContactRow } from '@/lib/actions/contacts'
import { getMovementTypeLabel, MOVEMENT_METHODS_LABELS } from '@/lib/constants'
import {
  EXPENSE_COMPONENT_TYPES,
  INCOME_COMPONENT_TYPES,
} from '@/components/movements/movement-form.types'
import type { MovementComponentType } from '@/lib/validations/movement'
import { formatCurrency } from '@/lib/format/currency'

const FUND_OWNER_LABELS: Record<string, string> = {
  company: 'Empresa',
  client_advance: 'Anticipo de cliente',
}

const ADJUSTMENT_LABELS: Record<string, string> = {
  reconciliation: 'Conciliación',
  correction: 'Corrección',
  other: 'Otro',
}

const DOCUMENT_LABELS: Record<string, string> = {
  invoice: 'Factura',
  receipt: 'Recibo',
  ticket: 'Ticket',
  other: 'Otro',
}

function componentTypeLabel(type: MovementComponentType, movementType: string): string {
  const options = movementType === 'income' ? INCOME_COMPONENT_TYPES : EXPENSE_COMPONENT_TYPES
  return options.find((o) => o.value === type)?.label ?? type
}

function formatDate(value: string | null | undefined) {
  if (!value) return null
  return format(new Date(value), 'dd/MM/yyyy', { locale: es })
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es })
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  if (children == null || children === '') return null
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

function MovementInternalReference({ id }: { id: string }) {
  const suffix = id.slice(-8)

  async function copyId() {
    try {
      await navigator.clipboard.writeText(id)
      toast.success('Referencia copiada')
    } catch {
      toast.error('No se pudo copiar la referencia')
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs text-muted-foreground" title={id}>
        …{suffix}
      </span>
      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copyId}>
        Copiar ID
      </Button>
    </span>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  )
}

interface MovementDetailSheetProps {
  movement: Movement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string | null
  canManageFinanceActions?: boolean
  onCorrectRejected?: (movement: Movement) => void
}

export function MovementDetailSheet({
  movement,
  open,
  onOpenChange,
  currentUserId,
  canManageFinanceActions = false,
  onCorrectRejected,
}: MovementDetailSheetProps) {
  const [detail, setDetail] = useState<MovementDetail | null>(null)
  const [components, setComponents] = useState<MovementComponentDTO[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !movement) {
      queueMicrotask(() => {
        setDetail(null)
        setComponents([])
        setError(null)
        setIsLoading(false)
      })
      return
    }

    let cancelled = false
    queueMicrotask(() => {
      setIsLoading(true)
      setError(null)
    })

    ;(async () => {
      const [detailRes, compRes, accRes, contactRes] = await Promise.all([
        getMovementById(movement.id),
        getMovementComponents(movement.id),
        getAccounts(),
        getContacts(),
      ])

      if (cancelled) return

      if (!detailRes.success || !detailRes.data) {
        setError(detailRes.error ?? 'No se pudo cargar el detalle')
        setDetail(null)
      } else {
        setDetail(detailRes.data)
      }

      if (compRes.success && compRes.data) {
        setComponents(compRes.data)
      } else {
        setComponents([])
      }

      if (accRes.success && accRes.data) setAccounts(accRes.data)
      if (contactRes.success && contactRes.data) setContacts(contactRes.data)

      setIsLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [open, movement])

  const display = detail ?? movement
  const isCreator = currentUserId && display?.createdBy === currentUserId
  const canCorrectRejected =
    display?.status === 'rejected' &&
    (isCreator || canManageFinanceActions) &&
    !!onCorrectRejected

  const resolveAccountName = (accountId?: string) =>
    accountId ? accounts.find((a) => a.id === accountId)?.name ?? accountId : null

  const resolveContactName = (contactId?: string) =>
    contactId ? contacts.find((c) => c.id === contactId)?.name ?? contactId : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 space-y-2 border-b px-6 py-4 text-left">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            {display ? <MovementStatusBadge status={display.status} /> : null}
          </div>
          <SheetTitle className="text-lg leading-tight">
            {display
              ? getMovementTypeLabel(display.type, display.operationKind)
              : 'Detalle del movimiento'}
          </SheetTitle>
          {display ? (
            <p className="text-base font-semibold text-foreground tabular-nums">
              {formatCurrency(display.amount, display.currency)}
            </p>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Cargando detalle...
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : display ? (
            <div className="space-y-5">
              <DetailSection title="General">
                <DetailRow label="Fecha">{formatDate(display.date)}</DetailRow>
                <DetailRow label="Descripción">{display.description}</DetailRow>
                <DetailRow label="Método">
                  {MOVEMENT_METHODS_LABELS[display.method] ?? display.method}
                </DetailRow>
                <DetailRow label="Moneda">{display.currency}</DetailRow>
                {display.type === 'income' || display.type === 'expense' ? (
                  <>
                    <DetailRow label="Cuenta">{display.accountName}</DetailRow>
                    <DetailRow label="Categoría">
                      {display.categoryName ?? '—'}
                    </DetailRow>
                  </>
                ) : null}
                {display.type === 'transfer' ? (
                  <>
                    <DetailRow label="Origen">
                      {detail?.sourceAccountName ?? '—'}
                    </DetailRow>
                    <DetailRow label="Destino">
                      {detail?.destinationAccountName ?? '—'}
                    </DetailRow>
                  </>
                ) : null}
                {display.type === 'adjustment' && detail?.adjustmentReason ? (
                  <DetailRow label="Motivo del ajuste">
                    {ADJUSTMENT_LABELS[detail.adjustmentReason] ?? detail.adjustmentReason}
                  </DetailRow>
                ) : null}
              </DetailSection>

              <DetailSection title="Ámbito">
                <DetailRow label="Proyecto">
                  {display.projectName ?? 'General empresa'}
                </DetailRow>
                <DetailRow label="Origen del fondo">
                  {FUND_OWNER_LABELS[display.fundOwner ?? 'company'] ??
                    display.fundOwner}
                </DetailRow>
                {display.requiresBudgetApproval ? (
                  <DetailRow label="Presupuesto">
                    {display.budgetApprovedBy
                      ? 'Excepción autorizada'
                      : 'Requiere autorización de excepción'}
                  </DetailRow>
                ) : null}
                {detail?.budgetApprovalNote ? (
                  <DetailRow label="Nota de presupuesto">
                    {detail.budgetApprovalNote}
                  </DetailRow>
                ) : null}
              </DetailSection>

              {(detail?.documentType || detail?.documentNumber || detail?.attachmentUrl) && (
                <DetailSection title="Comprobante">
                  {detail.documentType ? (
                    <DetailRow label="Tipo">
                      {DOCUMENT_LABELS[detail.documentType] ?? detail.documentType}
                    </DetailRow>
                  ) : null}
                  <DetailRow label="Número">{detail.documentNumber}</DetailRow>
                  {detail.attachmentUrl ? (
                    <DetailRow label="Adjunto">
                      <a
                        href={detail.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#7B68EE] hover:underline"
                      >
                        Ver archivo
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </DetailRow>
                  ) : null}
                </DetailSection>
              )}

              {(display.type === 'income' || display.type === 'expense') &&
              components &&
              components.length > 0 ? (
                <DetailSection title="Medios de cobro / pago">
                  <ul className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    {components.map((line, idx) => (
                      <li
                        key={line.id ?? idx}
                        className="flex flex-wrap items-baseline justify-between gap-2"
                      >
                        <span>
                          {componentTypeLabel(line.componentType, display.type)}
                          {line.componentType === 'operative_cash' ||
                          line.componentType === 'operative_bank'
                            ? ` · ${resolveAccountName(line.accountId) ?? ''}`
                            : null}
                          {line.componentType === 'client_receivable' ||
                          line.componentType === 'supplier_payable'
                            ? ` · ${resolveContactName(line.contactId) ?? ''}`
                            : null}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(
                            line.amount,
                            line.currency ?? display.currency
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              ) : null}

              <DetailSection title="Registro y flujo">
                <DetailRow label="Referencia interna">
                  <MovementInternalReference id={display.id} />
                </DetailRow>
                <DetailRow label="Creado">
                  {display.creatorName ?? '—'}
                  {display.createdAt
                    ? ` · ${formatDateTime(display.createdAt)}`
                    : null}
                </DetailRow>
                {detail?.updatedAt ? (
                  <DetailRow label="Última actualización">
                    {formatDateTime(detail.updatedAt)}
                  </DetailRow>
                ) : null}
                {detail?.approverName || detail?.approvedAt ? (
                  <DetailRow label="Aprobación">
                    {[detail.approverName, formatDateTime(detail.approvedAt)]
                      .filter(Boolean)
                      .join(' · ')}
                  </DetailRow>
                ) : null}
                {detail?.rejecterName ||
                detail?.rejectedAt ||
                detail?.rejectionReason ? (
                  <DetailRow label="Rechazo">
                    <span className="block">
                      {[detail.rejecterName, formatDateTime(detail.rejectedAt)]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    {detail.rejectionReason ? (
                      <span className="mt-1 block rounded-md bg-orange-50 px-2 py-1.5 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100">
                        {detail.rejectionReason}
                      </span>
                    ) : null}
                  </DetailRow>
                ) : null}
                {detail?.cancellationReason ? (
                  <DetailRow label="Anulación">
                    <span className="block rounded-md bg-muted px-2 py-1.5">
                      {detail.cancellationReason}
                    </span>
                  </DetailRow>
                ) : null}
              </DetailSection>
            </div>
          ) : null}
        </div>

        <SheetFooter className="shrink-0 flex-col gap-2 border-t bg-muted/40 px-6 py-4 sm:flex-row sm:justify-end">
          {canCorrectRejected && display ? (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto text-amber-800 border-amber-200 hover:bg-amber-50"
              onClick={() => {
                onOpenChange(false)
                onCorrectRejected(display)
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Corregir y reenviar
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
