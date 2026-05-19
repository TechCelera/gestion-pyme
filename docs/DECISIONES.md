# Decisiones del Proyecto

Este documento registra decisiones funcionales y tecnicas acordadas durante el desarrollo de `gestion-pyme`.

## Estado

- Activo
- Ultima actualizacion: 2026-05-17

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
- En interfaz y mensajes al usuario se usa **`Movimiento` / `Movimientos`** (mapeo de dominio: pantalla y menú = movimientos; tabla SQL = `transactions`; código TypeScript = `Movement` / acciones en `movements.ts`).
- La ruta canónica sigue siendo `/operaciones` (URLs en español del repo); el copy visible no tiene que repetir la palabra "operaciones".
- Se evita `Transaccion` en copy de producto.

### Razon
- Alineacion con la propuesta comercial y con el checklist `docs/CHECKLIST_ALINEACION_FE_BE.md` (ítem 5.4).
- El modelo de negocio sigue siendo más que "solo dinero"; el término **movimiento** cubre venta, cobro, compra, pago y traspaso sin forzar jerga contable al usuario.

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
  - `src/app/(dashboard)/proyectos/page.tsx`

## 7) Flujo de caja: real vs proyectado

### Contexto
- Se detecto confusion de usuario: un movimiento nuevo no siempre se reflejaba en `Flujo de Caja`.
- El modelo evoluciono: ya no existe el paso intermedio `posted`; al **aprobar** se genera el asiento y el criterio contable estricto pasa a ser movimientos **`approved`** (con lineas en diario).

### Decision
- Mantener `Flujo de Caja Real` con criterio contable estricto:
  - desde el diario (RPC), equivalente a movimientos **`approved`** con impacto en cuentas de caja/banco.
- Exponer ademas `Flujo de Caja Proyectado` para visibilidad operativa del **pipeline**:
  - tendencia proyectada basada en movimientos **`pending`** (no duplicar montos ya contabilizados al aprobar).

### Implementacion
- Ajuste en `getReportsData`:
  - separacion de metricas:
    - `cashInReal`, `cashOutReal`, `netCashFlowReal`
    - `cashInProjected`, `cashOutProjected`, `netCashFlowProjected`
  - separacion de tendencias:
    - `monthlyTrend` (real)
    - `monthlyTrendProjected` (proyectado)
  - Presets de periodo (mes / mes anterior / trimestre / trimestre anterior) en `reportes/page.tsx` y util `src/lib/utils/reports-period.ts`.
- UI de reportes actualizada para mostrar ambos bloques y ambas tendencias:
  - `src/app/(dashboard)/reportes/page.tsx`

### Razon
- Evitar mezclar caja contable cerrada con movimientos aun en tramite.
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
  - `src/app/(dashboard)/operaciones/page.tsx`
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

## 10) Motor contable y criterio de modelo de datos (Bernabé / informe cliente)

### Contexto
- El cliente describe operaciones con desglose de medios de pago, partida doble y reportes (resultados, balance, caja).
- No obstante, el esquema SQL no debe copiar nombres literales del PDF si ello dificulta mantenimiento o multiempresa.

### Decision
- La unidad de negocio sigue siendo `transactions` (movimiento en producto).
- El desglose obligatorio de cobro/pago vive en `operation_components` (tipos `operative_cash`, `operative_bank`, `client_receivable`, `supplier_payable`).
- El libro diario automático es `journal_entries` + `journal_entry_lines`; el usuario no arma asientos manuales.
- Al pasar a `posted`, `fn_post_journal_for_transaction` genera el asiento y `update_account_balance` recalcula saldos de carteras desde líneas con `operative_account_id`.
- `chart_of_accounts` por empresa con semilla `fn_seed_company_chart_accounts`; `accounts` y `categories` mapean a hojas del plan vía `chart_account_id`.
- Las transferencias y ajustes pueden tener `category_id` nulo en base; ingresos/egresos siguen exigiendo categoría en la app.

### Implementacion
- Migraciones: `20260505163000_chart_of_accounts_contacts_mappings.sql`, `20260505163001_journal_posting_components.sql`, `20260506140000_reports_journal_rpcs.sql`.
- RPC `set_operation_components` + sincronización por defecto en `src/lib/actions/transactions.ts`; formulario de operación con desglose de medios (`operation_components`) y validación suma = total.

### Razon
- Alinear el comportamiento contable con el informe sin renombrar tablas que ya tienen RLS, RPC y UI acoplados.
- Evitar saldos duplicados o desincronizados: el saldo operativo sale del diario, no de reglas ad hoc solo sobre `transactions`.

## Regla de mantenimiento

Cuando se tome una decision nueva de negocio o arquitectura, agregar:
- contexto corto,
- decision,
- impacto tecnico,
- fecha.

## 11) Despliegue a produccion: variables y fuente unica de reglas

### Contexto
- En despliegues por CLI a Vercel hubo confusion por variables de entorno faltantes y por el uso de "archivos de contexto" fuera de la guia oficial.

### Decision
- Variables de entorno de produccion se administran en Vercel Project Settings o via `vercel env`, nunca hardcodeadas en repo.
- Variables publicas minimas requeridas para Supabase:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- La unica fuente de reglas operativas del agente es `AGENTS.md`; para decisiones funcionales/arquitectura se usa este `docs/DECISIONES.md`.
- No se crean archivos paralelos de contexto (`.codex`, `.aider`, `CLAUDE.md`, etc.) para "recordar" reglas.

### Implementacion
- Se agrega `.vercelignore` para excluir archivos pesados de upload CLI (`tmp`, `node_modules`, `.next`, etc.).
- `vercel.json` se mantiene minimo (`framework: nextjs`) para evitar overrides innecesarios.
- Verificacion operativa recomendada antes de publicar:
  - `vercel env ls` (confirmar variables en Production).
  - `vercel deploy --prod --yes`.

### Razon
- Evitar fallos de build/deploy por configuracion incompleta.
- Reducir friccion operativa y preguntas repetidas con una regla unica, visible y mantenible.

## 12) Rutas publicas en espanol (canon UX) + compatibilidad

### Contexto
- Se detecto incoherencia de producto por mezcla de rutas visibles en ingles y espanol (por ejemplo `/accounts` junto a `/operaciones`).
- La app y su copy principal estan en espanol.

### Decision
- Las rutas publicas visibles para usuario final se unifican a espanol.
- Canon actual:
  - `/operaciones`
  - `/cuentas`
  - `/proyectos`
  - `/reportes`
  - `/configuracion`
- El codigo interno (tipos, funciones, stores, acciones) se mantiene en ingles.

### Implementacion
- Renombre de paginas dashboard:
  - `src/app/(dashboard)/accounts` -> `src/app/(dashboard)/cuentas`
  - `src/app/(dashboard)/projects` -> `src/app/(dashboard)/proyectos`
  - `src/app/(dashboard)/reports` -> `src/app/(dashboard)/reportes`
  - `src/app/(dashboard)/settings` -> `src/app/(dashboard)/configuracion`
- Navegacion y constantes ajustadas:
  - `src/components/layout/sidebar.tsx`
  - `src/components/layout/bottom-nav.tsx`
  - `src/lib/constants.ts`
- Redirecciones permanentes para enlaces legacy en `next.config.ts`:
  - `/accounts` -> `/cuentas`
  - `/projects` -> `/proyectos`
  - `/reports` -> `/reportes`
  - `/settings` -> `/configuracion`
  - `/transactions` -> `/operaciones`

### Razon
- Consistencia de idioma en producto.
- Menor friccion de uso y mejor trazabilidad de errores en soporte.
- Compatibilidad con enlaces viejos sin romper accesos existentes.

## 13) Endurecimiento operacional: sesion expirada y acciones de cuentas

### Contexto
- En `operaciones` se mostraba mensaje de sesion expirada sin redirigir siempre a login.
- En `cuentas`, las acciones por fila estaban dentro de menu de 3 puntos pese a ser pocas (editar/eliminar).

### Decision
- Ante error de autenticacion en `operaciones`, redireccion automatica a `/login` (fuera de modo demo).
- En tabla de `cuentas`, mostrar acciones directas por fila (`Editar`, `Eliminar`) sin menu contextual.

### Implementacion
- `src/app/(dashboard)/operaciones/page.tsx`:
  - deteccion centralizada `isAuthError`,
  - limpieza de store auth (`clearUser`) y `router.replace('/login')`.
- `src/app/(dashboard)/cuentas/page.tsx`:
  - eliminacion de `DropdownMenu` para acciones,
  - botones directos visibles por fila.

### Razon
- UX mas predecible cuando la sesion caduca.
- Menos clics y mayor claridad en operaciones frecuentes de cuentas.

## 14) UX movimientos, aprobacion y contactos (feedback socio, Mayo 2026)

### Contexto
- Se refino la propuesta de producto con el socio: lenguaje de pantalla, factura opcional con adjunto, datos de cliente y reglas de aprobacion.

### Decision

**Aprobacion**
- Movimiento creado/enviado por **colaborador** (rol `collaborator` en BD): debe quedar **pendiente** hasta que un **administrador** (`admin`) lo apruebe.
- Movimiento creado por **administrador**: mismo flujo que colaborador (**pendiente**); lo aprueba un administrador en la tabla (puede ser **otro** admin de la misma empresa; sin autoaprobar al crear).

**Factura en cuenta corriente**
- La factura oficial es **opcional** (operativa mayoritaria sin factura formal).
- Debe existir opcion de marcar factura oficial y **adjuntar PDF** cuando el usuario la tenga.

**Contactos**
- Permitir **crear cliente/proveedor inline** desde el formulario de movimiento sin abandonar el flujo.
- En ficha de contacto: **tipo de cliente** (al menos: cliente final particular / cliente corporativo; extensible).
- En ficha de contacto: **servicios asociados** (texto libre o lista; ejemplos de negocio: honorarios por diseno, direccion de obra, ejecucion, administracion financiera del presupuesto).

**Terminologia de producto (pantalla)**
- Estado `cancelled` en codigo/BD se muestra como **Anulado** (accion: anular movimiento aprobado; motivo en detalle). No usar "Cancelado" en badges para evitar confusion con cancelar un dialogo o un cobro del mundo real.
- Agrupacion o panel izquierdo: **Ventas y cobros** y **Compras y pagos** (sustituye la percepcion de "Ingreso / Egreso" como bloques de navegacion).
- Selector al crear movimiento: **Venta/Cobro**, **Compra/Pago**, y **Pasaje entre cuentas** cuando aplique (movimiento entre cuentas propias; nombre de producto ya acordado como "Pasaje entre cuentas" en propuesta).

### Implementacion (parcial — 2026-05)
- Navegacion: sidebar con bloque **Flujo de caja** (Ventas y cobros, Compras y pagos, Todos los movimientos con filtro `?flujo=`); contador de pendientes en sidebar y badge en bottom nav.
- Reglas de rol: `finalizeMovementSubmission` y `updateMovementStatus` en `src/lib/actions/movements.ts` (aprobar/rechazar/anular solo `admin`; RLS vía `auth_user_is_admin()`).
- Contactos: alta rapida inline en `operation-form` + `createContact` en `src/lib/actions/contacts.ts` con `client_segment` y `associated_services`; falta ficha/listado dedicado y PDF en Storage.
- Pendiente: adjunto PDF factura, refinamiento de copy en UI (español neutro, equilibrio técnico/claro), RPC adicional si se centraliza todo en base.

### Razon
- Alinear UX con lenguaje natural del negocio (ventas/compras vs jerga contable).
- Control sin rigidez excesiva: factura opcional pero trazable cuando existe.
- Datos de cliente utiles para servicios y segmentacion sin salir del flujo de carga.

## 15) Analisis por proyecto: presupuestado vs real

### Contexto
- El negocio necesita ver **resultado por proyecto** (no solo vista global de todos los proyectos).
- Debe poder compararse lo **presupuestado / estimado** frente a lo **real aplicado** (movimientos aprobados u otro criterio acordado en reportes).

### Decision
- Incluir una **seccion o pantalla dedicada** (o pestaña dentro de **Proyectos** / **Informes**) que permita:
  - **Seleccionar un proyecto** (y opcionalmente subproyecto si aplica la jerarquia existente).
  - **Seleccionar periodo de analisis** al menos como **mes calendario** y como **trimestre** (alineado a la filosofia de control de gestion mensual/trimestral; ver decision 16).
  - Mostrar **indicadores de resultado** del proyecto en el periodo elegido.
  - Mostrar **comparacion presupuesto vs real**: ingresos/gastos o ventas/cobros y compras/pagos segun el modelo de agregacion definido en reportes, alineado a `project_id` en operaciones.
- La vista **global** de empresa se mantiene; esta capacidad es **complementaria y obligatoria** para analisis por obra o por contrato.

### Implementacion (parcial — 2026-05)
- Pantalla `src/app/(dashboard)/proyectos/[id]/page.tsx` con `getProjectFinancialAnalysis` filtrando por periodo (mismos presets que informes globales) y totales **approved** por `project_id`.
- Lista de proyectos enlaza a analisis por fila.
- Pendiente: tabla explícita Presupuestado / Real / Diferencia %, selector de subproyecto dedicado si hace falta mas alla del arbol en lista.

### Razon
- Control de margen y desviaciones por obra/cliente es requisito operativo tipico en PYMEs de servicios.
- Evita que el usuario tenga que exportar y cruzar datos fuera de la app para saber si un proyecto se fue al aire.

## 16) Filosofia de producto: control de gestion y periodicidad

### Contexto
- El software no es solo registro contable: es **control de gestion** para la direccion del negocio.
- Ese control debe poder ejercerse con **cadencia clara**: revision **mensual** y **trimestral**, ademas del seguimiento operativo diario/semanal cuando aplique.

### Decision
- Mantener explicita la filosofia de **control de gestion** en copy y diseno de **Informes** y vistas de resultado (empresa y por proyecto).
- Las vistas de analisis y comparacion (presupuesto vs real, resultados, flujo) deben permitir al menos:
  - **Agregacion por mes** (mes calendario o rango mensual acotado).
  - **Agregacion por trimestre** (trimestre civil o rango trimestral acotado).
- El criterio de numeros (p. ej. solo movimientos **aprobados** para cierre “duro”) se documenta en UI para que el usuario sepa que lectura esta viendo.

### Implementacion (parcial — 2026-05)
- Presets de periodo en **Informes** (`reportes/page.tsx`) y en **Analisis por proyecto** (`proyectos/[id]`), reutilizando `src/lib/utils/reports-period.ts`.
- Pendiente: rango personalizado (fechas libres) y copy unificado “gestion vs proyeccion” en todas las pantallas de resultado.

### Razon
- Direccion de PYMEs suele cerrar numeros en mes y trimestre; el producto debe hablar ese idioma.
- Sin periodicidad clara, el usuario percibe la app como registro aislado y no como herramienta de decision.

## 17) Alineacion FE/BE con la vision y refactor estructural

### Contexto
- La vision de producto (control de gestion, movimientos con aprobacion, informes por periodo, analisis por proyecto, contactos, etc.) queda consolidada en este documento.
- El codigo actual (Next.js, acciones server, Supabase/PostgreSQL, RLS, RPCs) puede tener **desalineacion** respecto a esa vision: nombres, flujos de estado, duplicacion, acoplamientos o deuda tecnica acumulada.

### Decision
- Tratar el trabajo como **dos fases complementarias** (no solo “features sueltas”):
  1. **Auditoria de alineacion** — inventario explicito de **gap** entre vision y realidad en **frontend** (rutas, componentes, copy, permisos de UI) y **backend** (esquema, RPCs, RLS, consistencia de estados, reportes). Salida: lista priorizada de brechas y riesgos.
  2. **Refactor orientado a vision** — cambios incrementales que acerquen el sistema a: **alineado**, **organizado**, **escalable**, **mantenible** y **bien estructurado** (capas claras, dominio en servidor, tipos compartidos, menos duplicacion entre pantallas).
- Criterios de calidad del refactor:
  - **Una sola fuente de verdad** para reglas de negocio criticas (estados, montos, permisos) en backend; UI que refleja esas reglas sin reimplementarlas.
  - **Contratos estables** entre app y base (RPCs o acciones con validacion explicita); migraciones versionadas y reversibles cuando sea posible.
  - **Modularidad**: dominios separables (movimientos, proyectos, informes, contactos, cuentas) con limites de dependencia razonables.
  - **Observabilidad minima**: errores y estados de carga predecibles; evitar comportamiento silencioso en flujos financieros.

### Implementacion (pendiente de desarrollo)
- Documento de brechas: [`docs/CHECKLIST_ALINEACION_FE_BE.md`](./CHECKLIST_ALINEACION_FE_BE.md) (tabla revisable; actualizar al cerrar ítems).
- Orden sugerido: migraciones y RPCs que fijen el modelo de datos y estados → acciones server y validaciones → UI (navegacion, formularios, informes) → limpieza de codigo muerto y tests donde existan.
- No expandir alcance funcional nuevo hasta cerrar brechas criticas de alineacion si bloquean consistencia (salvo hotfix).

### Razon
- Sin paso de alineacion, cada pantalla nueva refuerza el desorden.
- Un sistema **robusto** para gestion financiera exige coherencia FE/BE y estructura que aguante mas usuarios, mas empresas y mas reglas sin reescritura constante.

## 18) Navegacion: sidebar plano, categorias y configuracion de cuenta (Mayo 2026)

### Contexto
- El sidebar agrupaba items bajo la etiqueta "Gestion" con padding inconsistente.
- `/configuracion` mezclaba CRUD de categorias con ajustes de cuenta del usuario.

### Decision
- **Sidebar**: lista plana (Inicio, Movimientos, Mis cuentas, Categorias, Informes, Proyectos); Configuracion y Cerrar sesion en el pie.
- **Categorias**: ruta `/categorias` (`ROUTES.CATEGORIES`); redirect `/categories` -> `/categorias`.
- **Configuracion**: perfil, contraseña, cambio de correo (Supabase Auth), desactivar cuenta (`users.is_active` + signOut).
- **Movil**: enlace a Categorias en `/operaciones` (`md:hidden`); bottom nav sin item extra.

### Implementacion
- `src/components/layout/sidebar.tsx`, `src/app/(dashboard)/categorias/page.tsx`
- `src/app/(dashboard)/configuracion/page.tsx`, `src/lib/actions/profile.ts`, componentes en `src/components/settings/`
- Formularios de movimientos: cuentas -> `/cuentas`, categorias -> `/categorias`

### Razon
- Separar datos de empresa (categorias) de datos personales (cuenta).
- Menu lateral mas claro y menos ruido visual.

## 19) Categorías: solo income y expense (Mayo 2026)

### Contexto
- La UI ya mostraba Ingreso/Gasto, pero la BD aceptaba subtipos contables (cost, admin_expense, …) heredados del modelo inicial.

### Decision
- `categories.type` canónico: **`income` | `expense`** (alineado con `transactions.type` para ingresos/egresos).
- Migración `20260517120000_categories_income_expense_only.sql`: convierte subtipos legacy a `expense` y actualiza el CHECK.
- Semillas por país (`country-config`, backfill) usan solo esos dos tipos.
- Validación Zod en server actions (`src/lib/validations/category.ts`).

### Razon
- Modelo mental PYME: clasificar movimientos en ingreso o gasto; el desglose contable fino vive en el plan de cuentas / diario, no en la etiqueta de categoría del usuario.

## 20) Roles canónicos en BD y RLS (Mayo 2026)

### Decision
- Slugs de tenant en **`public.users.role`**: solo `admin` | `collaborator` (misma semántica que `src/lib/auth/roles.ts`).
- Slugs legacy (`admin_finanzas`, `vendedor`, …) se migran una vez; la app sigue normalizando metadata JWT antigua vía `normalizeRole()`.
- Políticas RLS sensibles usan **`public.auth_user_is_admin()`** (no listas duplicadas de slugs legacy).

### Implementacion
- Migración `supabase/migrations/20260518140000_canonical_user_roles_rls.sql`:
  - backfill + `CHECK (role IN ('admin','collaborator'))`;
  - función `auth_user_is_admin()`;
  - políticas `transactions_*` y `chart_of_accounts_modify` actualizadas;
  - trigger `handle_new_user` asigna `admin` al creador de empresa.
- App: `getProfile` / `getCurrentUserRole` devuelven rol canónico cuando es posible.

### Razon
- Una sola verdad en BD, RLS y UI; menos divergencia colaborador-en-app vs admin-en-RLS.

## 21) Sin modo demo — datos siempre reales (Mayo 2026)

### Decision
- No hay modo invitado ni cookies `demo_mode`. Toda la UI operativa exige sesión Supabase.
- Plan de cuentas: saldos desde RPC / diario (`listChartOfAccountsWithBalances`), nunca datos ficticios en producción.

### Implementacion
- Eliminados `demo-data`, `demo-dashboard`, helpers E2E demo y ramas `isDemoMode` en stores/forms.
- `SeedOnFirstAccess` + migraciones idempotentes repiten el mínimo operativo (caja, banco, categorías) en empresas vacías.

### Razon
- Robustez = un camino de datos; menos bugs y menos costo de mantenimiento.

## 22) Pruebas, E2E y CI (Mayo 2026)

### Decision
- **Calidad mínima por cambio:** `pnpm run verify` (lint, `tsc`, Vitest, build).
- **E2E público:** login/registro sin credenciales (`e2e/public-routes.spec.ts`).
- **E2E autenticado (opcional):** solo si existen `NEXT_PUBLIC_SUPABASE_*` + `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (ver `.env.example`); Playwright proyecto `authenticated` con `storageState` tras `e2e/auth.setup.ts`.
- **CI:** job `e2e` recibe secrets de Supabase y usuario E2E; sin secrets, los specs autenticados no se registran (proyecto omitido en config).

### Implementacion
- `playwright.config.ts`: proyectos `setup` + `chromium` + `authenticated` condicional.
- `e2e/helpers/auth.ts`, `e2e/authenticated/*.spec.ts`.
- `.github/workflows/ci.yml`: variables desde GitHub Secrets.

### Razon
- CI verde sin secrets de staging; equipos con proyecto E2E dedicado obtienen cobertura de flujos reales sin reintroducir demo.

