# Tasks: CRUD de Transacciones

## Change Info
- **ID**: transactions-crud
- **Proyecto**: Gestion PYME Pro
- **Stack**: Next.js 14 + TypeScript + Supabase + shadcn/ui + Zustand
- **Estructura**: Monorepo Turborepo

---

## Phase 1: Base de Datos ✅

- [x] **TX-001** Crear migración SQL: Extender tabla transactions con nuevos campos (status, type extendido, campos específicos por tipo, metadatos de aprobación)
- [x] **TX-002** Crear función RPC: `create_transaction()` con validaciones de período cerrado y tipos de transacción
- [x] **TX-003** Crear función RPC: `update_transaction_status()` con máquina de estados y registro de metadatos
- [x] **TX-004** Crear función RPC: `get_transactions()` con filtros y paginación
- [x] **TX-005** Configurar políticas RLS: Company isolation, insert, update draft, no update posted, approve, delete

---

## Phase 2: Domain Layer (packages/domain)

- [ ] **TX-006** Extender `src/entities/index.ts`: Agregar TransactionType extendido, TransactionStatus, TransactionMethod
- [ ] **TX-007** Crear `src/entities/transaction.ts`: Entidad Transaction con todos los campos nuevos
- [ ] **TX-008** Crear `src/errors/index.ts`: Agregar errores de dominio (PeriodClosedError, InvalidTransitionError, UnauthorizedError)
- [ ] **TX-009** Crear `src/use-cases/create-transaction.ts`: Use case con validaciones de negocio
- [ ] **TX-010** Crear `src/use-cases/update-transaction.ts`: Use case para actualizar transacciones DRAFT
- [ ] **TX-011** Crear `src/use-cases/update-transaction-status.ts`: Use case con máquina de estados
- [ ] **TX-012** Crear `src/use-cases/delete-transaction.ts`: Use case para soft delete de transacciones DRAFT
- [ ] **TX-013** Extender `src/use-cases/index.ts`: Exportar nuevos use cases
- [ ] **TX-014** Extender `src/repositories/index.ts`: Agregar métodos al TransactionRepository interface

---

## Phase 3: DB Layer (packages/db)

- [ ] **TX-015** Extender `src/schema/index.ts`: Agregar campos extendidos a tabla transactions en Drizzle schema
- [ ] **TX-016** Crear `src/repositories/transaction-repository.ts`: Implementación Supabase con RPC functions
- [ ] **TX-017** Crear `src/rls/transactions.sql`: Políticas RLS para transacciones

---

## Phase 4: Backend / Server Actions (apps/web)

- [ ] **TX-018** Crear `src/lib/validations/transaction.ts`: Schemas Zod para CreateTransactionInput, UpdateTransactionInput, TransactionFilters
- [ ] **TX-019** Crear `src/lib/actions/transactions.ts`: Server Actions - createTransaction()
- [ ] **TX-020** Crear `src/lib/actions/transactions.ts`: Server Actions - updateTransaction()
- [ ] **TX-021** Crear `src/lib/actions/transactions.ts`: Server Actions - updateTransactionStatus()
- [ ] **TX-022** Crear `src/lib/actions/transactions.ts`: Server Actions - deleteTransaction()
- [ ] **TX-023** Crear `src/lib/actions/transactions.ts`: Server Actions - getTransactions()

---

## Phase 5: Frontend Core - Store y Hooks (apps/web)

- [ ] **TX-024** Crear `src/stores/transaction-store.ts`: Zustand store con estado, filtros, paginación y acciones CRUD
- [ ] **TX-025** Crear `src/hooks/use-transactions.ts`: Hook para listar transacciones con filtros y paginación
- [ ] **TX-026** Crear `src/hooks/use-create-transaction.ts`: Hook para crear transacción con manejo de errores
- [ ] **TX-027** Crear `src/hooks/use-update-transaction.ts`: Hook para actualizar transacción
- [ ] **TX-028** Crear `src/hooks/use-transaction-status.ts`: Hook para cambiar estado de transacción
- [ ] **TX-029** Crear `src/hooks/use-delete-transaction.ts`: Hook para eliminar transacción con confirmación

---

## Phase 6: UI Components (apps/web)

- [ ] **TX-030** Crear `src/components/transactions/transaction-status-badge.tsx`: Badge de estado con colores (draft, pending, approved, posted, rejected)
- [ ] **TX-031** Crear `src/components/transactions/transaction-filters.tsx`: Filtros avanzados con sync a URL query params
- [ ] **TX-032** Crear `src/components/transactions/transaction-form.tsx`: Formulario dinámico con campos condicionales por tipo
- [ ] **TX-033** Crear `src/components/transactions/transaction-modal.tsx`: Modal crear/editar con TransactionForm
- [ ] **TX-034** Crear `src/components/transactions/transaction-actions.tsx`: Botones de acción por fila (editar, eliminar, aprobar, rechazar, postear)
- [ ] **TX-035** Crear `src/components/transactions/transaction-table.tsx`: Tabla con sorting, paginación y columnas dinámicas

---

## Phase 7: Pages y Layout (apps/web)

- [ ] **TX-036** Crear `src/app/(dashboard)/transactions/layout.tsx`: Layout con metadatos y providers
- [ ] **TX-037** Crear `src/app/(dashboard)/transactions/page.tsx`: Página principal integrando tabla, filtros, modal y acciones

---

## Phase 8: Testing

- [ ] **TX-038** Escribir tests unitarios: Domain use cases (create, update, status transitions) con Vitest
- [ ] **TX-039** Escribir tests unitarios: State machine validaciones
- [ ] **TX-040** Escribir tests integración: Server Actions con MSW
- [ ] **TX-041** Escribir tests componentes: TransactionTable, TransactionForm con React Testing Library
- [ ] **TX-042** Escribir tests E2E: Flujo completo crear → aprobar → postear con Playwright

---

## Task Dependencies Graph

```
Phase 1 (DB)
    │
    ▼
Phase 2 (Domain) ◄── TX-001
    │
    ▼
Phase 3 (DB Layer) ◄── TX-006, TX-007, TX-014
    │
    ▼
Phase 4 (Backend) ◄── TX-015, TX-016
    │
    ▼
Phase 5 (Frontend Core) ◄── TX-018, TX-019-TX-023
    │
    ▼
Phase 6 (UI Components) ◄── TX-024-TX-029
    │    │
    │    ▼
    └──► Phase 7 (Pages) ◄── TX-030-TX-035
              │
              ▼
         Phase 8 (Testing) ◄── TX-036, TX-037
```

---

## Task Details

### TX-001: Migración SQL - Extender tabla transactions
**Archivos**: `packages/db/src/migrations/002_extend_transactions.sql`
**Estimación**: M
**Criterios**:
- Agregar columnas: status, type extendido, method, contact_id, contact_type, source_account_id, destination_account_id, adjustment_reason, document_type, document_number, attachment_url, approved_by, approved_at, posted_by, posted_at, rejected_by, rejected_at, rejection_reason
- Usar DEFAULT valores para compatibilidad con datos existentes
- Agregar CHECK constraints

### TX-002: RPC create_transaction()
**Archivos**: `packages/db/src/migrations/002_extend_transactions.sql` (functions)
**Estimación**: M
**Dependencias**: TX-001
**Criterios**:
- Validar período cerrado
- Validar campos requeridos por tipo
- Retornar UUID de transacción creada

### TX-003: RPC update_transaction_status()
**Archivos**: `packages/db/src/migrations/002_extend_transactions.sql` (functions)
**Estimación**: M
**Dependencias**: TX-001
**Criterios**:
- Validar transiciones de estado válidas
- Actualizar metadatos según nuevo estado (approved_by, posted_by, etc.)
- Llamar update_account_balance cuando pase a POSTED

### TX-004: RPC get_transactions()
**Archivos**: `packages/db/src/migrations/002_extend_transactions.sql` (functions)
**Estimación**: S
**Dependencias**: TX-001
**Criterios**:
- Soportar filtros: status[], type[], dateFrom, dateTo, accountId, categoryId, search
- Retornar con JOIN a accounts, categories, users
- Paginación con limit/offset

### TX-005: Políticas RLS
**Archivos**: `packages/db/src/rls/transactions.sql`
**Estimación**: M
**Dependencias**: TX-001
**Criterios**:
- Company isolation
- Insert: created_by = auth.uid()
- Update DRAFT: created_by = auth.uid() OR admin+
- No update POSTED
- Approve: solo admin+
- Delete: solo DRAFT y propias o admin+

### TX-006: Extender entities/index.ts
**Archivos**: `packages/domain/src/entities/index.ts`
**Estimación**: XS
**Criterios**:
- Exportar TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment'
- Exportar TransactionStatus = 'draft' | 'pending' | 'approved' | 'posted' | 'rejected'
- Exportar TransactionMethod = 'accrual' | 'cash'

### TX-007: Crear entidad Transaction
**Archivos**: `packages/domain/src/entities/transaction.ts`
**Estimación**: S
**Dependencias**: TX-006
**Criterios**:
- Interface con todos los campos de la tabla
- Campos readonly para inmutabilidad
- Tipos específicos para campos condicionales

### TX-008: Errores de dominio
**Archivos**: `packages/domain/src/errors/index.ts`
**Estimación**: XS
**Criterios**:
- PeriodClosedError
- InvalidTransitionError
- UnauthorizedError
- InsufficientFundsError

### TX-009: Use case create-transaction
**Archivos**: `packages/domain/src/use-cases/create-transaction.ts`
**Estimación**: M
**Dependencias**: TX-007, TX-008
**Criterios**:
- Validar período cerrado
- Validar campos según tipo
- Validar permisos de rol
- Llamar a repositorio

### TX-010: Use case update-transaction
**Archivos**: `packages/domain/src/use-cases/update-transaction.ts`
**Estimación**: M
**Dependencias**: TX-007, TX-008
**Criterios**:
- Validar transacción existe y está en DRAFT
- Validar período cerrado
- Validar permisos
- No permitir cambiar tipo

### TX-011: Use case update-transaction-status
**Archivos**: `packages/domain/src/use-cases/update-transaction-status.ts`
**Estimación**: M
**Dependencias**: TX-007, TX-008
**Criterios**:
- Máquina de estados con validTransitions
- Validar usuario tiene permisos para transición
- Registrar metadatos de aprobación/rechazo/posteo

### TX-012: Use case delete-transaction
**Archivos**: `packages/domain/src/use-cases/delete-transaction.ts`
**Estimación**: S
**Dependencias**: TX-007, TX-008
**Criterios**:
- Solo permitir borrar DRAFT
- Validar permisos (propia o admin+)

### TX-013: Exportar use cases
**Archivos**: `packages/domain/src/use-cases/index.ts`
**Estimación**: XS
**Dependencias**: TX-009, TX-010, TX-011, TX-012
**Criterios**:
- Exportar todos los nuevos use cases

### TX-014: Extender TransactionRepository
**Archivos**: `packages/domain/src/repositories/index.ts`
**Estimación**: S
**Dependencias**: TX-007
**Criterios**:
- Métodos: create, update, updateStatus, delete, findById, findAll, count
- Tipos para filtros y paginación

### TX-015: Extender schema Drizzle
**Archivos**: `packages/db/src/schema/index.ts`
**Estimación**: M
**Dependencias**: TX-001
**Criterios**:
- Extender tabla transactions con nuevos campos
- Tipos TypeScript generados correctamente

### TX-016: Implementar TransactionRepository
**Archivos**: `packages/db/src/repositories/transaction-repository.ts`
**Estimación**: L
**Dependencias**: TX-014, TX-015
**Criterios**:
- Usar RPC functions
- Mapear respuestas a entidades Domain
- Manejo de errores

### TX-017: Políticas RLS SQL
**Archivos**: `packages/db/src/rls/transactions.sql`
**Estimación**: S
**Dependencias**: TX-001
**Criterios**:
- Políticas listadas en TX-005
- Habilitar RLS en tabla

### TX-018: Schemas Zod
**Archivos**: `apps/web/src/lib/validations/transaction.ts`
**Estimación**: M
**Criterios**:
- CreateTransactionSchema con validaciones condicionales
- UpdateTransactionSchema
- TransactionFiltersSchema
- Mensajes de error en español

### TX-019 a TX-023: Server Actions
**Archivos**: `apps/web/src/lib/actions/transactions.ts`
**Estimación**: L (grupo)
**Dependencias**: TX-016, TX-018
**Criterios**:
- 'use server'
- Validar input con Zod
- Llamar use cases del domain
- Retornar {success, data} o {success, error}
- Revalidar cache con revalidateTag('transactions')

### TX-024: Zustand Store
**Archivos**: `apps/web/src/stores/transaction-store.ts`
**Estimación**: M
**Dependencias**: TX-019-TX-023
**Criterios**:
- Estado: transactions[], filters, pagination, isLoading, error
- Actions: setFilters, setPagination, fetchTransactions, CRUD operations
- Integración con Server Actions

### TX-025 a TX-029: Hooks
**Archivos**: `apps/web/src/hooks/use-*.ts`
**Estimación**: M (grupo)
**Dependencias**: TX-024
**Criterios**:
- Cada hook maneja una operación CRUD
- Loading states
- Error handling con toast
- Optimistic updates donde aplica

### TX-030: TransactionStatusBadge
**Archivos**: `apps/web/src/components/transactions/transaction-status-badge.tsx`
**Estimación**: XS
**Criterios**:
- Props: status: TransactionStatus
- Colores: draft(gray), pending(yellow), approved(blue), posted(green), rejected(red)
- Label traducido

### TX-031: TransactionFilters
**Archivos**: `apps/web/src/components/transactions/transaction-filters.tsx`
**Estimación**: M
**Dependencias**: TX-030
**Criterios**:
- Filtros: status, type, date range, account, category, search
- Sync con URL query params
- Debounce 300ms en search
- Reset filters button

### TX-032: TransactionForm
**Archivos**: `apps/web/src/components/transactions/transaction-form.tsx`
**Estimación**: L
**Dependencias**: TX-018
**Criterios**:
- Form dinámico según tipo seleccionado
- Campos condicionales: income/expense (account, category), transfer (source, dest), adjustment (reason)
- Documento adjunto upload
- Validación en tiempo real con Zod

### TX-033: TransactionModal
**Archivos**: `apps/web/src/components/transactions/transaction-modal.tsx`
**Estimación**: S
**Dependencias**: TX-032
**Criterios**:
- Props: isOpen, onClose, transaction?
- Título dinámico: "Nueva Transacción" o "Editar Transacción"
- TransactionForm dentro
- Botones: Cancelar, Guardar Borrador, Enviar Aprobación

### TX-034: TransactionActions
**Archivos**: `apps/web/src/components/transactions/transaction-actions.tsx`
**Estimación**: M
**Dependencias**: TX-030
**Criterios**:
- Props: transaction, userRole, onEdit, onDelete, onApprove, onReject, onPost
- Mostrar botones según estado y permisos
- Confirmación con toast.promise para delete

### TX-035: TransactionTable
**Archivos**: `apps/web/src/components/transactions/transaction-table.tsx`
**Estimación**: L
**Dependencias**: TX-030, TX-034
**Criterios**:
- Tabla shadcn/ui con ColumnDef
- Sorting por columna
- Paginación
- Formato de moneda
- TransactionActions en cada fila
- Responsive scroll horizontal

### TX-036: Layout
**Archivos**: `apps/web/src/app/(dashboard)/transactions/layout.tsx`
**Estimación**: XS
**Criterios**:
- Metadata: title, description
- Providers si son necesarios

### TX-037: Page
**Archivos**: `apps/web/src/app/(dashboard)/transactions/page.tsx`
**Estimación**: M
**Dependencias**: TX-031, TX-033, TX-035, TX-024
**Criterios**:
- Header con título y botón "Nueva Transacción"
- TransactionFilters
- TransactionTable
- TransactionModal
- Atajos: Ctrl+N, Ctrl+F, Esc

### TX-038 a TX-042: Tests
**Archivos**: `**/*.test.ts`, `**/*.spec.ts`, `e2e/`
**Estimación**: L (grupo)
**Dependencias**: TX-037
**Criterios**:
- TX-038: Tests unitarios domain con Vitest
- TX-039: Tests state machine
- TX-040: Tests integración Server Actions con MSW
- TX-041: Tests componentes con RTL
- TX-042: Tests E2E con Playwright

---

## Summary

| Phase | Tasks | Focus | Est. Total |
|-------|-------|-------|------------|
| Phase 1 | 5 | Base de Datos | M(3) + S(2) = ~1.5d |
| Phase 2 | 9 | Domain Layer | M(3) + S(4) + XS(2) = ~2d |
| Phase 3 | 3 | DB Layer | L(1) + M(1) + S(1) = ~1.5d |
| Phase 4 | 6 | Backend | L(1) + M(5) = ~2d |
| Phase 5 | 6 | Frontend Core | M(6) = ~2d |
| Phase 6 | 6 | UI Components | L(2) + M(3) + XS(1) = ~2.5d |
| Phase 7 | 2 | Pages | M(1) + XS(1) = ~0.5d |
| Phase 8 | 5 | Testing | L(5) = ~3d |
| **Total** | **42** | | **~15 días** |

### Leyenda Estimaciones
- **XS**: < 2 horas
- **S**: 2-4 horas
- **M**: 4-8 horas (1 día)
- **L**: 8-16 horas (1-2 días)

### Próximos Pasos
1. Ejecutar Phase 1 (DB) primero - es el cimiento
2. Phase 2 y 3 pueden trabajarse en paralelo después
3. Phase 4 depende de Phase 2 y 3
4. Phase 5, 6, 7 son frontend y dependen de Phase 4
5. Phase 8 (Testing) puede empezarse parcialmente durante el desarrollo

---

*Generado: 2026-04-20*
*Change: transactions-crud*
