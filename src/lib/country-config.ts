/**
 * Configuraciones por defecto por país.
 * Cada país tiene sus propias cuentas, categorías y moneda predeterminada.
 */

export interface CountryConfig {
  code: string
  name: string
  flag: string
  currency: string
  currencySymbol: string
  accounts: { name: string; type: string; currency: string }[]
  categories: { name: string; type: string }[]
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
      // Ingresos
      { name: 'Ventas de Productos', type: 'income' },
      { name: 'Ventas de Servicios', type: 'income' },
      { name: 'Otros Ingresos', type: 'income' },
      // Costos
      { name: 'Costo de Mercadería', type: 'cost' },
      // Gastos Administrativos
      { name: 'Sueldos y Jornales', type: 'admin_expense' },
      { name: 'Servicios Públicos', type: 'admin_expense' },
      { name: 'Alquiler', type: 'admin_expense' },
      // Gastos Comerciales
      { name: 'Publicidad y Marketing', type: 'commercial_expense' },
      { name: 'Transporte y Logística', type: 'commercial_expense' },
      // Gastos Financieros
      { name: 'Intereses Bancarios', type: 'financial_expense' },
      { name: 'Comisiones Bancarias', type: 'financial_expense' },
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
      // Ingresos
      { name: 'Ventas de Productos', type: 'income' },
      { name: 'Ventas de Servicios', type: 'income' },
      { name: 'Otros Ingresos', type: 'income' },
      // Costos
      { name: 'Costo de Mercancía', type: 'cost' },
      // Gastos Administrativos
      { name: 'Sueldos y Salarios', type: 'admin_expense' },
      { name: 'Servicios Públicos', type: 'admin_expense' },
      { name: 'Arriendo', type: 'admin_expense' },
      // Gastos Comerciales
      { name: 'Publicidad y Marketing', type: 'commercial_expense' },
      { name: 'Transporte y Logística', type: 'commercial_expense' },
      // Gastos Financieros
      { name: 'Intereses Bancarios', type: 'financial_expense' },
      { name: 'Comisiones Bancarias', type: 'financial_expense' },
    ],
  },
}

export const COUNTRY_OPTIONS = [
  { value: 'AR', label: 'Argentina', flag: '🇦🇷' },
  { value: 'CO', label: 'Colombia', flag: '🇨🇴' },
] as const
