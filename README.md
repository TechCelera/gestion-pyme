# Gestion PYME

Sistema de gestion operativa y financiera para PYMEs, construido con Next.js, Supabase y TypeScript.

## Contexto actual (vigente)

Este repositorio ya no usa la plantilla base de create-next-app como fuente de verdad funcional.  
El contexto de negocio y arquitectura vigente esta en:

- `docs/DECISIONES.md` (fuente principal de decisiones)
- `supabase/migrations/20260502113000_projects_budget_and_operation_scope.sql` (cambios estructurales recientes)
- `src/lib/actions/transactions.ts` y `src/lib/actions/projects.ts` (logica backend actual)

## Decisiones clave implementadas

- Caja unica por empresa.
- Dinero de terceros modelado como `Anticipo de Clientes` (pasivo), no como segunda caja fisica.
- Movimientos con alcance:
  - general de empresa, o
  - proyecto/subproyecto.
- Control de presupuesto y plazo por proyecto/subproyecto.
- Si hay sobrepresupuesto o fuera de plazo:
  - se permite guardar,
  - se marca `requires_budget_approval`,
  - y se exige aprobacion adicional antes de aprobar (flujo financiero).
- Terminologia de producto: **Movimiento** / **Movimientos** (codigo: `Movement`, `movements.ts`).

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase (auth, database, RLS, RPC)
- Zustand
- Vitest + Testing Library (unit / integracion ligera en jsdom)
- Playwright (E2E en Chromium; carpeta `e2e/`)

## Pruebas

| Comando | Que hace |
|---------|----------|
| `npm run verify` | ESLint + Vitest + `next build` |
| `npm run test:e2e` | E2E asumiendo **`npm run dev` en 3000** (no arranca otro servidor; evita EADDRINUSE y el lock de Next). |
| `npm run test:e2e:ci` | E2E levantando el dev con Playwright (CI o máquina sin servidor; **no** lo uses si ya tenés `next dev` en el mismo repo). |
| `npm run verify:all` | `verify` + `test:e2e:ci` (CI / sin dev previo). |
| `npm run verify:all:local` | `verify` + `test:e2e` (con `next dev` ya en marcha en el puerto de `PLAYWRIGHT_BASE_URL`, por defecto **127.0.0.1:3000**). |
| `npm run playwright:install` | **Rápido (recomendado):** solo **chromium-headless-shell** + ffmpeg — alcanza para `test:e2e` en headless (sin el ZIP gigante de Chromium completo). |
| `npm run playwright:install:full` | Chromium completo (~168 MiB + unzip largo). Usalo si vas a `test:e2e:ui` / headed o te falla algo raro. |

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:run
npm run verify
npm run test:e2e
```

## Estructura relevante

- `src/app/(dashboard)/operaciones` - módulo de movimientos (ruta en español; código `movement`)
- `src/app/(dashboard)/proyectos` - gestion de proyectos/subproyectos
- `src/lib/actions` - server actions
- `src/lib/validations` - schemas de validacion
- `src/stores` - estado cliente (Zustand)
- `supabase/migrations` - migraciones SQL
- `docs/DECISIONES.md` - historial de decisiones del proyecto

## Deploy

Deploy principal en Vercel conectado a `master`.

Si el build falla por red en entorno local de desarrollo, validar:

- que el push a `origin/master` se haya realizado correctamente,
- que las migraciones de Supabase esten aplicadas,
- y que el commit desplegado coincida con el esperado en Vercel.
