# Matías Distribuidora — contexto y requisitos

**Fuente única** para construir y vender alineado al cliente.  
Actualizado: 1 jul 2026 · Bernabé + Wilman · Diagnóstico v2 (30 jun) + audios (1 jul).

| Doc | Solo para |
|-----|-----------|
| [handoff-tecnico.md](./handoff-tecnico.md) | Comandos, archivos, orden de build |
| [plan-comercial.md](./plan-comercial.md) | Checklist demo y guion reunión |
| [Propuesta_Matias_Distribuidora.pdf](./Propuesta_Matias_Distribuidora.pdf) | Entregar a Matías (1 hoja) |

---

## Cliente

| | |
|---|---|
| **Contacto** | Matías García Hamilton — socio de Gonzalo Veglia |
| **Negocio** | Distribución mayorista frutas y verduras — marca **Pedro Veglia** (app de pedidos, no nombre de empresa) |
| **Mercados** | Mercofus / Mercosur (doc Bernabé v2 dice "Mercofrut" — confirmar) |
| **Operación** | Compra y vende en el día, sin stock; precios ~5 AM (apertura mercado) |
| **Plazo** | **6 semanas** — delegar admin/finanzas en un empleado |
| **Hoy** | Pedro Veglia → Excel ventas → Excel gestión + Excel cheques aparte. **Matías diseñó las planillas**; por eso no puede soltarlas |
| **Dolor** | Solo ve **bruto** (ventas − CMV); no **neto** (sin gastos operativos). Todo manual, no delega |
| **App operativa** | Pedro Veglia sigue para pedidos en v1; integración API = **etapa 2** (repo sin acceso — Wilman nunca recibió mail) |

### Qué quiere Matías (audios 1 jul)

- Ver **qué hay armado** antes de pagar — no "desarrollo desde cero"
- **Una sola carga** — sin Excel + sistema en paralelo
- Caja/gastos = básico; no paga premium por complejidad
- Asesoramiento, puesta en marcha, guía operativa
- Sensible al precio; compara con otra propuesta

### Criterio Bernabé (validado)

- Demo **pulida**, flujo único (no pantallas sueltas)
- Input fácil según cómo cargan hoy
- Bruto, neto, cheques **automáticos**
- Sin Excels reales no se diseña el import
- Conoce la operación por dentro — usar ese contexto

### Contexto estratégico (no v1, no cerrar puertas)

- Camionetas de distribución subutilizadas (costo ocioso)
- Posible expansión a otros productos
- Visión futura: **un sistema**, no software disperso (Pedro Veglia + módulos etapa 2)

---

## Requisitos v1 — 6 semanas

Enfoque **económico-financiero**. Adaptar gestion-pyme; no ERP desde cero.

| Requisito | Estado |
|-----------|--------|
| Compras y costos por proveedor | Confirmado — ya en producto |
| Resultado **bruto** automático (ventas − CMV) | Confirmado — construir vista |
| Resultado **neto** automático (bruto − gastos operativos) | Confirmado — construir vista |
| Carga gastos diarios | Confirmado |
| Caja chica + cheques (inmediato / diferido / a depositar) | Confirmado — construir |
| Reportes **día, semana, mes** | Confirmado — extender reportes |
| CC clientes | Confirmado — sujeto a estructura Excels |
| Import ventas vía Excel (export Pedro Veglia) | Confirmado — construir |
| Descarga automática desde Pedro Veglia | **Etapa 2** |

**Las 6 semanas no dependen** del acceso al repo Pedro Veglia.

### Etapa 2 (fuera de v1)

- API / integración Pedro Veglia
- Módulo comercial operativo (compras/ventas día a día)
- Logística, remitos, zonas, vehículos, cobranza calle
- Mejoras en app Pedro Veglia
- AFIP / contabilidad formal

---

## Comercial

| Fase | Sem | USD |
|------|-----|-----|
| Análisis | 1–2 | 450 |
| Adaptación del módulo | 3–4 | 300 |
| Implementación | 5–6 | 550 |
| **Total** | **6** | **1.300** |
| Plataforma + soporte | mensual | 55/mes |

Pago: 40% firma · 40% go-live · 20% a 30 días. Piso negociación ~990 setup.

**En reunión con Matías:** "plataforma + adaptación + implementación + carga única". **Nunca** "desarrollo a medida desde cero".

**Orden venta:** Excels → demo flujo único → propuesta/PDF.

Regenerar PDF: `python3 docs/matias-distribuidora/generar-propuesta-pdf.py`

---

## Pendientes (bloquean diagnóstico final)

1. **Excels de Matías** — ventas PV, gestión/consolidado, gastos, caja, cheques, CC (1 semana alcanza) → `fixtures/matias/` + `import-mapping.md`
2. Estructura concreta CC clientes (tras Excels)
3. Confirmar si export Excel desde Pedro Veglia existe

---

## Decisión técnica

```
gestion-pyme · tenant Matías · operating_profile: 'distribuidora'
NO repo nuevo · NO fork · rama feature/matias-distribuidora
```

Ver [docs/DECISIONES.md](../DECISIONES.md) §25 (plataforma multi-tenant).

### Ya en producto (~60–70%)

Movimientos, gastos, compras proveedor, CC (`payment-medium.ts`), caja, reportes mes/trimestre, auth multi-usuario, diario automático, semilla cuentas cheques (sin UI).

### P0 — construir

| # | Feature | Notas |
|---|---------|-------|
| 1 | Import Excel ventas | Depende mapeo Excels |
| 2 | Cheques inmediato/diferido | `payment-medium.ts` |
| 3 | Reportes día / semana | `reports-period.ts` |
| 4 | Vista bruto vs neto | reportes / dashboard |
| 5 | UX operador + carga única | `operating_profile`, nav corto, form corto |
| 6 | `operating_profile` en BD | migración + settings *(en progreso)* |

### Demo — flujo narrativo

1. Import Excel ventas (mock OK) → 2. Gasto/compra (form corto) → 3. Cheque → 4. Reporte día bruto/neto → 5. CC si aplica.  
Detalle checklist: [plan-comercial.md](./plan-comercial.md).

### Cronograma

| Sem | Comercial | Técnico |
|-----|-----------|---------|
| 1–2 | Análisis | Mapeo Excels, flujo carga única, alcance cerrado |
| 3 | Adaptación | Import Excel + categorías CMV |
| 4 | Adaptación | Cheques + reportes día/semana + bruto/neto |
| 5–6 | Implementación | Migración, UX operador, go-live, capacitación |

Build playbook: [handoff-tecnico.md](./handoff-tecnico.md).

### Demo para Matías (sin Excels)

```bash
pnpm sb:push                    # operating_profile en remoto
pnpm run seed:matias-demo       # tenant + movimientos ficticios
pnpm run dev
```

`.env.local`: `NEXT_PUBLIC_DEMO_LOGIN_ENABLED=1`, `DEMO_EMAIL`, `DEMO_PASSWORD`, `NEXT_PUBLIC_DEMO_EMAIL`

URL cliente: **`/login`** (correo y clave ya cargados → Iniciar sesión). Gamma: `https://gestion-pyme-gamma.vercel.app/login`

---

## Referencia Bernabé

- [Diagnostico_Alcance_Matias_Distribuidora_BORRADOR_v2.docx.pdf](./Diagnostico_Alcance_Matias_Distribuidora_BORRADOR_v2.docx.pdf) — borrador interno v2 (30 jun)
- [Diagnostico_Alcance_Matias_Distribuidora_BORRADOR.pdf](./Diagnostico_Alcance_Matias_Distribuidora_BORRADOR.pdf) — v1
- [audios/](./audios/) — WhatsApp 1 jul 2026
