# Gestion PYME Pro - Project Rules

## Project Overview
Sistema de Gestion Economica-Financiera para PYMEs. PWA con Next.js 14, Supabase, Drizzle ORM, shadcn/ui.

## Tech Stack
- Frontend: Next.js 14 (App Router) + PWA (Serwist)
- Backend: Supabase (PostgreSQL + Auth + RLS + RPC + Edge Functions)
- ORM: Drizzle ORM
- State: Zustand
- Validation: Zod
- UI: shadcn/ui + Recharts + Tailwind CSS
- Testing: Vitest
- Monorepo: Turborepo

## Architecture
Clean Architecture + DDD. See `.opencode/skills/clean-architecture/SKILL.md` for full rules.

## Data Protection
Financial data is sacred. See `.opencode/skills/financial-data-protection/SKILL.md` for full rules.

## UI Style
ClickUp-inspired. See `.opencode/skills/gestion-pyme-style/SKILL.md` for full rules.

## Code Standards
- TypeScript strict mode (no any, no implicit returns)
- camelCase for variables/functions, PascalCase for classes/interfaces
- snake_case for database columns
- Comments: short, clear, explain WHY not WHAT
- No unused code, no unused dependencies
- Reuse before creating new utilities

## Key Business Rules
- Metodo devengado for Estado de Resultados
- Metodo percibido for Flujo de Caja
- 4 users per company max
- Multi-empresa, multi-moneda
- Soft delete ONLY (never physical delete)
- Audit trail on every change
- Period closing prevents modifications

## Workflow Preferences
**Use terminal/CLI over web dashboards whenever possible.**
- Supabase operations: `supabase db query --linked`, `supabase db push`
- Database: SQL files executed via CLI, not manual SQL Editor
- Automate > Manual copy/paste

## Git Conventions
- Conventional commits: feat:, fix:, refactor:, docs:, chore:
- Feature branches from main