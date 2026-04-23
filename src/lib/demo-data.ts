import type { Transaction } from '@/lib/actions/transactions'

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
  type: string
}

// ============================================================================
// CUENTAS DEMO
// ============================================================================
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-acc-1',
    name: 'Cuenta Corriente',
    type: 'bank',
    currency: 'COP',
    balance: 15500000,
  },
  {
    id: 'demo-acc-2',
    name: 'Ahorros',
    type: 'bank',
    currency: 'COP',
    balance: 8200000,
  },
  {
    id: 'demo-acc-3',
    name: 'Efectivo',
    type: 'cash',
    currency: 'COP',
    balance: 850000,
  },
]

// ============================================================================
// CATEGORÍAS DEMO
// ============================================================================
export const DEMO_CATEGORIES: DemoCategory[] = [
  // Ingresos
  {
    id: 'demo-cat-1',
    name: 'Ventas',
    type: 'income',
  },
  {
    id: 'demo-cat-4',
    name: 'Servicios',
    type: 'income',
  },
  {
    id: 'demo-cat-5',
    name: 'Otros Ingresos',
    type: 'income',
  },
  // Costos
  {
    id: 'demo-cat-2',
    name: 'Nómina',
    type: 'admin_expense',
  },
  {
    id: 'demo-cat-3',
    name: 'Insumos',
    type: 'cost',
  },
  {
    id: 'demo-cat-6',
    name: 'Transporte',
    type: 'commercial_expense',
  },
  {
    id: 'demo-cat-7',
    name: 'Intereses Bancarios',
    type: 'financial_expense',
  },
  {
    id: 'demo-cat-8',
    name: 'Servicios Públicos',
    type: 'admin_expense',
  },
  {
    id: 'demo-cat-9',
    name: 'Marketing',
    type: 'commercial_expense',
  },
]

// ============================================================================
// TRANSACCIONES DEMO
// ============================================================================
export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'demo-1',
    accountId: 'demo-acc-1',
    accountName: 'Cuenta Corriente',
    categoryId: 'demo-cat-1',
    categoryName: 'Ventas',
    type: 'income',
    status: 'posted',
    method: 'transfer',
    amount: 2500000,
    currency: 'COP',
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
    categoryName: 'Nómina',
    type: 'expense',
    status: 'approved',
    method: 'transfer',
    amount: 1500000,
    currency: 'COP',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    description: 'Pago de nómina mensual',
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
  },
  {
    id: 'demo-3',
    accountId: 'demo-acc-2',
    accountName: 'Ahorros',
    categoryId: 'demo-cat-4',
    categoryName: 'Servicios',
    type: 'income',
    status: 'pending',
    method: 'card',
    amount: 800000,
    currency: 'COP',
    date: new Date(Date.now() - 86400000).toISOString(),
    description: 'Servicios de consultoría',
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
  },
  {
    id: 'demo-4',
    accountId: 'demo-acc-3',
    accountName: 'Efectivo',
    categoryId: 'demo-cat-3',
    categoryName: 'Insumos',
    type: 'expense',
    status: 'draft',
    method: 'cash',
    amount: 500000,
    currency: 'COP',
    date: new Date().toISOString(),
    description: 'Compra de insumos de oficina',
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
    status: 'posted',
    method: 'transfer',
    amount: 1000000,
    currency: 'COP',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    description: 'Transferencia entre cuentas',
    createdAt: new Date().toISOString(),
    createdBy: 'demo-user-001',
    creatorName: 'Usuario Demo',
  },
]

// ============================================================================
// ESTADÍSTICAS DEMO
// ============================================================================
export const DEMO_STATS = {
  totalTransactions: DEMO_TRANSACTIONS.length,
  pendingCount: DEMO_TRANSACTIONS.filter(t => t.status === 'pending').length,
  approvedCount: DEMO_TRANSACTIONS.filter(t => t.status === 'approved').length,
  postedCount: DEMO_TRANSACTIONS.filter(t => t.status === 'posted').length,
  totalIncome: DEMO_TRANSACTIONS
    .filter(t => t.type === 'income' && t.status === 'posted')
    .reduce((sum, t) => sum + t.amount, 0),
  totalExpenses: DEMO_TRANSACTIONS
    .filter(t => t.type === 'expense' && t.status === 'posted')
    .reduce((sum, t) => sum + t.amount, 0),
}