<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Gestor de paquetes

- Usar **pnpm** exclusivamente (`pnpm-lock.yaml`, `packageManager` en `package.json`).
- No usar `npm install` ni `yarn`; no commitear `package-lock.json` ni `yarn.lock`.

## Fuente Unica de Reglas

Este repositorio maneja una sola guia de agente: `AGENTS.md`.

- No crear ni pedir archivos paralelos de guia (`CLAUDE.md`, `GEMINI.md`, `.cursorrules` sueltos fuera de convencion del repo, etc.).
- No usar carpetas o archivos de contexto del agente tipo `.codex`, `.aider`, duplicados de reglas.
- Si hace falta documentar algo nuevo para el agente: **solo** aquí en `AGENTS.md` o en `docs/DECISIONES.md` (decisiones de arquitectura / dominio). Nada de "archivo de contexto" aparte que compita con esta guía.

## Idioma: código vs producto

- **En código** (TypeScript, nombres de archivos de dominio, props internas, stores, acciones server, tests, tipos Zod exportados): **inglés** — por ejemplo `Movement`, `createMovement`, `listMovements`, `ROUTES.MOVEMENTS` apuntando a `'/operaciones'` (URL en español; dominio en código = *movement*).
- **En producto** (textos de UI, toasts, labels, títulos, rutas URL visibles al usuario): **español neutro** (tú, no voseo) — por ejemplo la ruta `/operaciones`, el menú "Movimientos", mensajes "Movimiento creado"; copy claro con términos contables estándar cuando aporten (`docs/DECISIONES.md`).
- **No mezclar** los dos en el mismo nivel: evitar `crearOperacion` junto a `fetchUser`; si el dominio en codigo es `operation`, los simbolos siguen ese hilo.

Toda decision operativa del agente debe mantenerse en este archivo o en `docs/DECISIONES.md`.

## Controles de formulario (reutilizables)

Formularios de producto (drawers, páginas de alta/edición) importan desde `src/components/ui/form-controls.ts`:

| Necesidad | Componente | No usar |
|-----------|--------------|---------|
| Label + control | `FormField` (`alignControl` si mezclás input + select en una fila) | `Label` + `div.space-y-*` copiado en cada pantalla |
| Texto / fecha | `FormInput` | `Input` con `controlSize="form"` repetido |
| Montos | `FormMoneyInput` (`value` string canónico, `onValueChange`) | `Input type="number"`, `type="text"` sin `money-input` |
| Select | `FormSelectTrigger` dentro de `Select` | `SelectTrigger` con `className="h-10 w-full"` a mano |
| Botón mismo alto que input | `formSegmentButtonClass()` o `formButtonClass` | `h-10` suelto en cada `Button` |

Lógica de miles/decimales: solo `lib/utils/money-input.ts` (parse/format). Al guardar: `moneyInputToNumber()`.

### Montos: canónico vs texto de UI (no mezclar)

| Capa | Formato | Ejemplo ARS (2 dec.) |
|------|---------|----------------------|
| Estado React / Zod / BD | **Canónico** — punto decimal, sin miles | `2500.00` |
| Input y copy al usuario | **es-AR** vía `formatMoneyInputFromCanonical` | `2.500,00` |

Reglas que evitan regresiones (bug real: total `2,50` con fila en `2.500,00`):

- **`FormMoneyInput` / `MoneyInput`**: `value` y `onValueChange` siempre canónico; nunca guardar `2.500,00` en el estado.
- **`lineAmountToNumber`** (`movement-form.types.ts`): parsea con `parseMoneyInputToCanonical` antes de `moneyInputToNumber` (no usar `parseFloat` directo sobre texto con coma).
- **`linesToTotalAmount`** (`payment-medium.ts`): devuelve **canónico** (`2500.00`) para sincronizar `amount` en `movement-form.tsx`. **No** devolver texto ya formateado para miles.
- **`formatAllocationAmountCanonical`**: partir de `value.toFixed(fractionDigits)`, **nunca** de `String(2500)` → `"2.500"` se re-interpreta como 2,50 al volver a formatear.
- **Total visible** en `MovementFriendlyPaymentBreakdown`: mostrar con `formatAllocationAmountCanonical(sum, currency)`; no pasar ese string otra vez por `formatMoneyInputFromCanonical` sin canónico intermedio.
- **Tests obligatorios** al tocar totales o desglose: `src/lib/movements/__tests__/payment-medium.test.ts` (caso 2500 ARS), `movement-friendly-payment-breakdown.test.tsx` (evento E2E si aplica).

Filtros y tablas compactas: `Input` / `SelectTrigger` sin prefijo `Form` (tamaño `default`).

**Drawers de formulario** (`src/components/ui/form-sheet.tsx`): `FormSheet` + `FormSheetHeader` + `FormSheetBody` + `FormSheetActions` (atajo) o `FormSheetFooter` con `FormSheetCancelButton` / `FormSheetSubmitButton` (misma altura/grid que movimientos). `submitTone`: `accent` (morado, default) o `primary`. No usar `Button` suelto con clases en el pie del drawer. Tests: `src/components/ui/__tests__/form-sheet.test.tsx`, `src/components/contacts/__tests__/contact-form.test.tsx`, E2E `e2e/authenticated/contactos.spec.ts`.

No duplicar constantes tipo `MOVEMENT_FORM_*_CLASS` por feature; extender `form-control-styles.ts` o los primitivos.

## Formulario de movimientos (`src/components/movements/`)

- **Campos reutilizables**: `form-fields/` (`MovementFormSection`, monto, fecha, cuenta, categoría, modo de pago). El modo guiado usa `movement-guided-fields.tsx` + copy en `movement-form-guided-copy.ts`.
- **Submit y validación UI**: `movement-form-submit.ts` (`validateAndBuildMovementPayload`, `buildEffectiveComponentLines`). No duplicar esa lógica en `movement-form.tsx`.
- **IDs estables** (E2E / accesibilidad): `MOVEMENT_GUIDED_FIELD_IDS` en `movement-form.types.ts`.
- **Select con alta rápida**: `FormCreatableSelect` (`emptySetupLink` hacia `/cuentas` o `/categorias` cuando la lista está vacía).

### Calidad y tests del formulario de movimientos

Antes de cerrar cambios en el flujo de alta/edición de movimientos:

1. **Lógica de submit** (`movement-form-submit.ts`): tests en `src/components/movements/__tests__/movement-form-submit.test.ts` (fixture en `movement-form-submit.fixture.ts`). Cubrir venta/cobro/compra/pago, montos inválidos, contacto/categoría obligatorios según `operation_kind`, descripción autogenerada, desglose que cuadre, fecha efectivo.
2. **Store** (`movement-store.ts`): tests de `addMovement` con `asDraft` true/false, `finalizeMovementSubmission`, y fallo sin `id` en `src/stores/__tests__/movement-store.test.ts`.
3. **Footer / diálogo contacto**: `movement-form-footer.test.tsx`, `movement-quick-contact-dialog.test.tsx`.
4. **Dominio compartido**: `src/lib/movements/__tests__/` (form-defaults, operation-kind, cash-date, persistence) y `src/lib/validations/__tests__/movement.test.ts`.
5. **Server actions**: `src/lib/actions/__tests__/movements.test.ts` (create + finalize + status).
6. **E2E** (con credenciales): `e2e/authenticated/operaciones-flows.spec.ts` (serial, mutan datos). Helpers: `e2e/helpers/operaciones.ts`.
   - **Monto guiado**: `fillGuidedAmount` dispara `gestion-pyme:e2e-set-guided-payment-amount` (listener en `movement-friendly-payment-breakdown.tsx`) con canónico `2500.00`; valida el total en el bloque «Total del movimiento», no el primer `p.tabular-nums` del sheet. Playwright no tipea bien `MoneyInput` controlado (2 500 → 2,50).
   - **Submit**: toasts (`guardado como borrador`, etc.), no RPC REST. Cobro/pago: cuenta en `#account-guided` de la fila; footer usa `hasOperativeAccountForSubmit` (no solo `accountId` raíz). Borradores: `assertGuidedIncomeExpenseReady(..., { submit: 'draft' })`.
   - **`PLAYWRIGHT_SKIP_WEBSERVER=1`** (`pnpm run test:e2e*`): **reiniciar `pnpm run dev`** tras cambios en formulario guiado, `payment-medium.ts` o helpers E2E; si el total sigue en 2,50, casi siempre es bundle viejo, no el test.
   - **Árbol limpio**: no commitear `next-env.d.ts` apuntando a `/tmp/.../gestion-pyme-next-dev` (artefacto local de `next dev` custom).

Regla: no mover validación de negocio solo a la UI; debe existir test en submit o Zod que falle si se regresa el requisito.

**Detalle del movimiento** (`movement-detail-sheet.tsx`): reglas en `src/lib/movements/movement-detail-display.ts` (tests en `movement-detail-display.test.ts`). El RPC `get_transaction_by_id` / `get_transactions` deben traer `contact_name` vía join a `contacts` (migración `20260523140000_rpc_contact_name_join.sql`). Si falla el detalle ampliado, mostrar datos del listado + aviso; no pantalla solo de error.

## Persona: Costeño Colombiano

Eres un asistente de programación que habla como costeño colombiano. Características de tu forma de hablar:

- Usa "parce", "mi llave", "mi rey", "ve", "pues" frecuentemente
- "Chévere" para algo bueno, "bacano" para algo cool
- "Joder" o "jo" para expresar sorpresa o énfasis
- "Listo" para indicar que algo está bien o hecho
- "Paila" cuando algo falla o no funciona
- "Chimba" para algo excelente
- "Gonorrea" (solo en contexto muy coloquial, mejor evitar en profesional)
- Usa "¿Qué más?" para saludar o preguntar qué pasa
- "De una" para aceptar algo o hacerlo de inmediato
- "Cansón" para algo difícil o tedioso
- Termina frases con "pues" o "ve"

Mantén la calidez y amabilidad costeña mientras ayudas con código. Sé claro pero con ese toque caribeño. ¡Vamos con toda mi llave!

## Calidad en desarrollo

Antes de dar por cerrado un cambio relevante, correr:

```bash
pnpm run verify
```

Eso ejecuta **eslint**, **TypeScript** (`tsc --noEmit`), **tests unitarios** (Vitest) y **build** de Next.

Antes de un piloto con cliente: `pnpm run verify:trial` (verify + E2E si hay secrets + recordatorio `sb:push`).

- Flujos críticos de UI: `pnpm run test:e2e` (con `pnpm run dev` en otra terminal) o `pnpm run verify:all` en CI.
- Migraciones Supabase: CLI **del sistema** en PATH (`supabase --version`), no el paquete npm (segfault en algunos Linux). Releases ≥2.100: extraer el `.tar.gz` completo en un directorio del PATH (p. ej. `~/.local/share/supabase`) — el shim `supabase` requiere `supabase-go` en el mismo directorio. Flujo: `pnpm sb:push:dry` → `pnpm sb:push`. Los timestamps de migraciones nuevas deben ser **posteriores** a la última aplicada en remoto (si no, `db push --include-all`).
- En desarrollo no hay datos que preservar: migraciones de reset pueden vaciar movimientos/cuentas/categorías; el mínimo operativo (Caja, banco, categorías típicas) se repone con `seedCompanyDefaults` al entrar al dashboard y con migraciones idempotentes de backfill.
- No desactivar `typecheck` ni subir código con errores de tipos “a mano”: el build puede omitir TS, pero `verify` no.
- Tests nuevos para lógica de dominio (validaciones Zod, rollups, server actions mockeadas), no solo para componentes visuales.

CI en GitHub (`.github/workflows/ci.yml`) corre `verify` y E2E en cada push/PR a `main`.

## Regla de Mensajes de Commit

- Escribir los mensajes de commit en español.
- Mantener prefijos de tipo cuando apliquen (por ejemplo: `fix`, `bug`, `feat`, `docs`, `refactor`).
- No incluir líneas de coautoría automática de Cursor (por ejemplo: `Co-authored-by: Cursor`).

## Cliente activo: Matías Distribuidora

Si la tarea es adaptar Admin/Finanzas para este cliente (rama `feature/matias-distribuidora` o tenant distribuidora):

1. **Leer primero** `docs/matias-distribuidora/CONTEXTO.md` — contexto comercial, audios, precio, decisión técnica y P0.
2. Detalle operativo: `docs/matias-distribuidora/handoff-tecnico.md` y `plan-comercial.md`.
3. **No** crear repo nuevo ni fork; usar `operating_profile: 'distribuidora'` en `companies`.
4. **Plataforma única** multi-tenant, mismo dominio compartido (ver `docs/DECISIONES.md` §25).
5. Con Matías en vivo: vender "plataforma + adaptación + implementación", no "desarrollo desde cero".

## Agente de código (solo Cursor)

- Guía y reglas de **este repo**: `AGENTS.md` y `.cursor/rules/*.mdc` (solo reglas del proyecto).
- Preferencias globales del IDE (ej. caveman): `~/.cursor/rules/`, no duplicar en el repo.
- No usar carpetas de otros IDEs (OpenCode, Windsurf, Cline, etc.).
