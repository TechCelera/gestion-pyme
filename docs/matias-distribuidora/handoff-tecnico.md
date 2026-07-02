# Matías Distribuidora — handoff técnico

Requisitos, alcance y comercial: **[CONTEXTO.md](./CONTEXTO.md)** (leer primero).  
Diagnóstico Bernabé: [v3 PDF](./Diagnostico_Alcance_Matias_Distribuidora_BORRADOR_v3.docx.pdf).

Rama: `feature/matias-distribuidora` · Perfil: `operating_profile: 'distribuidora'`

---

## Arranque

```bash
cd ~/proyectos/gestion-pyme
git checkout main && git pull
git checkout -b feature/matias-distribuidora   # o checkout si existe
pnpm install && pnpm run dev
```

Tenant demo: empresa `Matías Distribuidora`, AR/ARS. Usuarios **admin (Matías)** + **collaborator (operador)**. Seed: proveedores, clientes, categorías CMV + gastos.

---

## Lógica a respetar (v3)

| Módulo | Base | Fuente de datos |
|--------|------|-----------------|
| Estado de Resultados | Mixto | Ventas/compras **devengado**; gastos operativos **percibido** |
| Flujo de caja | Percibido puro | Cobros, pagos, cheques (recibidos + emitidos) por vencimiento |

**RBAC:** bruto, neto y ganancia → solo `role: admin`. Operador carga; no ve resultados.

---

## Orden de build

```
Excels Matías → import-mapping.md → Import Excel ventas + compras (sem 3)
    → Cheques recibidos/emitidos + cobros/pagos + flujo caja (sem 4)
    → Reportes día/semana + bruto/neto + RBAC operador (sem 4–5)
    → UX operador + migración (sem 5–6)
```

Sin Excels: tenant seed + mocks para demo.

---

## P0 checklist

- [ ] **Import Excel ventas y compras** — `src/lib/imports/` + action + UI upload
- [ ] **Cheques recibidos y emitidos** — inmediato/diferido, vencimiento; `payment-medium.ts`
- [ ] **Cobros y pagos (percibido)** — distinto de devengado; CC cuando no cobra al momento
- [ ] **Flujo de caja** — vista diaria/semanal independiente de P&L
- [x] **Reportes día/semana (resultados)** — `reports-period.ts` + tabs `/reportes`
- [x] **Bruto vs neto** — `distribuidora-results.ts` + card *(falta: solo admin + gastos percibido estricto)*
- [ ] **RBAC roles** — ocultar resultados a `collaborator`; seed operador
- [ ] **UX carga única** — form corto, ocultar proyectos; nav vía `operating_profile`
- [x] **`operating_profile`** — migración + `company-settings.ts`

### P1 demo

- [x] Tenant demo + seed movimientos ficticios *(parcial: falta operador, CC, cheques)*
- [ ] Dashboard resumen del día *(título dice día; datos aún semana)*
- [ ] Probar móvil *(bottom-nav pasa `isAdmin: true` fijo)*

### P2 post-firma

- [ ] Migración histórico planillas
- [ ] Capacitación operador + soporte 60 días

---

## Archivos probables

```
src/lib/utils/reports-period.ts
src/lib/distribuidora/distribuidora-results.ts
src/lib/movements/payment-medium.ts
src/lib/actions/movements/reports.ts
src/lib/imports/
src/components/movements/movement-form.tsx
src/lib/navigation/dashboard-nav.ts
src/lib/company-operating-profile.ts
src/app/(dashboard)/dashboard/page.tsx
src/components/layout/bottom-nav.tsx
supabase/migrations/
```

---

## Reglas

- **No** repo `matias-erp` ni fork permanente
- **No** `if (companyName === 'Matías')` — usar `operating_profile`
- **No** prometer etapa 2 en código v1
- Reusable → merge a `main`; mapping Pedro Veglia → config por empresa
- **No** mostrar bruto/neto al operador (v3 §2)

---

## Verificación

```bash
pnpm run verify
```

Tests nuevos: parser import (`src/lib/imports/__tests__/`), cheques en `payment-medium` tests, RBAC distribuidora en dashboard/reportes.
