import type { Movement } from '@/lib/actions/movements'
import type { ChartAccountWithBalance } from '@/lib/chart-of-accounts-balances'
import type { ChartOfAccountsSnapshot } from '@/lib/actions/chart-of-accounts'

// Tipos compartidos para demo data
export interface DemoAccount {
  id: string
  name: string
  type: string
  currency: string
  balance: number
}

export interface DemoCategory {
  id: string
  name: string
  type: 'income' | 'expense'
}

// ============================================================================
// PLAN DE CUENTAS DEMO
// ============================================================================
const DEMO_CHART_ROWS: ChartAccountWithBalance[] = [
  { id: 'demo-coa-1', parentId: null, code: '1', name: 'Activo', accountType: 'asset', isPostable: false, sortOrder: 10, balance: 0 },
  { id: 'demo-coa-11', parentId: 'demo-coa-1', code: '1.1', name: 'Activos Corrientes', accountType: 'asset', isPostable: false, sortOrder: 20, balance: 0 },
  { id: 'demo-coa-111', parentId: 'demo-coa-11', code: '1.1.1', name: 'Caja ARS', accountType: 'asset', isPostable: true, sortOrder: 101, balance: 850_000 },
  { id: 'demo-coa-112', parentId: 'demo-coa-11', code: '1.1.3', name: 'Bancos', accountType: 'asset', isPostable: true, sortOrder: 103, balance: 16_380_000 },
  { id: 'demo-coa-12', parentId: 'demo-coa-1', code: '1.2', name: 'Créditos', accountType: 'asset', isPostable: false, sortOrder: 30, balance: 0 },
  { id: 'demo-coa-121', parentId: 'demo-coa-12', code: '1.2.1', name: 'Clientes', accountType: 'asset', isPostable: true, sortOrder: 201, balance: 2_450_000 },
  { id: 'demo-coa-2', parentId: null, code: '2', name: 'Pasivo', accountType: 'liability', isPostable: false, sortOrder: 50, balance: 0 },
  { id: 'demo-coa-21', parentId: 'demo-coa-2', code: '2.1', name: 'Pasivos Corrientes', accountType: 'liability', isPostable: false, sortOrder: 60, balance: 0 },
  { id: 'demo-coa-211', parentId: 'demo-coa-21', code: '2.1.1', name: 'Proveedores', accountType: 'liability', isPostable: true, sortOrder: 601, balance: 980_000 },
  { id: 'demo-coa-3', parentId: null, code: '3', name: 'Patrimonio Neto', accountType: 'equity', isPostable: false, sortOrder: 70, balance: 0 },
  { id: 'demo-coa-31', parentId: 'demo-coa-3', code: '3.2', name: 'Resultados Acumulados', accountType: 'equity', isPostable: true, sortOrder: 702, balance: 18_700_000 },
  { id: 'demo-coa-4', parentId: null, code: '4', name: 'Ingresos', accountType: 'income', isPostable: false, sortOrder: 80, balance: 0 },
  { id: 'demo-coa-41', parentId: 'demo-coa-4', code: '4.1', name: 'Ingresos por servicios', accountType: 'income', isPostable: true, sortOrder: 801, balance: 24_500_000 },
  { id: 'demo-coa-5', parentId: null, code: '5', name: 'Egresos', accountType: 'expense', isPostable: false, sortOrder: 90, balance: 0 },
  { id: 'demo-coa-51', parentId: 'demo-coa-5', code: '5.1', name: 'Gastos operativos', accountType: 'expense', isPostable: true, sortOrder: 901, balance: 5_800_000 },
]

export const DEMO_CHART_OF_ACCOUNTS = DEMO_CHART_ROWS

export const DEMO_CHART_SNAPSHOT: ChartOfAccountsSnapshot = {
  asOf: new Date().toISOString().slice(0, 10),
  currency: 'ARS',
  rows: DEMO_CHART_ROWS,
}

// ============================================================================
// CUENTAS DEMO
// ============================================================================
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-acc-1',
    name: 'Cuenta Corriente',
    type: 'bank',
    currency: 'ARS',
    balance: 15500000,
  },
  {
    id: 'demo-acc-2',
    name: 'Cuenta de Ahorros',
    type: 'bank',
    currency: 'ARS',
    balance: 8200000,
  },
  {
    id: 'demo-acc-3',
    name: 'Caja',
    type: 'cash',
    currency: 'ARS',
    balance: 850000,
  },
]

// ============================================================================
// CATEGORÍAS DEMO
// ============================================================================
export const DEMO_CATEGORIES: DemoCategory[] = [
  { id: 'demo-cat-1', name: 'Ventas', type: 'income' },
  { id: 'demo-cat-4', name: 'Servicios', type: 'income' },
  { id: 'demo-cat-5', name: 'Otros Ingresos', type: 'income' },
  { id: 'demo-cat-2', name: 'Sueldos y Salarios', type: 'expense' },
  { id: 'demo-cat-3', name: 'Materiales y Suministros', type: 'expense' },
  { id: 'demo-cat-6', name: 'Transporte y Logística', type: 'expense' },
  { id: 'demo-cat-7', name: 'Intereses Bancarios', type: 'expense' },
  { id: 'demo-cat-8', name: 'Servicios Públicos', type: 'expense' },
  { id: 'demo-cat-9', name: 'Publicidad y Marketing', type: 'expense' },
]

// ============================================================================
// MOVIMIENTOS DEMO
// ============================================================================
export const DEMO_MOVEMENTS: Movement[] = [
  {
    id: 'demo-1',
    accountId: 'demo-acc-1',
    accountName: 'Cuenta Corriente',
    categoryId: 'demo-cat-1',
    categoryName: 'Ventas',
    type: 'income',
    status: 'approved',
    method: 'transfer',
    amount: 2500000,
    currency: 'ARS',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    description: 'Venta de software a cliente corporativo',
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
  },
  {
    id: 'demo-2',
    accountId: 'demo-acc-1',
    accountName: 'Cuenta Corriente',
    categoryId: 'demo-cat-2',
    categoryName: 'Sueldos y Salarios',
    type: 'expense',
    status: 'approved',
    method: 'transfer',
    amount: 1500000,
    currency: 'ARS',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    description: 'Pago de sueldos mensual',
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
  },
  {
    id: 'demo-3',
    accountId: 'demo-acc-2',
    accountName: 'Cuenta de Ahorros',
    categoryId: 'demo-cat-4',
    categoryName: 'Servicios',
    type: 'income',
    status: 'pending',
    method: 'card',
    amount: 800000,
    currency: 'ARS',
    date: new Date(Date.now() - 86400000).toISOString(),
    description: 'Servicios de consultoría',
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
  },
  {
    id: 'demo-4',
    accountId: 'demo-acc-3',
    accountName: 'Caja',
    categoryId: 'demo-cat-3',
    categoryName: 'Materiales y Suministros',
    type: 'expense',
    status: 'draft',
    method: 'cash',
    amount: 500000,
    currency: 'ARS',
    date: new Date().toISOString(),
    description: 'Compra de materiales de oficina',
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
  },
  {
    id: 'demo-5',
    accountId: 'demo-acc-1',
    accountName: 'Cuenta Corriente',
    categoryId: null,
    categoryName: null,
    type: 'transfer',
    status: 'approved',
    method: 'transfer',
    amount: 1000000,
    currency: 'ARS',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    description: 'Transferencia entre cuentas',
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
  },
]

export const DEMO_STATS = {
  totalMovements: DEMO_MOVEMENTS.length,
  pendingCount: DEMO_MOVEMENTS.filter((t) => t.status === 'pending').length,
  approvedCount: DEMO_MOVEMENTS.filter((t) => t.status === 'approved').length,
  totalIncome: DEMO_MOVEMENTS.filter((t) => t.type === 'income' && t.status === 'approved').reduce(
    (sum, t) => sum + t.amount,
    0
  ),
  totalExpenses: DEMO_MOVEMENTS.filter((t) => t.type === 'expense' && t.status === 'approved').reduce(
    (sum, t) => sum + t.amount,
    0
  ),
}