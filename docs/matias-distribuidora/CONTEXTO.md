# Matías Distribuidora — contexto y requisitos

**Fuente única** para construir y vender alineado al cliente.  
Actualizado: 2 jul 2026 · Bernabé + Wilman · Diagnóstico **v3** + audios (1 jul).

| Doc | Solo para |
|-----|-----------|
| [handoff-tecnico.md](./handoff-tecnico.md) | Comandos, archivos, orden de build |
| [plan-comercial.md](./plan-comercial.md) | Checklist demo y guion reunión |
| [Propuesta_Matias_Distribuidora.pdf](./Propuesta_Matias_Distribuidora.pdf) | Entregar a Matías (1 hoja; comercial final en paralelo) |

> El PDF v3 es **requerimientos técnicos internos** para prototipo demostrable — no sustituye la propuesta comercial.

---

## Cliente

| | |
|---|---|
| **Razón comercial** | **Pedro Veglia Distribuidora** |
| **Contacto** | Matías García Hamilton — socio de Gonzalo Veglia |
| **Negocio** | Distribución mayorista frutas y verduras — marca **Pedro Veglia** (app de pedidos, no nombre de empresa) |
| **Mercados** | **Mercofrut** — múltiples proveedores |
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
- Bruto, neto, cheques y caja **automáticos**
- Sin Excels reales no se diseña el import definitivo
- Conoce la operación por dentro — usar ese contexto

### Contexto estratégico (no v1, no cerrar puertas)

- Camionetas de distribución subutilizadas (costo ocioso)
- Posible expansión a otros productos
- Visión futura: **un sistema**, no software disperso (Pedro Veglia + módulos etapa 2)

---

## Roles y accesos (v3 — crítico)

La delegación es de **tareas operativas**, no de visibilidad total del negocio.

| Rol | Acceso |
|-----|--------|
| **Matías (dueño)** | Completo. **Único** perfil que ve Resultado Bruto, Resultado Neto y ganancia consolidada. |
| **Responsable / empleado administrativo** | Operativo: ventas, compras, gastos, cheques, cobros y pagos. **Sin** bruto/neto ni ganancia consolidada. |

**Pendiente definir (v3 §7):** ¿más de un perfil operativo? ¿reportes agregados sin montos de resultado?

**Implementación técnica:** `users.role` (admin vs collaborator) + ocultar cards/reportes de resultado para no-admin en `operating_profile: distribuidora`.

---

## Lógica contable (v3)

### Estado de Resultados — base mixta (devengado + percibido)

| Renglón | Momento | Fórmula |
|---------|---------|---------|
| Ventas | **Devengado** — al generarse la operación | |
| Compras (CMV) | **Devengado** — al generarse la operación | Ventas − Compras = **Resultado Bruto** (margen contribución) |
| Gastos operativos | **Percibido** — al pago efectivo | Bruto − Gastos operativos = **Resultado Neto** |

Ventas y compras se registran al momento de la operación, **independiente** de cuándo se cobra o paga. Los gastos operativos, al pago.

### Flujo de Caja / Caja chica — percibido puro

- **Independiente** del Estado de Resultados.
- Vista **diaria y semanal** (+ mensual).
- Se nutre de: **cobros y pagos efectivos** + **cheques** (recibidos y emitidos) según vencimiento/disponibilidad.

### Cobros y pagos (percibido)

Registro de dinero real, **distinto** del devengado de ventas/compras/gastos. Conecta con **cuentas corrientes** cuando la venta no se cobra al momento.

---

## Requisitos v1 — 6 semanas

Enfoque **económico-financiero**. Adaptar gestion-pyme; no ERP desde cero.

| Requisito | Estado producto |
|-----------|-----------------|
| Registro compras y costos por proveedor (devengado) | Confirmado — ya en producto |
| Registro ventas (devengado, vía Excel PV) | Confirmado — construir import |
| Registro compras (devengado, vía Excel) | Confirmado — construir import |
| Resultado **bruto** automático (ventas − compras/CMV) | Confirmado — vista parcial en rama |
| Resultado **neto** automático (bruto − gastos operativos percibidos) | Confirmado — vista parcial en rama |
| Carga gastos operativos (percibido, ágil) | Confirmado |
| Cheques **recibidos** (inmediato/diferido, vencimiento, disponibilidad) | Confirmado — construir |
| Cheques **emitidos** (vencimiento, disponibilidad, impacto caja) | Confirmado — construir |
| Cobros y pagos (percibido) | Confirmado — parcial en `payment-medium.ts` |
| Flujo de caja / caja chica automático (diario/semanal) | Confirmado — construir |
| Reportes día, semana, mes (resultados **y** flujo de caja) | Confirmado — resultados parcial |
| CC clientes (saldo e historial) | Confirmado — sujeto a Excels |
| Roles y accesos diferenciados | Confirmado — construir RBAC UI |
| Descarga automática desde Pedro Veglia | **Etapa 2** |

**Las 6 semanas no dependen** del acceso al repo Pedro Veglia.

### Etapa 2 (fuera de v1)

- Integración automatizada Pedro Veglia (acceso repo = condición etapa 2)
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

Regenerar PDF comercial: `python3 docs/matias-distribuidora/generar-propuesta-pdf.py`

---

## Pendientes (bloquean diagnóstico final)

1. **Planillas Excel de Matías** — ventas, gastos, caja, cheques (1 semana alcanza) → `fixtures/matias/` + `import-mapping.md`
2. Estructura concreta **CC clientes** (tras Excels)
3. Confirmar si export Excel desde Pedro Veglia existe
4. Definición fina de **roles** más allá de dueño + operativo (v3 §7)

---

## Decisión técnica

```
gestion-pyme · tenant Matías · operating_profile: 'distribuidora'
NO repo nuevo · NO fork · rama feature/matias-distribuidora
```

Ver [docs/DECISIONES.md](../DECISIONES.md) §25 (plataforma multi-tenant).

### Ya en producto (~60–70%)

Movimientos, gastos, compras proveedor, CC en cobros (`payment-medium.ts`), caja, reportes mes/trimestre, auth multi-usuario, diario automático, semilla cuentas cheques (sin UI operativa).

### P0 — construir

| # | Feature | Notas |
|---|---------|-------|
| 1 | Import Excel ventas **y compras** | Depende mapeo Excels; total diario ya procesado |
| 2 | Cheques recibidos + **emitidos** | `payment-medium.ts`; cuentas cartera/depositados |
| 3 | Reportes día / semana (resultados + caja) | `reports-period.ts` — resultados parcial |
| 4 | Vista bruto vs neto (solo dueño) | `distribuidora-results.ts` + RBAC |
| 5 | **Flujo de caja** diario/semanal | Percibido; independiente de P&L |
| 6 | UX operador + carga única | nav corto, form corto, ocultar resultados |
| 7 | `operating_profile` en BD | migración + settings *(hecho)* |
| 8 | **Roles** admin vs operador | Ocultar bruto/neto a collaborator |

### Demo — flujo narrativo

1. Import Excel ventas/compras (mock OK) → 2. Gasto percibido (form corto) → 3. Cheque recibido/emitido → 4. Cobro/pago → 5. Reporte día bruto/neto (dueño) + flujo caja → 6. CC si aplica.  
Detalle: [plan-comercial.md](./plan-comercial.md).

### Cronograma

| Sem | Comercial | Técnico |
|-----|-----------|---------|
| 1–2 | Análisis | Mapeo Excels, flujo carga única, roles, alcance cerrado |
| 3 | Adaptación | Import Excel ventas/compras + categorías CMV |
| 4 | Adaptación | Cheques + cobros/pagos + reportes día/semana + bruto/neto + flujo caja |
| 5–6 | Implementación | RBAC operador, migración, go-live, capacitación |

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

- **[Diagnostico_Alcance_Matias_Distribuidora_BORRADOR_v3.docx.pdf](./Diagnostico_Alcance_Matias_Distribuidora_BORRADOR_v3.docx.pdf)** — borrador interno v3 (diseño funcional, roles, lógica contable)
- [Diagnostico_Alcance_Matias_Distribuidora_BORRADOR_v2.docx.pdf](./Diagnostico_Alcance_Matias_Distribuidora_BORRADOR_v2.docx.pdf) — v2 (30 jun)
- [Diagnostico_Alcance_Matias_Distribuidora_BORRADOR.pdf](./Diagnostico_Alcance_Matias_Distribuidora_BORRADOR.pdf) — v1
- [audios/](./audios/) — WhatsApp 1 jul 2026
