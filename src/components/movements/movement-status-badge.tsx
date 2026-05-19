'use client'

import { Badge } from '@/components/ui/badge'
import type { MovementStatus } from '@/lib/validations/movement'

interface MovementStatusBadgeProps {
  status: MovementStatus
}

const statusConfig: Record<MovementStatus, { label: string; className: string }> = {
  draft: {
    label: 'Borrador',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  pending: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  approved: {
    label: 'Aprobado',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  rejected: {
    label: 'Rechazado',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  cancelled: {
    label: 'Anulado',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}

export function MovementStatusBadge({ status }: MovementStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  )
}
