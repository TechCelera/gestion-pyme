/**
 * Configuraciones por defecto por país.
 * Cada país define moneda, cuentas típicas (caja, banco) y categorías para arrancar.
 */

import type { CategoryType } from '@/lib/validations/category'

export interface CountryConfig {
  code: string
  name: string
  flag: string
  currency: string
  currencySymbol: string
  accounts: { name: string; type: string; currency: string }[]
  categories: { name: string; type: CategoryType }[]
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  AR: {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    currencySymbol: '$',
    accounts: [
      { name: 'Caja', type: 'cash', currency: 'ARS' },
      { name: 'Cuenta Corriente', type: 'bank', currency: 'ARS' },
      { name: 'Cuenta de Ahorros', type: 'bank', currency: 'ARS' },
    ],
    categories: [
      { name: 'Ventas de Productos', type: 'income' },
      { name: 'Ventas de Servicios', type: 'income' },
      { name: 'Otros Ingresos', type: 'income' },
      { name: 'Costo de Mercadería', type: 'expense' },
      { name: 'Sueldos y Jornales', type: 'expense' },
      { name: 'Servicios Públicos', type: 'expense' },
      { name: 'Alquiler', type: 'expense' },
      { name: 'Publicidad y Marketing', type: 'expense' },
      { name: 'Transporte y Logística', type: 'expense' },
      { name: 'Intereses Bancarios', type: 'expense' },
      { name: 'Comisiones Bancarias', type: 'expense' },
    ],
  },
  CO: {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    currencySymbol: '$',
    accounts: [
      { name: 'Caja', type: 'cash', currency: 'COP' },
      { name: 'Cuenta Corriente', type: 'bank', currency: 'COP' },
      { name: 'Cuenta de Ahorros', type: 'bank', currency: 'COP' },
    ],
    categories: [
      { name: 'Ventas de Productos', type: 'income' },
      { name: 'Ventas de Servicios', type: 'income' },
      { name: 'Otros Ingresos', type: 'income' },
      { name: 'Costo de Mercancía', type: 'expense' },
      { name: 'Sueldos y Salarios', type: 'expense' },
      { name: 'Servicios Públicos', type: 'expense' },
      { name: 'Arriendo', type: 'expense' },
      { name: 'Publicidad y Marketing', type: 'expense' },
      { name: 'Transporte y Logística', type: 'expense' },
      { name: 'Intereses Bancarios', type: 'expense' },
      { name: 'Comisiones Bancarias', type: 'expense' },
    ],
  },
}

export const COUNTRY_OPTIONS = [
  { value: 'AR', label: 'Argentina', flag: '🇦🇷' },
  { value: 'CO', label: 'Colombia', flag: '🇨🇴' },
] as const
