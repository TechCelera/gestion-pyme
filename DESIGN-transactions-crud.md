# Design: CRUD de Transacciones

## Technical Approach

Extender la arquitectura Clean Architecture existente para soportar el flujo completo de transacciones con estados (draft → pending → approved → posted), tipos extendidos (income, expense, transfer, adjustment), y permisos granulares por rol. El enfoque es evolutivo: extender las entidades y schema existentes sin romper compatibilidad.

## Architecture Decisions

### Decision: Estados de Transacción con Máquina de Estados

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Enum simple en DB | Simple pero sin validación de transiciones | ❌ Rejected |
| State machine en código (TS) | Flexible, testeable, rollback fácil | ✅ Chosen |
| State machine en DB (triggers) | Seguro pero difícil de debuggear | ❌ Rejected |

**Rationale**: La validación de transiciones en TypeScript permite mejor DX y testing unitario. El RPC `update_transaction_status` es la única entrada para cambios de estado, centralizando la lógica.

### Decision: Server Actions vs API Routes

| Option | Tradeoff | Decision |
|--------|----------|----------|
| API Routes (/api/transactions) | RESTful pero más boilerplate | ❌ Rejected |
| Server Actions | Menos código, mejor integración Next.js, caché automática | ✅ Chosen |

**Rationale**: Next.js 15+ optimiza Server Actions con caché y revalidación automática. Menos código que mantener.

### Decision: Validación Dónde

| Layer | Responsabilidad |
|-------|-----------------|
| UI (Zod) | Validación de formulario, mensajes amigables |
| Domain | Validación de negocio (período cerrado, transiciones estado) |
| DB (RLS + Triggers) | Seguridad última instancia, constraints de integridad |

**Rationale**: Validación en múltiples capas = defense in depth. La UI da feedback inmediato, el domain protege la lógica, la BD protege los datos.

### Decision: Caché y Revalidación

| Estrategia | Implementación |
|------------|----------------|
| Lista de transacciones | `revalidateTag('transactions')` en mutaciones |
| Filtros en URL | Query params = shareable, history funciona |
| Detalle de transacción | Cache individual con `transaction-{id}` tag |

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│  TransactionTable → TransactionForm → TransactionFilters      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Zustand Store                              │
│  transaction-store.ts (estado local + caché)                 │
│  - transactions[]                                             │
│  - filters                                                    │
│  - pagination                                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server Actions                              │
│  createTransaction() → updateTransaction() →                │
│  updateTransactionStatus() → deleteTransaction()              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Domain Layer                                │
│  Use Cases: CreateTransaction, UpdateTransaction,             │
│            UpdateTransactionStatus, DeleteTransaction         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   DB Layer                                    │
│  Drizzle Schema → RPC Functions → RLS Policies                │
└─────────────────────────────────────────────────────────────┘
```

## File Changes

### Domain Layer (packages/domain)

| File | Action | Description |
|------|--------|-------------|
| `src/entities/index.ts` | Modify | Extender TransactionType con 'transfer' \| 'adjustment', agregar TransactionStatus |
| `src/entities/transaction.ts` | Create | Entidad Transaction extendida con nuevos campos |
| `src/use-cases/index.ts` | Modify | Exportar nuevos use cases |
| `src/use-cases/create-transaction.ts` | Modify | Extender para soportar todos los tipos y validaciones |
| `src/use-cases/update-transaction.ts` | Create | Actualizar transacción en estado DRAFT |
| `src/use-cases/update-transaction-status.ts` | Create | Máquina de estados de transacción |
| `src/use-cases/delete-transaction.ts` | Create | Soft delete de transacciones DRAFT |
| `src/repositories/index.ts` | Modify | Extender TransactionRepository con nuevos métodos |
| `src/errors/index.ts` | Modify | Agregar errores de dominio específicos |

### DB Layer (packages/db)

| File | Action | Description |
|------|--------|-------------|
| `src/schema/index.ts` | Modify | Extender tabla transactions con nuevos campos |
| `src/repositories/transaction-repository.ts` | Create | Implementación Supabase del repositorio |
| `src/rls/transactions.sql` | Create | Políticas RLS para transacciones |
| `src/migrations/002_extend_transactions.sql` | Create | Migración para extender tabla |

### Web Layer (apps/web)

| File | Action | Description |
|------|--------|-------------|
| `src/app/(dashboard)/transactions/page.tsx` | Create | Página principal de transacciones |
| `src/app/(dashboard)/transactions/layout.tsx` | Create | Layout con metadatos |
| `src/stores/transaction-store.ts` | Create | Store Zustand para transacciones |
| `src/hooks/use-transactions.ts` | Create | Hook para listar transacciones |
| `src/hooks/use-create-transaction.ts` | Create | Hook para crear transacción |
| `src/hooks/use-update-transaction.ts` | Create | Hook para actualizar transacción |
| `src/hooks/use-transaction-status.ts` | Create | Hook para cambiar estado |
| `src/hooks/use-delete-transaction.ts` | Create | Hook para eliminar transacción |
| `src/components/transactions/transaction-table.tsx` | Create | Tabla de transacciones con sorting |
| `src/components/transactions/transaction-filters.tsx` | Create | Filtros avanzados con URL sync |
| `src/components/transactions/transaction-modal.tsx` | Create | Modal crear/editar |
| `src/components/transactions/transaction-form.tsx` | Create | Formulario dinámico por tipo |
| `src/components/transactions/transaction-status-badge.tsx` | Create | Badge de estado con colores |
| `src/components/transactions/transaction-actions.tsx` | Create | Botones de acción por fila |
| `src/lib/actions/transactions.ts` | Create | Server Actions para transacciones |
| `src/lib/validations/transaction.ts` | Create | Schemas Zod para validación |

## Interfaces / Contracts

### Domain Entity

```typescript
// packages/domain/src/entities/transaction.ts
export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment'
export type TransactionStatus = 'draft' | 'pending' | 'approved' | 'posted' | 'rejected'
export type TransactionMethod = 'accrual' | 'cash'

export interface Transaction {
  readonly id: string
  readonly companyId: string
  readonly accountId: string
  readonly categoryId: string | null
  readonly type: TransactionType
  readonly method: TransactionMethod
  readonly status: TransactionStatus
  readonly amount: number
  readonly currency: string
  readonly exchangeRate: number | null
  readonly date: Date
  readonly description: string
  
  // Campos específicos por tipo
  readonly contactId: string | null
  readonly contactType: 'cliente' | 'proveedor' | null
  readonly sourceAccountId: string | null
  readonly destinationAccountId: string | null
  readonly adjustmentReason: 'reconciliation' | 'correction' | 'other' | null
  
  // Documento
  readonly documentType: 'invoice' | 'receipt' | 'ticket' | 'other' | null
  readonly documentNumber: string | null
  readonly attachmentUrl: string | null
  
  // Metadatos
  readonly createdBy: string
  readonly updatedBy: string
  readonly approvedBy: string | null
  readonly approvedAt: Date | null
  readonly postedBy: string | null
  readonly postedAt: Date | null
  readonly rejectedBy: string | null
  readonly rejectedAt: Date | null
  readonly rejectionReason: string | null
  
  // Timestamps
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null
  readonly deletedBy: string | null
}
```

### State Machine

```typescript
// Valid transitions
const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
  draft: ['pending', 'deleted'],
  pending: ['approved', 'rejected'],
  approved: ['posted', 'draft'],
  posted: ['reversed'],
  rejected: ['draft', 'pending'],
}
```

### Server Actions

```typescript
// apps/web/src/lib/actions/transactions.ts
'use server'

export async function createTransaction(
  data: CreateTransactionInput
): Promise<{ success: true; data: Transaction } | { success: false; error: string }>

export async function updateTransaction(
  id: string,
  data: UpdateTransactionInput
): Promise<{ success: true; data: Transaction } | { success: false; error: string }>

export async function updateTransactionStatus(
  id: string,
  newStatus: TransactionStatus,
  reason?: string
): Promise<{ success: true } | { success: false; error: string }>

export async function deleteTransaction(
  id: string
): Promise<{ success: true } | { success: false; error: string }>

export async function getTransactions(
  filters: TransactionFilters
): Promise<{ success: true; data: Transaction[]; total: number } | { success: false; error: string }>
```

### Zustand Store

```typescript
// apps/web/src/stores/transaction-store.ts
interface TransactionState {
  transactions: Transaction[]
  filters: TransactionFilters
  pagination: { page: number; pageSize: number; total: number }
  isLoading: boolean
  error: string | null
  
  // Actions
  setFilters: (filters: TransactionFilters) => void
  setPagination: (pagination: Partial<TransactionState['pagination']>) => void
  fetchTransactions: () => Promise<void>
  createTransaction: (data: CreateTransactionInput) => Promise<void>
  updateTransaction: (id: string, data: UpdateTransactionInput) => Promise<void>
  updateStatus: (id: string, status: TransactionStatus, reason?: string) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Domain | Use cases (create, update, status transitions) | Unit tests con Vitest, mocks de repos |
| Domain | State machine validaciones | Unit tests con Vitest |
| DB | Repository implementations | Integration tests con testcontainers |
| DB | RLS policies | SQL tests con pgTAP |
| Web | Server Actions | Integration tests con MSW |
| Web | Components | React Testing Library, user-event |
| E2E | Flujos completos | Playwright (crear → aprobar → postear) |

## Migration / Rollout

### Fase 1: DB (sin downtime)
```sql
-- Migración 002: Extender tabla sin romper existente
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'posted',
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'income',
  -- ... otros campos
```

### Fase 2: Backfill
- Script para establecer `status = 'posted'` en transacciones existentes
- Script para migrar `type` según datos existentes

### Fase 3: Feature Flag
- Crear flag `ENABLE_TRANSACTION_WORKFLOW` en tabla `features`
- Mostrar UI nueva solo cuando flag = true

### Fase 4: Rollout Gradual
- 10% usuarios → 50% → 100%
- Monitorear errores en Sentry

## Open Questions

- [ ] ¿Se necesita soporte para múltiples monedas en una misma transacción?
- [ ] ¿La reversión de POSTED crea transacción contraria o anula la original?
- [ ] ¿Se requiere notificación email para aprobaciones pendientes?

## Size Budget

- **Design document**: 800 words ✓
- **Domain code**: Minimal, solo entidades y use cases
- **Web layer**: Server Actions + Zustand + Components
- **Total files nuevos**: ~25 archivos
- **Files modificados**: ~6 archivos

## Notes

- La tabla `transactions` YA EXISTE - esta es extensión, no recreación
- Los triggers de soft delete y audit log YA ESTÁN configurados
- El sistema de períodos YA EXISTE - usar `fn_check_period_closed`
- Usar mismo patrón que `create-transaction.ts` existente
