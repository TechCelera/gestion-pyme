# Decisiones del Proyecto

Este documento registra decisiones funcionales y tecnicas acordadas durante el desarrollo de `gestion-pyme`.

## Estado

- Activo
- Ultima actualizacion: 2026-05-04

## 1) Caja unica por empresa

### Decision
- Cada empresa maneja una sola caja operativa.
- No se permiten variantes duplicadas semanticas de caja (por ejemplo: `Caja`, `Caja Principal`, `Caja Ppal`).

### Implementacion
- Normalizacion en migracion y deduplicacion suave.
- Validacion en acciones de cuentas para evitar crear/renombrar otra caja equivalente.

### Razon
- Evitar doble conteo y ambiguedad operativa.
- Simplificar conciliacion y reportes.

## 2) Dinero de terceros como anticipo de clientes

### Decision
- El dinero de terceros se registra como pasivo en `Anticipo de Clientes`.
- No se modela como segunda caja fisica.

### Implementacion
- Campo de operacion `fund_owner`:
  - `company`
  - `client_advance`
- Backfill para asegurar cuenta contable `Anticipo de Clientes` por empresa.

### Razon
- Separar propiedad del dinero sin duplicar cajas fisicas.
- Mantener criterio contable consistente.

## 3) Operaciones con alcance general o por proyecto

### Decision
- Una operacion puede ser:
  - General de empresa, o
  - Asociada a proyecto/subproyecto.
- Se soporta jerarquia proyecto -> subproyecto.

### Implementacion
- Tabla `projects` con `parent_project_id`.
- Campo `project_id` nullable en operaciones.
- Proyecto raiz por empresa: `General Empresa`.

### Razon
- Permitir control por cliente/proyecto sin romper operativa general.

## 4) Presupuesto y plazo en proyecto/subproyecto

### Decision
- Proyecto y subproyecto pueden tener presupuesto y plazo propios.
- Si una operacion excede presupuesto o queda fuera de plazo:
  - Se permite guardar.
  - Se marca `requires_budget_approval = true`.
  - Para pasar a `posted`, exige aprobacion adicional.

### Implementacion
- Campos de control:
  - `requires_budget_approval`
  - `budget_approved_by`
  - `budget_approved_at`
  - `budget_approval_note`
- Evaluacion de presupuesto/plazo antes de transiciones de estado.
- Bloqueo de `posted` sin aprobacion adicional cuando aplica.

### Razon
- Combinar flexibilidad operativa (no bloquear captura) con control financiero.

## 5) Terminologia de producto

### Decision
- En interfaz y mensajes al usuario se usa:
  - `Operacion` / `Operaciones`
- Se evita `Transaccion` en copy de producto.

### Razon
- Alineacion con el modelo de negocio (no todo movimiento implica solo dinero).

## 6) Traza tecnica principal

- Migracion principal:
  - `supabase/migrations/20260502113000_projects_budget_and_operation_scope.sql`
- Backend:
  - `src/lib/actions/transactions.ts`
  - `src/lib/actions/projects.ts`
  - `src/lib/validations/transaction.ts`
- UI:
  - `src/components/transactions/transaction-form.tsx`
  - `src/components/transactions/transaction-table.tsx`
  - `src/app/(dashboard)/projects/page.tsx`

## 7) Flujo de caja: real vs proyectado

### Contexto
- Se detecto confusion de usuario: una operacion nueva no siempre se reflejaba en `Flujo de Caja`.
- El motivo era funcional: el flujo oficial solo consideraba operaciones `posted`.

### Decision
- Mantener `Flujo de Caja Real` con criterio contable estricto:
  - solo operaciones `posted`.
- Exponer ademas `Flujo de Caja Proyectado` para visibilidad operativa:
  - `posted + approved + pending`.

### Implementacion
- Ajuste en `getReportsData`:
  - separacion de metricas:
    - `cashInReal`, `cashOutReal`, `netCashFlowReal`
    - `cashInProjected`, `cashOutProjected`, `netCashFlowProjected`
  - separacion de tendencias:
    - `monthlyTrend` (real)
    - `monthlyTrendProjected` (proyectado)
- UI de reportes actualizada para mostrar ambos bloques y ambas tendencias:
  - `src/app/(dashboard)/reports/page.tsx`

### Razon
- Evitar mezclar caja contable cerrada con operaciones aun en tramite.
- Mejorar toma de decisiones del usuario con doble lectura (real y proyeccion).

## 8) Creacion de operacion y estado inicial del flujo

### Contexto
- El boton `Enviar Aprobacion` no estaba respetando la intencion del usuario.
- La creacion via RPC quedaba en `draft` en todos los casos.

### Decision
- Mantener comportamiento de RPC (`draft` por defecto) y completar transicion en aplicacion cuando aplique.
- Si el usuario elige `Enviar Aprobacion`, la operacion debe pasar de `draft` a `pending` inmediatamente.

### Implementacion
- `addTransaction` ahora acepta `asDraft` y, cuando es `false`, ejecuta cambio de estado a `pending`.
- Llamadas ajustadas para propagar la intencion de UI:
  - `src/app/(dashboard)/transactions/page.tsx`
  - `src/hooks/use-create-transaction.ts`

### Razon
- Alinear UX con semantica real de botones.
- Evitar diferencias entre lo que el usuario cree que hizo y el estado real guardado.

## 9) Reparacion RLS en bitacora de auditoria

### Contexto
- Al editar/guardar operaciones aparecio el error:
  - `new row violates row-level security policy for table "audit_log"`.
- `fn_audit_log` inserta en `audit_log` en cada cambio de operaciones.
- Una migracion previa elimino politicas legacy de `audit_log` y no quedaron politicas activas equivalentes.

### Decision
- Restaurar politicas RLS minimas y explicitas para `audit_log`:
  - lectura por aislamiento de empresa,
  - insercion solo para usuario autenticado de la misma empresa.

### Implementacion
- Nueva migracion:
  - `supabase/migrations/20260504110500_fix_audit_log_rls.sql`
- Politicas creadas:
  - `audit_log_select_company`
  - `audit_log_insert_company`

### Razon
- Evitar bloqueos en flujos de crear/editar operaciones por trigger de auditoria.
- Mantener trazabilidad sin romper aislamiento multiempresa.

## Regla de mantenimiento

Cuando se tome una decision nueva de negocio o arquitectura, agregar:
- contexto corto,
- decision,
- impacto tecnico,
- fecha.
