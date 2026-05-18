# Checklist de alineación FE / BE

**Objetivo:** ver qué tan alineado está el código con la visión acordada (`docs/DECISIONES.md` §14–17) y guiar el refactor hacia un sistema **ordenado, escalable, mantenible y robusto**.

**Cómo usarlo:** columna **Estado** tras auditoría del repo (`2026-05-14`): `OK` cumple o es aceptable hoy; `PARCIAL` hay base pero falta alinear; `GAP` desalineado con la visión actual. Actualizar esta columna al cerrar ítems.

**Leyenda:** OK · PARCIAL · GAP · N/A

---

## 1. Modelo de datos y estados (PostgreSQL / Supabase)

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 1.1 | `transactions.status` alineado con Borrador → Pendiente → Rechazado → Aprobado → **Cancelado** (impacto saldo unificado). | **PARCIAL** | Migración `20260515120000_workflow_approve_posts_journal.sql`: sin `posted`, con `cancelled`; CHECK y RPC alineados. Verificar entornos sin migrar. |
| 1.2 | RLS y roles (colaborador vs admin, §14). | **PARCIAL** | `20250421000002_transactions_rls.sql`: approve/post solo `superadmin`/`admin_finanzas`; colaborador edita draft/rejected. **GAP:** no hay regla explícita en BD de “si el autor es admin → auto pending vs auto approved”; depende de la app. |
| 1.3 | Inmutabilidad post-aprobación; cancelación total; sin “revertir a borrador” si la visión es cancelar. | **GAP** | Política `transactions_revert_approved` permite volver **approved** atrás (contradice propuesta: aprobado no editable, solo cancelar). `posted` sí bloqueado por `transactions_no_update_posted`. |
| 1.4 | Cuenta corriente: plazo, vencimiento, factura opcional, PDF, `document_date`, etc. | **GAP** | `transactions` tiene `document_type`, `document_number`, `attachment_url`; no hay `payment_term`, `due_date`, `document_date` en migraciones revisadas. PDF genérico vía `attachment_url` posible, sin flujo UI dedicado. |
| 1.5 | `contacts`: tipo de cliente, servicios asociados. | **GAP** | `20260505163000_chart_of_accounts_contacts_mappings.sql`: `contacts` = `kind`, `name`, `tax_id`, `notes` solamente. |
| 1.6 | `project_id` y presupuesto vs **informes** por proyecto. | **PARCIAL** | Proyectos con `budgetAmount` y `spentAmount` en UI (`proyectos/page.tsx`, `projects.ts`). **GAP:** no hay pantalla informe “presupuesto vs real” por proyecto ni selector mes/trimestre a nivel proyecto. |
| 1.7 | `chart_of_accounts` vs UI plan de cuentas. | **PARCIAL** | Tabla y seed en BD existen. **GAP:** `cuentas/page.tsx` solo cuentas operativas; **no** hay pestaña/vista plan de cuentas. |
| 1.8 | Journal / RPCs reportes vs criterio real vs proyectado (§7). | **PARCIAL** | Modelo unificado `approved` + diario; `getReportsData` usa RPCs `approved`; proyectado = solo `pending` en tendencia. Revisar otros endpoints si existen duplicados. |

---

## 2. RPCs y reglas en servidor

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 2.1 | Transiciones centralizadas; poca lógica duplicada en cliente. | **PARCIAL** | `movements.ts` orquesta Supabase; hooks (`use-movements-mutation`) disparan toasts. Revisar que no haya transiciones solo en cliente sin RPC/patch coherente. |
| 2.2 | Rechazado → corrección → reenvío → pendiente. | **PARCIAL** | RLS `transactions_update_rejected` + políticas pending/approve. Flujo existe; etiquetas UI aún mezclan “Contabilizado” vs “Aprobado” (ver §4.7). |
| 2.3 | Misma definición “qué impacta saldo / reportes” entre **approved** y **posted**. | **GAP** | Código y UI mantienen dos estados verdes distintos; visión propuesta unifica en **Aprobado** como impacto (eliminar o mapear `posted`). |
| 2.4 | `audit_log` y triggers vs RLS. | **OK** | Migraciones `20260504110500_fix_audit_log_rls.sql`, `20260506223000_fix_audit_trigger_user_fallback.sql` (asumir desplegadas en entornos alineados al repo). |

---

## 3. Acciones server y validación (Next.js)

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 3.1 | Validaciones vs CHECK en BD. | **PARCIAL** | `MovementStatusEnum` en `validations/movement.ts` alineado al esquema actual; al cambiar BD hay que sincronizar. |
| 3.2 | `movements.ts` y permisos §14 (autor colaborador vs admin). | **PARCIAL** | `updateMovementStatus` exige rol finanzas para aprobar/rechazar/anular; `finalizeMovementSubmission` envía `pending` o `pending→approved` según rol. Falta refinar UX (admin que quiera solo enviar a otro admin sin auto‑aprobar). |
| 3.3 | `contacts.ts` CRUD + campos extendidos. | **PARCIAL** | `getContacts` + `createContact` (segmento/servicios); alta rápida desde formulario de movimiento. Falta edición en ficha y listado dedicado. |
| 3.4 | `projects.ts` consumible por vista proyecto vs real. | **PARCIAL** | Árbol + presupuesto/gastado listo para tabla; falta vista análisis dedicada y periodos. |
| 3.5 | `accounts` / `categories` vs plan de cuentas en formulario. | **PARCIAL** | `chart_account_id` en migraciones; verificar que el formulario de movimientos exponga coherencia con componentes/journal. |
| 3.6 | Errores unificados. | **PARCIAL** | Uso de `errorMessageForUser`; revisar mensajes puntuales en flujos nuevos. |

---

## 4. Frontend — rutas, navegación y copy

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 4.1 | Rutas en español; código en convención repo. | **PARCIAL** | Rutas `/operaciones`, `/reportes`, etc. OK. Sidebar aún “Dashboard”, “Configuracion” sin tilde; mejorable. |
| 4.2 | Menú **Ventas y cobros** / **Compras y pagos**. | **PARCIAL** | Sidebar: entradas dedicadas con `?flujo=ventas` / `?flujo=compras` hacia `/operaciones`; bloque “Flujo de caja”. Bottom nav sigue compacto (un ítem Movimientos + badge pendientes). |
| 4.3 | Nuevo registro: **Venta/Cobro**, **Compra/Pago**, **Pasaje entre cuentas**. | **GAP** | `constants.ts` y formularios usan Ingreso/Gasto/Transferencia y tipos `income`/`expense`/`transfer`. |
| 4.4 | Informes + control gestión; presets **mensual** y **trimestral**. | **PARCIAL** | `reportes/page.tsx`: presets mes / mes anterior / trimestre / trim anterior; `getReportsData` alineado al rango. Falta rango personalizado (fechas libres) si se exige en misma entrega. |
| 4.5 | Análisis por proyecto (presupuesto vs real, mes/trimestre). | **PARCIAL** | `proyectos/[id]` análisis con mismos presets de periodo y agregación por fechas en `getProjectFinancialAnalysis`. Falta selector explícito de subproyecto si aplica jerarquía fina en UI. |
| 4.6 | Plan de cuentas (solo lectura) en Cuentas. | **GAP** | No implementado en `cuentas/page.tsx`. |
| 4.7 | Badges de color según psicología acordada. | **PARCIAL** | `posted` eliminado en producto; `rejected` naranja, `approved` verde, `cancelled` rojo. Ajuste fino de paleta vs propuesta pendiente. |
| 4.8 | Badge in-app pendientes (sin email v1). | **PARCIAL** | Contador en sidebar (lista “Todos los movimientos”) y badge en bottom nav móvil vía `getPendingMovementsCount` en layout. |

---

## 5. Coherencia producto ↔ código

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 5.1 | Una sola verdad “qué impacta saldo” en docs + código + UI. | **PARCIAL** | Código/UI alineados a `approved` + diario; actualizar textos en `DECISIONES.md` §7 donde aún cite `posted` como criterio de caja real. |
| 5.2 | Flujo real vs proyectado etiquetado. | **OK** | `reportes/page.tsx` etiqueta bloque real (`posted`) y series proyectadas en tendencia. |
| 5.3 | ARS / COP / USD y Argentina como principal. | **PARCIAL** | `cuentas/page.tsx` formatea ARS/COP/EUR; migración Argentina defaults. Falta alinear **toda** la app y presets de onboarding con la decisión “Argentina primero, Colombia después”. |
| 5.4 | “Operaciones” vs “Movimientos”. | **OK** | Copy de producto en **Movimiento(s)**; dominio en código renombrado a `Movement` / `movements.ts` / `movement-store` / `movementComponents` (persistencia sigue `transactions` + `operation_components` + RPC `set_operation_components`). Rutas `/operaciones` sin cambio. |

---

## 6. Calidad estructural (escalable / mantenible)

| Ítem | Verificación | Estado | Notas / evidencia |
|------|--------------|--------|-------------------|
| 6.1 | Dependencias entre módulos razonables. | **PARCIAL** | Sin auditoría de ciclos; estructura típica app router + actions. |
| 6.2 | Tipos compartidos validación ↔ acciones. | **PARCIAL** | `validations/movement.ts` + tipos en actions; mantener al refactorizar. |
| 6.3 | Tests críticos en verde. | **OK** | `pnpm test` (Vitest): **122 tests, 13 archivos** pasando (2026-05-14). |
| 6.4 | Migraciones ordenadas y comentadas. | **OK** | Carpeta `supabase/migrations` con prefijos de fecha; comentarios en SQL legacy. |
| 6.5 | Reglas de aprobación no solo en cliente. | **PARCIAL** | RLS fuerte en Supabase; falta cierre de brechas §14 en capa app si se exige duplicar validación defensiva. |

---

## 7. Orden sugerido de trabajo (§17 `DECISIONES`)

1. Cerrar **modelo de estados** (incl. cancelación, retirar o acotar `revert_approved`, mapeo `posted`) + migración + RLS + RPCs.  
2. Ajustar **acciones server** y validaciones + reglas por rol si van en app.  
3. **UI**: navegación (Ventas y cobros / Compras y pagos), formulario (Venta/Cobro…), informes con periodo, análisis por proyecto, plan de cuentas, badges, badge pendientes.  
4. **Contactos** extendidos + inline + storage PDF.  
5. Limpieza, tests nuevos y actualizar este checklist.

---

## Referencias rápidas

| Documento | Contenido |
|-----------|-----------|
| [DECISIONES.md](./DECISIONES.md) | Decisiones §7, §12–§17 |
| `src/lib/actions/movements.ts` | Orquestación + `getReportsData` |
| `supabase/migrations/20250421000001_extend_transactions.sql` | Estados y columnas transacción |
| `supabase/migrations/20250421000002_transactions_rls.sql` | RLS transacciones |

*Auditoría checklist: 2026-05-15 · Tests: Vitest (`movements` + periodos + contactos OK en suite focal).*
