# Matías Distribuidora — demo y reunión

Requisitos, alcance, precios: **[CONTEXTO.md](./CONTEXTO.md)** · PDF: [Propuesta_Matias_Distribuidora.pdf](./Propuesta_Matias_Distribuidora.pdf)

---

## Pre-demo

- [ ] Excels Matías (bloqueante) — ver mensaje abajo
- [ ] Flujo carga única diseñado según planillas
- [ ] Tenant demo + 2 usuarios (matías admin / operador collaborator)
- [ ] Seed: categorías CMV + gastos, 3–5 proveedores, 5–10 clientes, movimientos muestra
- [ ] Probar móvil
- [ ] Validar que **operador no ve** bruto/neto (v3 roles)

### Flujo narrativo (no pantallas sueltas)

| Paso | Mostrar | Mensaje |
|------|---------|---------|
| 1 | Import Excel ventas **y compras** (mock OK) | "Pedro Veglia entra acá — no re-totalizás a mano" |
| 2 | Gasto operativo (form corto, percibido) | "Un clic, no otra planilla — esto baja el bruto al neto" |
| 3 | Cheque recibido o emitido | "Inmediato o diferido — qué entra a caja y cuándo" |
| 4 | Cobro / pago (percibido) | "Plata real — distinto de la venta devengada" |
| 5 | Reporte del día (solo Matías) | "Bruto y neto solos — tu empleado no ve esto" |
| 6 | Flujo de caja día/semana | "Caja chica sin Excel aparte" |
| 7 | CC cliente | "Quién debe, sin planilla aparte" |

Soporte si preguntan: caja `/cuentas`, contactos, reportes mes `/reportes`.

**No prometer v1:** API Pedro Veglia, logística, stock, AFIP.

### Cierre demo

- *"¿Te imaginás a tu empleado cargando ventas, gastos y cheques sin que vos toques Excel ni vea tu ganancia?"*
- Sí → propuesta en 24 h · Duda → 2ª reunión con sus Excels en demo

---

## Excels — pedir a Matías

> Matías, para la demo con tus números necesito estas planillas como las usás hoy:
> 1. Ventas (export Pedro Veglia) · 2. Compras / CMV · 3. Gastos · 4. Caja chica · 5. Cheques (recibidos y emitidos) · 6. CC clientes (si aparte)
> Una semana de ejemplo alcanza.

| Archivo | Uso |
|---------|-----|
| Export ventas PV | Import devengado — total diario ya procesado |
| Compras / CMV | Import devengado — costo mercadería |
| Gastos | Categorías + carga rápida percibida |
| Caja chica | Validar flujo de caja |
| Cheques | monto, banco, inmediato/diferido, recibido/emitido, depositado |
| CC clientes | Saldo e historial por cliente |

Solo ventas + compras + gastos + cheques → cotización firme. Sin export PV → captura del reporte.

---

## Objeciones rápidas

| Dice | Respuesta |
|------|-----------|
| "¿Desarrollo desde cero?" | Plataforma lista; adaptamos a tus planillas en 6 sem |
| "¿Otra planilla más?" | Carga única — reemplaza Excel, no lo duplica |
| "¿Mi empleado ve cuánto gano?" | No — solo vos ves bruto y neto (diseño v3) |
| "Caro" | Comparar tiempo que pierde enlazando planillas + no ver neto |
| "No tengo tiempo" | Por eso capacitamos al empleado operador |
