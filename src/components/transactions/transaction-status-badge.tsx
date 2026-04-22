'use client'

import { Badge } from '@/components/ui/badge'
import type { TransactionStatus } from '@/lib/validations/transaction'

interface TransactionStatusBadgeProps {
  status: TransactionStatus
}

const statusConfig: Record<TransactionStatus, { label: string; className: string }> = {
  draft: {
    label: 'Borrador',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  approved: {
    label: 'Aprobado',
    className: 'bg-[#7B68EE]/10 text-[#7B68EE] border-[#7B68EE]/20',
  },
  posted: {
    label: 'Contabilizado',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  rejected: {
    label: 'Rechazado',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}
