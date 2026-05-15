# Gestion PYME — Propuesta de mejoras

**Para:** socio / dueño de la idea
**Objetivo:** que des el visto bueno antes de arrancar el desarrollo
**Lectura estimada:** 6 minutos

---

## La idea

El sistema funciona bien por dentro, pero la experiencia de uso está pensada para un administrador de empresas. Queremos que cualquier persona lo use en menos de 10 segundos sin necesitar capacitación.

**Filosofía:** el producto es **control de gestión** — ayudar al dueño o al administrador a **tomar decisiones** con números claros, no solo a “llevar un libro”. Ese control debe poder hacerse con **ritmo de dirección**: cierres y lecturas **mensuales** y **trimestrales** (además del día a día cuando haga falta).

La propuesta hace tres cosas a la vez:
1. **Simplifica la pantalla** del día a día — formulario de 4 campos para el caso común.
2. **Agrega los campos formales** que pediste (cliente, plazo, factura) — pero solo cuando el movimiento lo requiere, sin abrumar en el resto.
3. **Análisis por proyecto** — elegís un proyecto y ves **resultado** y **comparación presupuestado vs real** (no solo totales globales de la empresa), con **periodo mensual o trimestral** (y el mes/trimestre que elijas).

---

## Control de gestión: mensual y trimestral

Los **Informes** y el **análisis por proyecto** están pensados para que el equipo de dirección pueda:

- **Cada mes:** ver cómo cerró el mes (ingresos, gastos, flujo, desvíos frente a lo previsto).
- **Cada trimestre:** ver la tendencia y comparar trimestres (útil para decisiones de inversión, personal o nuevas obras).

No es solo una pantalla “bonita”: es el **mismo criterio de números** (movimientos aprobados, proyectos con presupuesto) aplicado a **ventanas de tiempo** que el negocio ya usa en la práctica.

---

## Los dos modos de movimiento

### Modo rápido — plata que ya entró o salió

Para el mostrador, el efectivo, la transferencia al instante. Solo 4 campos:

```
┌──────────────────────────────────────────────────┐
│  ¿Entró o salió plata?                            │
│   ◉ 🟢 Entró      ○ 🔴 Salió                      │
│                                                   │
│  ¿Cuánto?     [ $ 50.000           ARS ]          │
│  ¿De qué fue? [ Venta de servicios   ▼ ]          │
│  ¿Dónde?      [ Caja efectivo        ▼ ]          │
│                                                   │
│  [ Cerrar ]  [ Guardar borrador ]  [ Enviar ]     │
└──────────────────────────────────────────────────┘
```

### Modo cuenta corriente — cuando quedan debiendo

Para ventas a plazo o compras a proveedores. El sistema activa los campos obligatorios cuando el usuario elige "Queda debiendo":

```
┌──────────────────────────────────────────────────┐
│  ¿Cuánto?     [ $ 850.000          ARS ]          │
│  ¿De qué fue? [ Venta de servicios   ▼ ]          │
│  ¿Cómo se paga?                                   │
│   ○ Ya cobré todo                                  │
│   ◉ Queda debiendo (cuenta corriente)              │
│                                                   │
│  ── Campos obligatorios ─────────────────────     │
│  Cliente:         [ Juan SA          ▼ + crear ]  │
│  Plazo de cobro:  [ 30 días            ▼ ]        │
│  Vence el:        [ 12/06/2026 ]                  │
│                                                   │
│  ── Comprobante (opcional) ──────────────────     │
│  ☐ Factura oficial → datos + adjuntar PDF         │
│                                                   │
│  [ Cerrar ]  [ Guardar borrador ]  [ Enviar ]     │
└──────────────────────────────────────────────────┘
```

---

## Roles y flujo de aprobación

El sistema tiene dos roles. Puede haber varios administradores por empresa.

| Rol               | Quiénes son                    | Qué puede hacer                                             |
| ----------------- | ------------------------------ | ----------------------------------------------------------- |
| **Colaborador**   | Vendedores, operadores         | Crear, editar y enviar movimientos a aprobación             |
| **Administrador** | Dueños, encargados de finanzas | Todo lo anterior + Aprobar, Rechazar y Cancelar movimientos |

**Aprobación (acordado):** si el movimiento lo registra un **colaborador**, queda en **Pendiente** hasta que **cualquier administrador** lo revise y lo apruebe. Si lo registra un **administrador**, puede **aprobarlo él mismo** o dejarlo para que lo apruebe **otro administrador** (por ejemplo el socio).

Un movimiento pasa por 5 estados:

```
                         ┌─── 🟠 RECHAZADO ───┐
                         │   (admin rechaza)   │ (colaborador corrige)
                         ▼                     │
⚪ BORRADOR  →  🟡 PENDIENTE  →  🟢 APROBADO  →  🔴 CANCELADO
  (colaborador     (esperando        (impacta           (estado
   lo crea)         al admin)         el saldo)          final)
```

| Estado       | Color    | Quién lo mueve                              | ¿Impacta el saldo? |
| ------------ | -------- | ------------------------------------------- | ------------------ |
| Borrador     | Gris     | El colaborador lo crea y edita              | No                 |
| Pendiente    | Amarillo | El colaborador lo envía                     | No                 |
| Rechazado    | Naranja  | El admin rechaza con motivo escrito         | No                 |
| Aprobado     | Verde    | El admin aprueba                            | **Sí**             |
| Cancelado    | Rojo     | El admin cancela con motivo escrito         | Anula el impacto   |

**Flujo típico:** Maria carga el movimiento y lo envía → Walter recibe un aviso → lo revisa y aprueba → el saldo se actualiza.

**Si hay un error:** Walter lo rechaza con un motivo escrito → queda en estado **Rechazado** (visible para Maria con el mensaje) → Maria hace la corrección desde ese mismo estado y lo reenvía → vuelve a **Pendiente** para que Walter lo apruebe.

**Reglas de inmutabilidad:**
- Un movimiento aprobado **no se edita nunca**. Si hay un error, se cancela con motivo escrito y se carga uno correcto.
- La cancelación es siempre **total**. Si fue una devolución parcial, se registra un nuevo movimiento opuesto.

---

## Lo que cambia y lo que no

| No cambia (queda intacto)                              | Cambia                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Usuarios, empresas y permisos actuales                 | Todos los textos pasan a lenguaje común (ver tabla de nombres abajo)     |
| Cuentas operativas ya creadas (caja, banco, billetera) | Formulario de movimientos rediseñado                                     |
| Categorías y proyectos existentes                      | 5 estados con colores semafóricos (Borrador/Pendiente/Rechazado/Aprobado/Cancelado) |
|                                                        | **Contactos**: alta desde el mismo registro; **tipo de cliente** (ej. particular / corporativo); **servicios asociados** al cliente |
|                                                        | Nueva pestaña en Cuentas: **Plan de cuentas** (mapa contable, solo lectura) |
|                                                        | **Análisis por proyecto**: presupuesto estimado vs movimientos reales, por proyecto/subproyecto y por periodo (mes / trimestre) |
|                                                        | **Informes** con enfoque **control de gestión**: cierre y comparación **mensual** y **trimestral** |
|                                                        | Los movimientos actuales se reinician para arrancar sobre el modelo nuevo |

---

## Cambio de nombres — lenguaje humano

Todos los textos técnicos actuales se reemplazan por lenguaje cotidiano:

| Texto actual (técnico)              | Texto nuevo (humano)                      |
| ----------------------------------- | ----------------------------------------- |
| Dashboard                           | Inicio                                    |
| Operaciones                         | Movimientos                               |
| Ingreso / Egreso *(panel izquierdo)* | **Ventas y cobros** / **Compras y pagos** |
| Tipo al crear movimiento *(Ingreso / Egreso / Transferencia)* | **Venta/Cobro** / **Compra/Pago** + **Pasaje entre cuentas** *(cuando aplique)* |
| Transferencia *(entre cuentas propias)* | Pasaje entre cuentas                      |
| Postear / Contabilizar              | *(desaparece — ahora es solo Aprobar)*    |
| Contabilizado / Aprobado / Posted   | Aprobado                                  |
| Cuentas                             | Mis cuentas                               |
| Reportes                            | Informes *(control de gestión: lectura mensual y trimestral)* |
| Utilidad Neta                       | Lo que te quedó                           |
| Estado de Resultados                | Ganancias del período                     |
| Activos / Pasivos / Patrimonio      | Lo que tenés / Lo que debés / Tu capital  |
| Flujo de Caja                       | Plata que entró y salió                   |
| Origen de fondos                    | ¿De dónde sale la plata?                  |
| Desglose de cobro/pago              | ¿Cómo se pagó?                            |
| Cancelar *(botón de cerrar form)*   | Cerrar *(para no confundir con cancelar un movimiento)* |

---

## Plan de cuentas en la sección Cuentas

La sección **Mis cuentas** pasa a tener dos pestañas:

```
┌─────────────────────────────────────────────────────────┐
│  Mis cuentas                                             │
│  [ Mis cuentas ]   [ Plan de cuentas ]                  │
│  ──────────────                                          │
│                                                          │
│  Tab "Mis cuentas":   Caja, banco, billetera (igual que hoy)  │
│                                                          │
│  Tab "Plan de cuentas":                                  │
│   ▼ 1   Activo                                           │
│       ▼ 1.1   Activos Corrientes                         │
│             1.1.1   Caja ARS                             │
│             1.1.2   Caja USD                             │
│             1.1.3   Bancos                               │
│       ▶ 1.2   Créditos                                   │
│   ▶ 2   Pasivo                                           │
│   ▶ 3   Patrimonio Neto                                  │
│   ▶ 4   Ingresos                                         │
│   ▶ 5   Egresos                                          │
│                                                          │
│   El mapa contable de tu negocio — solo lectura          │
└─────────────────────────────────────────────────────────┘
```

Este árbol ya existe en la base de datos. Solo hay que mostrarlo en pantalla. En esta primera versión es **solo de consulta** — no se puede editar desde la app.

---

## Análisis por proyecto (presupuesto vs real)

Es **fundamental** poder ver el desempeño **proyecto por proyecto**, no solo la foto global de la empresa.

- Elegís **un proyecto** (y, si aplica, un subproyecto) y el **periodo** (por ejemplo **mes calendario** o **trimestre**).
- La pantalla muestra en lenguaje simple: **qué se presupuestó**, **qué se registró en la realidad** (movimientos aprobados) y la **diferencia** (sobre o bajo presupuesto).
- Sirve para obras, contratos o líneas de negocio que ya cargan en **Proyectos**; los movimientos que llevan `proyecto` alimentan esta vista.

La ubicación exacta en el menú (dentro de **Proyectos**, **Informes** o ambos con enlace cruzado) se define en diseño de navegación, pero la **funcionalidad queda en alcance** del desarrollo.

---

## Decisiones acordadas con el socio

**1. Aprobación cuando el que carga es administrador**  
Sí: puede aprobar **él mismo** o puede aprobar **otro administrador** de la empresa.  
Si carga un **colaborador**, el movimiento queda **Pendiente** hasta que un administrador lo apruebe.

**2. Factura en cuenta corriente**  
**Opcional** — la mayoría de operaciones no usan factura oficial. Debe existir la opción de marcar factura oficial y **adjuntar PDF** cuando corresponda.

**3. Cliente no registrado**  
Sí: crear el cliente **en el mismo flujo de registro**, sin salir de la pantalla.  
Además, al dar de alta o editar un cliente: **tipo de cliente** (ej. cliente final particular / cliente corporativo) y campo **servicios asociados** (texto o lista; ej. honorarios por diseño, dirección de obra, ejecución, administración financiera del presupuesto).

**4. Nombres en la interfaz**  
- Panel izquierdo: **Ventas y cobros** y **Compras y pagos** (en lugar de Ingreso / Egreso como agrupación visible).  
- Al crear un movimiento: elegir **Venta/Cobro** o **Compra/Pago** (más **Pasaje entre cuentas** cuando aplique).

---

*Equipo de desarrollo — Mayo 2026*
