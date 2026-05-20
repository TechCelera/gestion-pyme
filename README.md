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

## Requisitos y paquetes

Este repo usa **[pnpm](https://pnpm.io)** (no npm ni yarn). Lockfile: `pnpm-lock.yaml`.

**Arch / CachyOS (recomendado):** instalá pnpm del sistema; **no hace falta `corepack`** (muchas builds de Node en Arch no lo incluyen).

```bash
sudo pacman -S pnpm
cd gestion-pyme
pnpm install
pnpm run dev
```

Si tenés `corepack` (probá `which corepack`), podés fijar la versión del repo:

```bash
corepack enable
corepack prepare pnpm@10.12.4 --activate
```

`package.json` incluye `preinstall` con `only-allow pnpm` para evitar `npm install` accidental. Con `pnpm` del sistema (p. ej. 10.33) funciona igual que la versión pinneada en `packageManager`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase (auth, database, RLS, RPC)
- Zustand
- Vitest + Testing Library (unit / integracion ligera en jsdom)
- Playwright (E2E en Chromium; carpeta `e2e/`)

## Pruebas y robustez

Copiá `.env.example` → `.env.local` y completá Supabase. Para E2E autenticado, creá un usuario de prueba (email confirmado) y definí `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`.

| Comando | Que hace |
|---------|----------|
| `pnpm run verify` | ESLint + `tsc` + Vitest + `next build` (obligatorio antes de merge) |
| `pnpm run test:e2e` | E2E asumiendo **`pnpm run dev` en 3000** (público + autenticado si hay credenciales E2E). |
| `pnpm run test:e2e:ci` | E2E levantando el dev con Playwright (CI o máquina sin servidor). |
| `pnpm run verify:all` | `verify` + `test:e2e:ci` (CI / sin dev previo). |
| `pnpm run verify:all:local` | `verify` + `test:e2e` (con `next dev` ya en marcha). |
| `pnpm run playwright:install` | **Rápido:** chromium-headless-shell + ffmpeg. |
| `pnpm run playwright:install:full` | Chromium completo (headed / UI mode). |

**CI (GitHub):** secrets `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`. Sin ellos, CI sigue pasando con specs públicos.

**Migraciones:** `pnpm sb:push:dry` → `pnpm sb:push`. Roles canónicos: `20260518140000_canonical_user_roles_rls.sql` (ver `docs/DECISIONES.md` §20–22). Pendiente en remoto si aplica: `20260523140000_rpc_contact_name_join.sql` (nombre de contacto en listado/detalle).

**Supabase CLI (Linux):** binario del sistema en PATH, no `npm i -g supabase`. En releases recientes hace falta el par `supabase` + `supabase-go` del mismo `.tar.gz` (p. ej. extraer en `~/.local/share/supabase` y `export PATH="$HOME/.local/share/supabase:$PATH"`). En CachyOS/Arch, `supabase-bin` del AUR a veces falla checksums; usar tarball oficial.

## Scripts

```bash
pnpm run dev
pnpm run build
pnpm run start
pnpm run lint
pnpm run test:run
pnpm run verify
pnpm run test:e2e
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
