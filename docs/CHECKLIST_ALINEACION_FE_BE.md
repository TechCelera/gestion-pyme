# Checklist de alineación FE / BE

**Objetivo:** ver qué tan alineado está el código con la visión acordada (`docs/DECISIONES.md` §14–17) y guiar el refactor hacia un sistema **ordenado, escalable, mantenible y robusto**.

**Cómo usarlo:** columna **Estado** tras auditoría del repo (`2026-05-18`): `OK` cumple o es aceptable hoy; `PARCIAL` hay base pero falta alinear; `GAP` desalineado con la visión actual. Actualizar esta columna al cerrar ítems.

**Piloto cliente:** antes de entregar, correr `pnpm run verify:trial` y aplicar migraciones (`pnpm sb:push`).

**Leyenda:** OK · PARCIAL · GAP · N/A

---

## 1. Modelo de datos y estados (PostgreSQL / Supabase)

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 1.1 | `transactions.status` alineado con Borrador → Pendiente → Rechazado → Aprobado → **Cancelado** (impacto saldo unificado). | **OK** | `20260515120000_workflow_approve_posts_journal.sql` + `20260522150000_rls_workflow_hardening.sql`. Desplegar migraciones en Supabase. |
| 1.2 | RLS y roles (colaborador vs admin, §14). | **OK** | Roles canónicos `admin`/`collaborator`, `auth_user_is_admin()`, políticas en `20260518140000_canonical_user_roles_rls.sql`. Auto‑aprobación admin sigue en capa app (`finalizeMovementSubmission`). |
| 1.3 | Inmutabilidad post-aprobación; cancelación total; sin “revertir a borrador” si la visión es cancelar. | **OK** | `transactions_revert_approved` y políticas `posted` eliminadas (`20260515120000`, reforzado `20260522150000`). Cancelación vía `update_transaction_status`. |
| 1.4 | Cuenta corriente: plazo, vencimiento, factura opcional, PDF, `document_date`, etc. | **GAP** | `transactions` tiene `document_type`, `document_number`, `attachment_url`; no hay `payment_term`, `due_date`, `document_date` en migraciones revisadas. PDF genérico vía `attachment_url` posible, sin flujo UI dedicado. |
| 1.5 | `contacts`: tipo de cliente, servicios asociados. | **GAP** | `20260505163000_chart_of_accounts_contacts_mappings.sql`: `contacts` = `kind`, `name`, `tax_id`, `notes` solamente. |
| 1.6 | `project_id` y presupuesto vs **informes** por proyecto. | **OK** | `proyectos/[id]` con análisis presupuesto vs gastos y `ReportsPeriodTabs` (mes/trimestre). |
| 1.7 | `chart_of_accounts` vs UI plan de cuentas. | **OK** | Pestaña **Plan de cuentas** en `/cuentas` + E2E `e2e/authenticated/cuentas.spec.ts`. |
| 1.8 | Journal / RPCs reportes vs criterio real vs proyectado (§7). | **OK** | `approved` + diario; reportes y flujo de caja por período (`cash-flow-period.ts`). |

---

## 2. RPCs y reglas en servidor

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 2.1 | Transiciones centralizadas; poca lógica duplicada en cliente. | **PARCIAL** | `movements.ts` orquesta Supabase; hooks (`use-movements-mutation`) disparan toasts. Revisar que no haya transiciones solo en cliente sin RPC/patch coherente. |
| 2.2 | Rechazado → corrección → reenvío → pendiente. | **PARCIAL** | RLS `transactions_update_rejected` + políticas pending/approve. Flujo existe; etiquetas UI aún mezclan “Contabilizado” vs “Aprobado” (ver §4.7). |
| 2.3 | Misma definición “qué impacta saldo / reportes” entre **approved** y **posted**. | **OK** | Producto unificado en **approved**; `posted` retirado del CHECK y RLS. |
| 2.4 | `audit_log` y triggers vs RLS. | **OK** | Migraciones `20260504110500_fix_audit_log_rls.sql`, `20260506223000_fix_audit_trigger_user_fallback.sql` (asumir desplegadas en entornos alineados al repo). |

---

## 3. Acciones server y validación (Next.js)

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 3.1 | Validaciones vs CHECK en BD. | **PARCIAL** | `MovementStatusEnum` en `validations/movement.ts` alineado al esquema actual; al cambiar BD hay que sincronizar. |
| 3.2 | `movements.ts` y permisos §14 (autor colaborador vs admin). | **PARCIAL** | `updateMovementStatus` exige rol finanzas para aprobar/rechazar/anular; `finalizeMovementSubmission` envía `pending` o `pending→approved` según rol. Falta refinar UX (admin que quiera solo enviar a otro admin sin auto‑aprobar). |
| 3.3 | `contacts.ts` CRUD + campos extendidos. | **PARCIAL** | `getContacts` + `createContact` (segmento/servicios); alta rápida desde formulario de movimiento. Falta edición en ficha y listado dedicado. |
| 3.4 | `projects.ts` consumible por vista proyecto vs real. | **OK** | `getProjectFinancialAnalysis` + UI `project-analysis-content.tsx`. |
| 3.5 | `accounts` / `categories` vs plan de cuentas en formulario. | **PARCIAL** | `chart_account_id` en migraciones; verificar que el formulario de movimientos exponga coherencia con componentes/journal. |
| 3.6 | Errores unificados. | **PARCIAL** | Uso de `errorMessageForUser`; revisar mensajes puntuales en flujos nuevos. |

---

## 4. Frontend — rutas, navegación y copy

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 4.1 | Rutas en español; código en convención repo. | **PARCIAL** | Rutas `/operaciones`, `/reportes`, etc. OK. Sidebar aún “Dashboard”, “Configuracion” sin tilde; mejorable. |
| 4.2 | Menú **Ventas y cobros** / **Compras y pagos**. | **PARCIAL** | Sidebar: entradas dedicadas con `?flujo=ventas` / `?flujo=compras` hacia `/operaciones`; bloque “Flujo de caja”. Bottom nav sigue compacto (un ítem Movimientos + badge pendientes). |
| 4.3 | Nuevo registro: **Venta/Cobro**, **Compra/Pago**, **Pasaje entre cuentas**. | **GAP** | `constants.ts` y formularios usan Ingreso/Gasto/Transferencia y tipos `income`/`expense`/`transfer`. |
| 4.4 | Informes + control gestión; presets **mensual** y **trimestral**. | **OK** | `ReportsPeriodTabs` + `reports-period.ts`; hints de período. Rango libre = mejora futura. |
| 4.5 | Análisis por proyecto (presupuesto vs real, mes/trimestre). | **OK** | Mismos presets que reportes en análisis por proyecto. |
| 4.6 | Plan de cuentas (solo lectura) en Cuentas. | **OK** | Tab **Plan de cuentas** + árbol `ChartOfAccountsTree`. |
| 4.7 | Badges de color según psicología acordada. | **PARCIAL** | `posted` eliminado en producto; `rejected` naranja, `approved` verde, `cancelled` rojo. Ajuste fino de paleta vs propuesta pendiente. |
| 4.8 | Badge in-app pendientes (sin email v1). | **PARCIAL** | Contador en sidebar (lista “Todos los movimientos”) y badge en bottom nav móvil vía `getPendingMovementsCount` en layout. |

---

## 5. Coherencia producto ↔ código

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 5.1 | Una sola verdad “qué impacta saldo” en docs + código + UI. | **OK** | `approved` + diario en código y BD; revisar copy residual “posted” en docs viejos. |
| 5.2 | Flujo real vs proyectado etiquetado. | **OK** | Reportes: bloque real (aprobadas) vs proyectado (pendientes) en tendencia. |
| 5.3 | ARS / COP / USD y Argentina como principal. | **PARCIAL** | `cuentas/page.tsx` formatea ARS/COP/EUR; migración Argentina defaults. Falta alinear **toda** la app y presets de onboarding con la decisión “Argentina primero, Colombia después”. |
| 5.4 | “Operaciones” vs “Movimientos”. | **OK** | Copy de producto en **Movimiento(s)**; dominio en código renombrado a `Movement` / `movements.ts` / `movement-store` / `movementComponents` (persistencia sigue `transactions` + `operation_components` + RPC `set_operation_components`). Rutas `/operaciones` sin cambio. |

---

## 6. Calidad estructural (escalable / mantenible)

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 6.1 | Dependencias entre módulos razonables. | **PARCIAL** | Sin auditoría de ciclos; estructura típica app router + actions. |
| 6.2 | Tipos compartidos validación ↔ acciones. | **PARCIAL** | `validations/movement.ts` + tipos en actions; mantener al refactorizar. |
| 6.3 | Tests críticos en verde. | **OK** | `pnpm run verify`: **200+** tests Vitest (32 archivos), E2E públicas + `e2e/authenticated/trial-smoke.spec.ts` con secrets. |
| 6.4 | Migraciones ordenadas y comentadas. | **OK** | **38** migraciones; integridad tenant + bootstrap piloto (`20260522120000`, `20260522140000`, `20260522150000`). |
| 6.5 | Reglas de aprobación no solo en cliente. | **OK** | RLS + RPC `update_transaction_status` + triggers validación; app refuerza rol. |

---

## 7. Orden sugerido de trabajo (§17 `DECISIONES`)

**Hecho para piloto:** estados/RLS, reportes por período, plan de cuentas en UI, integridad multi-tenant, bootstrap registro, E2E piloto.

**Siguiente oleada (post‑piloto):**
1. Copy producto Venta/Cobro vs Ingreso/Gasto (§4.3).  
2. Contactos extendidos + PDF (§1.4–1.5).  
3. Rango de fechas libre en informes.  
4. Más cobertura E2E con credenciales en CI (`verify:all`).

---

## Referencias rápidas

| Documento | Contenido |
|-----------|-----------|
| [DECISIONES.md](./DECISIONES.md) | Decisiones §7, §12–§17 |
| `src/lib/actions/movements.ts` | Orquestación + `getReportsData` |
| `supabase/migrations/20250421000001_extend_transactions.sql` | Estados y columnas transacción |
| `supabase/migrations/20250421000002_transactions_rls.sql` | RLS transacciones |

*Auditoría checklist: 2026-05-18 · Tests: `pnpm run verify` (200+ unit) + `pnpm run verify:trial`.*
