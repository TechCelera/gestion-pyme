import {
  ArrowRightLeft,
  CreditCard,
  Settings,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { MovementMethod, MovementType } from '@/lib/validations/movement'

export const MOVEMENT_FORM_COPY: Record<
  MovementType,
  { title: string; subtitle: string; submitLabel: string }
> = {
  income: {
    title: 'Registrar ingreso',
    subtitle: 'Plata que entró a tu empresa',
    submitLabel: 'Registrar ingreso',
  },
  expense: {
    title: 'Registrar egreso',
    subtitle: 'Plata que salió de tu empresa',
    submitLabel: 'Registrar egreso',
  },
  transfer: {
    title: 'Transferencia',
    subtitle: 'Pasá plata de una cuenta a otra',
    submitLabel: 'Registrar transferencia',
  },
  adjustment: {
    title: 'Ajuste de saldo',
    subtitle: 'Corregí un error o conciliá una cuenta',
    submitLabel: 'Registrar ajuste',
  },
}

export const MOVEMENT_TYPE_OPTIONS: {
  value: MovementType
  label: string
  icon: LucideIcon
  color: string
}[] = [
  { value: 'income', label: 'Ingreso', icon: Wallet, color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'expense', label: 'Egreso', icon: CreditCard, color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'transfer', label: 'Transferencia', icon: ArrowRightLeft, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'adjustment', label: 'Ajuste', icon: Settings, color: 'bg-orange-100 text-orange-700 border-orange-200' },
]

export const MOVEMENT_METHODS: { value: MovementMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'digital', label: 'Billetera Digital' },
  { value: 'other', label: 'Otro' },
]

export const MOVEMENT_CURRENCIES = [
  { value: 'ARS', label: 'ARS ($)', flag: '🇦🇷' },
  { value: 'USD', label: 'USD ($)', flag: '🇺🇸' },
  { value: 'COP', label: 'COP ($)', flag: '🇨🇴' },
  { value: 'EUR', label: 'EUR (€)', flag: '🇪🇺' },
] as const
