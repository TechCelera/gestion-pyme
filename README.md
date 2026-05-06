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
- Operaciones con alcance:
  - general de empresa, o
  - proyecto/subproyecto.
- Control de presupuesto y plazo por proyecto/subproyecto.
- Si hay sobrepresupuesto o fuera de plazo:
  - se permite guardar,
  - se marca `requires_budget_approval`,
  - y se exige aprobacion adicional antes de `posted`.
- Terminologia de producto: `Operacion` / `Operaciones`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase (auth, database, RLS, RPC)
- Zustand
- Vitest + Testing Library

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test -- --run
```

## Estructura relevante

- `src/app/(dashboard)/operaciones` - modulo de operaciones
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
