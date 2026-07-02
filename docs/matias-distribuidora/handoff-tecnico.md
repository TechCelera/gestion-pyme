# Matías Distribuidora — handoff técnico

Requisitos, alcance y comercial: **[CONTEXTO.md](./CONTEXTO.md)** (leer primero).

Rama: `feature/matias-distribuidora` · Perfil: `operating_profile: 'distribuidora'`

---

## Arranque

```bash
cd ~/proyectos/gestion-pyme
git checkout main && git pull
git checkout -b feature/matias-distribuidora   # o checkout si existe
pnpm install && pnpm run dev
```

Tenant demo: empresa `Matías Distribuidora`, AR/ARS. Usuarios admin (Matías) + operador. Seed: proveedores, clientes, categorías CMV + gastos.

---

## Orden de build

```
Excels Matías → import-mapping.md → Import Excel (sem 3)
    → Cheques + reportes día/semana + bruto/neto (sem 4)
    → UX operador + migración (sem 5–6)
```

Sin Excels: tenant seed + mocks para demo.

---

## P0 checklist

- [ ] **Import Excel ventas** — `src/lib/imports/` + action + UI upload
- [ ] **Cheques** — `payment-medium.ts`; cuentas `Cheques en cartera` / depositados
- [ ] **Reportes día/semana** — `src/lib/utils/reports-period.ts`
- [ ] **Bruto vs neto** — extensión reportes / dashboard
- [ ] **UX carga única** — form corto, ocultar proyectos; nav vía `operating_profile`
- [x] **`operating_profile`** — migración + `company-settings.ts` *(parcial en rama)*

### P1 demo

- [ ] Tenant demo + seed movimientos ficticios
- [ ] Dashboard resumen del día
- [ ] Probar móvil

### P2 post-firma

- [ ] Migración histórico planillas
- [ ] Capacitación operador + soporte 60 días

---

## Archivos probables

```
src/lib/utils/reports-period.ts
src/lib/movements/payment-medium.ts
src/lib/actions/movements/reports.ts
src/lib/imports/
src/components/movements/movement-form.tsx
src/lib/navigation/dashboard-nav.ts
src/lib/company-operating-profile.ts
supabase/migrations/
```

---

## Reglas

- **No** repo `matias-erp` ni fork permanente
- **No** `if (companyName === 'Matías')` — usar `operating_profile`
- **No** prometer etapa 2 en código v1
- Reusable → merge a `main`; mapping Pedro Veglia → config por empresa

---

## Verificación

```bash
pnpm run verify
```

Tests nuevos: parser import (`src/lib/imports/__tests__/`), cheques en `payment-medium` tests.
