#!/usr/bin/env bash
# Verificación previa al piloto con cliente (local o CI con secrets E2E).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> pnpm run verify"
pnpm run verify

echo ""
echo "==> E2E (públicas + autenticadas si hay secrets)"
if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" && -n "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  pnpm run test:e2e:ci
else
  echo "    (sin NEXT_PUBLIC_SUPABASE_* — solo se listan tests E2E)"
  pnpm run test:e2e:list
fi

echo ""
echo "==> Migraciones pendientes en Supabase"
if command -v supabase >/dev/null 2>&1; then
  pnpm sb:push:dry || echo "    Ejecutá: supabase login && pnpm sb:push"
else
  echo "    Instalá Supabase CLI en PATH y corré: pnpm sb:push:dry && pnpm sb:push"
fi

echo ""
echo "Listo. Smoke manual sugerido: registro → ingreso → aprobar → reportes → transferencia."
