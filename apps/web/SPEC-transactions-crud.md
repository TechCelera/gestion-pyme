# SPEC-transactions-crud.md

## Especificación Técnica: CRUD de Transacciones

**Proyecto**: Gestion PYME Pro  
**Fecha**: 2026-04-20  
**Estado**: APROBADO  
**Cambio**: transactions-crud

---

## 1. Requerimientos Funcionales

### 1.1 Tipos de Transacción Soportados

| Tipo | Descripción | Campos Específicos |
|------|-------------|-------------------|
| `income` | Ingresos (ventas, cobros) | cliente_id, invoice_number |
| `expense` | Egresos (compras/gastos, pagos) | proveedor_id, invoice_number |
| `transfer` | Transferencias entre cuentas | cuenta_origen_id, cuenta_destino_id |
| `adjustment` | Ajustes de conciliación | ajuste_tipo (reconciliación, corrección) |

### 1.2 Flujo de Aprobación

```
DRAFT (Borrador)
    ↓ Enviar a aprobación
PENDING (Pendiente)
    ↓ Aprobar / Rechazar
APPROVED (Aprobado)
    ↓ Contabilizar
POSTED (Contabilizado - solo lectura)
```

- Solo transacciones `POSTED` afectan el balance de cuentas
- Transacciones en `DRAFT` pueden editarse completamente
- Transacciones `PENDING` solo pueden ser aprobadas/rechazadas
- Transacciones `APPROVED` pueden enviarse a `POSTED` o revertirse a `DRAFT`
- Transacciones `POSTED` no pueden editarse ni eliminarse (solo reversión)

### 1.3 Permisos por Rol

| Acción | SuperAdmin | Admin Finanzas | Responsable | Vendedor |
|--------|------------|----------------|-------------|----------|
| Crear transacción | ✅ | ✅ | ✅ | ✅ solo income |
| Editar DRAFT | ✅ | ✅ | ✅ | ✅ solo las suyas |
| Editar PENDING | ❌ | ❌ | ❌ | ❌ |
| Aprobar | ✅ | ✅ | ❌ | ❌ |
| Rechazar | ✅ | ✅ | ❌ | ❌ |
| Postear | ✅ | ✅ | ❌ | ❌ |
| Eliminar DRAFT | ✅ | ✅ | ✅ | ✅ solo las suyas |
| Revertir POSTED | ✅ | ✅ | ❌ | ❌ |
| Ver todas | ✅ | ✅ | ✅ | ✅ de su empresa |

---

## 2. Modelo de Datos

### 2.1 Tabla: transactions (Modificada)

```sql
-- Tabla transactions extendida
CREATE TABLE IF NOT EXISTS transactions (
  -- Campos base (existentes)
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  category_id uuid REFERENCES categories(id), -- Opcional para transfers
  
  -- Tipo extendido
  type varchar(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
  
  -- Método contable
  method varchar(10) NOT NULL CHECK (method IN ('accrual', 'cash')),
  
  -- Estado de aprobación
  status varchar(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'pending', 'approved', 'posted', 'rejected')),
  
  -- Montos
  amount numeric(15,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  exchange_rate numeric(10,6) DEFAULT 1,
  
  -- Fecha
  date date NOT NULL,
  
  -- Descripción
  description varchar(500) NOT NULL,
  
  -- Campos específicos por tipo
  -- Para income/expense
  contact_id uuid, -- Cliente o proveedor
  contact_type varchar(20) CHECK (contact_type IN ('cliente', 'proveedor')),
  
  -- Para transferencias
  source_account_id uuid REFERENCES accounts(id),
  destination_account_id uuid REFERENCES accounts(id),
  
  -- Para ajustes
  adjustment_reason varchar(50) CHECK (adjustment_reason IN ('reconciliation', 'correction', 'other')),
  
  -- Documento adjunto
  document_type varchar(20) CHECK (document_type IN ('invoice', 'receipt', 'ticket', 'other')),
  document_number varchar(50),
  attachment_url text,
  
  -- Metadatos
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  posted_by uuid,
  posted_at timestamptz,
  rejected_by uuid,
  rejected_at timestamptz,
  rejection_reason varchar(255),
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid
);
```

### 2.2 Tabla Auxiliar: transaction_tags (Opcional - V2)

```sql
-- Para futura funcionalidad de etiquetas
CREATE TABLE IF NOT EXISTS transaction_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  transaction_id uuid NOT NULL REFERENCES transactions(id),
  tag varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## 3. API/RPC Functions en Supabase

### 3.1 Funciones de Negocio

```sql
-- Crear transacción con validaciones
CREATE OR REPLACE FUNCTION create_transaction(
  p_company_id uuid,
  p_account_id uuid,
  p_type varchar,
  p_amount numeric,
  p_date date,
  p_description varchar,
  p_category_id uuid DEFAULT NULL,
  p_method varchar DEFAULT 'cash',
  p_currency varchar DEFAULT 'USD',
  p_exchange_rate numeric DEFAULT 1,
  p_contact_id uuid DEFAULT NULL,
  p_contact_type varchar DEFAULT NULL,
  p_source_account_id uuid DEFAULT NULL,
  p_destination_account_id uuid DEFAULT NULL,
  p_adjustment_reason varchar DEFAULT NULL,
  p_document_type varchar DEFAULT NULL,
  p_document_number varchar DEFAULT NULL,
  p_attachment_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id uuid;
  v_period_status varchar;
BEGIN
  -- Validar período
  SELECT status INTO v_period_status
  FROM periods
  WHERE company_id = p_company_id
    AND year = EXTRACT(YEAR FROM p_date)
    AND month = EXTRACT(MONTH FROM p_date);
    
  IF v_period_status = 'closed' THEN
    RAISE EXCEPTION 'Período cerrado: no se pueden crear transacciones';
  END IF;
  
  -- Validar tipo de transacción
  IF p_type = 'transfer' AND (p_source_account_id IS NULL OR p_destination_account_id IS NULL) THEN
    RAISE EXCEPTION 'Transferencias requieren cuenta origen y destino';
  END IF;
  
  IF p_type IN ('income', 'expense') AND p_category_id IS NULL THEN
    RAISE EXCEPTION 'Ingresos y egresos requieren categoría';
  END IF;
  
  -- Insertar transacción
  INSERT INTO transactions (
    company_id, account_id, category_id, type, method, status,
    amount, currency, exchange_rate, date, description,
    contact_id, contact_type, source_account_id, destination_account_id,
    adjustment_reason, document_type, document_number, attachment_url,
    created_by, updated_by
  ) VALUES (
    p_company_id, p_account_id, p_category_id, p_type, p_method, 'draft',
    p_amount, p_currency, p_exchange_rate, p_date, p_description,
    p_contact_id, p_contact_type, p_source_account_id, p_destination_account_id,
    p_adjustment_reason, p_document_type, p_document_number, p_attachment_url,
    auth.uid(), auth.uid()
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;

-- Cambiar estado de transacción
CREATE OR REPLACE FUNCTION update_transaction_status(
  p_transaction_id uuid,
  p_new_status varchar,
  p_reason varchar DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status varchar;
  v_company_id uuid;
BEGIN
  SELECT status, company_id INTO v_current_status, v_company_id
  FROM transactions WHERE id = p_transaction_id;
  
  -- Validar transiciones válidas
  IF v_current_status = 'draft' AND p_new_status NOT IN ('pending', 'deleted') THEN
    RAISE EXCEPTION 'Transición inválida desde draft';
  END IF;
  
  IF v_current_status = 'pending' AND p_new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Transición inválida desde pending';
  END IF;
  
  IF v_current_status = 'approved' AND p_new_status NOT IN ('posted', 'draft') THEN
    RAISE EXCEPTION 'Transición inválida desde approved';
  END IF;
  
  IF v_current_status = 'posted' AND p_new_status <> 'reversed' THEN
    RAISE EXCEPTION 'Transacciones posteadas solo pueden reversarse';
  END IF;
  
  -- Actualizar según el nuevo estado
  IF p_new_status = 'approved' THEN
    UPDATE transactions 
    SET status = p_new_status, approved_by = auth.uid(), approved_at = now(), updated_at = now()
    WHERE id = p_transaction_id;
  ELSIF p_new_status = 'posted' THEN
    UPDATE transactions 
    SET status = p_new_status, posted_by = auth.uid(), posted_at = now(), updated_at = now()
    WHERE id = p_transaction_id;
    -- Actualizar balance de cuenta
    PERFORM update_account_balance(v_company_id);
  ELSIF p_new_status = 'rejected' THEN
    UPDATE transactions 
    SET status = p_new_status, rejected_by = auth.uid(), rejected_at = now(), 
        rejection_reason = p_reason, updated_at = now()
    WHERE id = p_transaction_id;
  ELSE
    UPDATE transactions SET status = p_new_status, updated_at = now() WHERE id = p_transaction_id;
  END IF;
  
  RETURN true;
END;
$$;

-- Obtener transacciones con filtros
CREATE OR REPLACE FUNCTION get_transactions(
  p_company_id uuid,
  p_status varchar[] DEFAULT NULL,
  p_type varchar[] DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_account_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_search varchar DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
) RETURNS TABLE (
  id uuid,
  account_id uuid,
  account_name varchar,
  category_id uuid,
  category_name varchar,
  type varchar,
  status varchar,
  amount numeric,
  currency varchar,
  date date,
  description varchar,
  created_at timestamptz,
  created_by uuid,
  creator_name varchar
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    t.id,
    t.account_id,
    a.name as account_name,
    t.category_id,
    c.name as category_name,
    t.type,
    t.status,
    t.amount,
    t.currency,
    t.date,
    t.description,
    t.created_at,
    t.created_by,
    u.full_name as creator_name
  FROM transactions t
  JOIN accounts a ON t.account_id = a.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN users u ON t.created_by = u.id
  WHERE t.company_id = p_company_id
    AND t.deleted_at IS NULL
    AND (p_status IS NULL OR t.status = ANY(p_status))
    AND (p_type IS NULL OR t.type = ANY(p_type))
    AND (p_date_from IS NULL OR t.date >= p_date_from)
    AND (p_date_to IS NULL OR t.date <= p_date_to)
    AND (p_account_id IS NULL OR t.account_id = p_account_id)
    AND (p_category_id IS NULL OR t.category_id = p_category_id)
    AND (p_search IS NULL OR 
         t.description ILIKE '%' || p_search || '%' OR
         t.document_number ILIKE '%' || p_search || '%')
  ORDER BY t.date DESC, t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;
```

---

## 4. Permisos RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios solo ven transacciones de su empresa
CREATE POLICY transactions_company_isolation ON transactions
  FOR ALL
  USING (company_id IN (
    SELECT company_id FROM users WHERE id = auth.uid()
  ));

-- Política: Crear transacciones (todos los roles de la empresa)
CREATE POLICY transactions_insert ON transactions
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- Política: Editar solo transacciones DRAFT propias ( Responsable y Vendedor )
CREATE POLICY transactions_update_draft ON transactions
  FOR UPDATE
  USING (
    status = 'draft'
    AND company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    AND (
      created_by = auth.uid()
      OR (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'admin_finanzas')
    )
  );

-- Política: No modificar transacciones POSTED
CREATE POLICY transactions_no_update_posted ON transactions
  FOR UPDATE
  USING (status <> 'posted');

-- Política: Solo Admin+ pueden aprobar
CREATE POLICY transactions_approve ON transactions
  FOR UPDATE
  USING (
    status = 'pending'
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'admin_finanzas')
  );

-- Política: Soft delete solo DRAFT
CREATE POLICY transactions_delete ON transactions
  FOR DELETE
  USING (
    status = 'draft'
    AND company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    AND (
      created_by = auth.uid()
      OR (SELECT role FROM users WHERE id = auth.uid()) IN ('superadmin', 'admin_finanzas')
    )
  );
```

---

## 5. Componentes UI Necesarios

### 5.1 Estructura de Componentes

```
src/
├── app/
│   └── (dashboard)/
│       └── transactions/
│           ├── page.tsx              # Página principal con tabla
│           └── layout.tsx            # Layout específico
├── components/
│   └── transactions/
│       ├── TransactionTable.tsx      # Tabla tipo Excel
│       ├── TransactionFilters.tsx    # Filtros avanzados
│       ├── TransactionModal.tsx      # Modal crear/editar
│       ├── TransactionForm.tsx       # Formulario dinámico
│       ├── TransactionStatusBadge.tsx # Badge de estado
│       ├── TransactionActions.tsx    # Botones de acción por fila
│       └── TransactionDetail.tsx     # Vista detalle lateral
```

### 5.2 Props de Componentes Principales

```typescript
// TransactionTable
interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPost: (id: string) => void;
  loading?: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

// TransactionFilters
interface TransactionFiltersProps {
  filters: {
    status?: string[];
    type?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    accountId?: string;
    categoryId?: string;
    search?: string;
  };
  onChange: (filters: TransactionFilters) => void;
  accounts: Account[];
  categories: Category[];
}

// TransactionModal
interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction; // Si existe, es edición
  onSubmit: (data: TransactionFormData) => void;
  accounts: Account[];
  categories: Category[];
}
```

### 5.3 Formulario Dinámico por Tipo

```typescript
// Campos condicionales según tipo
type TransactionFormData = {
  // Campos base (todos los tipos)
  type: 'income' | 'expense' | 'transfer' | 'adjustment';
  date: Date;
  amount: number;
  currency: string;
  description: string;
  method: 'accrual' | 'cash';
  
  // Para income/expense
  accountId: string;
  categoryId?: string;
  contactId?: string;
  contactType?: 'cliente' | 'proveedor';
  
  // Para transferencias
  sourceAccountId?: string;
  destinationAccountId?: string;
  
  // Para ajustes
  adjustmentReason?: 'reconciliation' | 'correction' | 'other';
  adjustmentAccountId?: string;
  
  // Documento
  documentType?: 'invoice' | 'receipt' | 'ticket' | 'other';
  documentNumber?: string;
  attachment?: File;
};
```

---

## 6. Flujos de Usuario

### 6.1 Crear Transacción

```
1. Usuario clickea "Nueva Transacción"
2. Se abre modal con formulario
3. Usuario selecciona TIPO (income/expense/transfer/adjustment)
4. Formulario se adapta mostrando campos relevantes
5. Usuario completa campos obligatorios:
   - Fecha, Monto, Descripción (todos)
   - Cuenta, Categoría (income/expense)
   - Cuenta origen, Cuenta destino (transfer)
   - Cuenta, Motivo (adjustment)
6. Usuario puede adjuntar comprobante
7. Usuario clickea "Guardar como Borrador" o "Enviar a Aprobación"
8. Sistema valida y guarda
9. Si es "Enviar a Aprobación", estado = PENDING
10. Si es "Guardar", estado = DRAFT
```

### 6.2 Editar Transacción

```
1. Usuario busca transacción en tabla
2. Si estado = DRAFT, muestra botón Editar
3. Se abre modal precargado con datos
4. Usuario modifica campos permitidos
5. Sistema valida:
   - Período no cerrado
   - Usuario tiene permiso
   - Transición de estado válida
6. Usuario guarda cambios
7. Sistema actualiza updated_at y updated_by
```

### 6.3 Aprobar/Rechazar

```
1. Admin ve transacciones en estado PENDING
2. Clickea botón "Aprobar" o "Rechazar"
3. Si rechaza, debe ingresar motivo
4. Sistema actualiza estado y registra:
   - approved_by + approved_at (si aprueba)
   - rejected_by + rejected_at + rejection_reason (si rechaza)
5. Si aprueba, transacción pasa a APPROVED
6. Si rechaza, transacción vuelve a DRAFT
```

### 6.4 Postear Transacción

```
1. Admin ve transacciones APPROVED
2. Clickea "Contabilizar"
3. Sistema:
   - Cambia estado a POSTED
   - Actualiza balance de cuenta(s)
   - Registra posted_by y posted_at
   - Crea registro en audit_log
4. Transacción ya no es editable
```

### 6.5 Eliminar Transacción

```
1. Usuario encuentra transacción DRAFT
2. Clickea "Eliminar"
3. Sistema muestra confirmación
4. Si confirma, ejecuta soft delete:
   - deleted_at = NOW()
   - deleted_by = auth.uid()
5. Transacción desaparece de la lista (pero persiste en BD)
```

---

## 7. Validaciones de Negocio

### 7.1 Validaciones de Campo

| Campo | Validación | Mensaje Error |
|-------|------------|---------------|
| type | Requerido, enum válido | "Tipo de transacción requerido" |
| date | Requerido, no futura > 1 año | "Fecha inválida" |
| amount | > 0, máx 15 dígitos | "Monto debe ser mayor a 0" |
| description | 3-500 caracteres | "Descripción: 3-500 caracteres" |
| account_id | Requerido (income/expense) | "Cuenta requerida" |
| category_id | Requerido (income/expense) | "Categoría requerida" |
| source_account_id | Requerido (transfer) | "Cuenta origen requerida" |
| destination_account_id | Requerido (transfer), ≠ source | "Cuenta destino inválida" |
| document_number | Único por empresa (opcional) | "Documento ya existe" |

### 7.2 Validaciones de Estado

```typescript
// Transiciones válidas de estado
const validTransitions: Record<Status, Status[]> = {
  draft: ['pending', 'deleted'],
  pending: ['approved', 'rejected'],
  approved: ['posted', 'draft'],
  posted: ['reversed'], // Reversal crea transacción contraria
  rejected: ['draft', 'pending'],
};

// Período cerrado
if (periodStatus === 'closed') {
  throw new Error('Período cerrado: no se pueden modificar transacciones');
}

// Monto máximo por transacción (configurable)
const MAX_TRANSACTION_AMOUNT = 999999999999.99;
```

### 7.3 Validaciones de Permisos

```typescript
// Middleware de permisos
const canCreateTransaction = (userRole: Role, type: TransactionType) => {
  if (userRole === 'vendedor' && type !== 'income') return false;
  return true;
};

const canEditTransaction = (user: User, transaction: Transaction) => {
  if (transaction.status !== 'draft') return false;
  if (['superadmin', 'admin_finanzas'].includes(user.role)) return true;
  return transaction.createdBy === user.id;
};

const canApproveTransaction = (userRole: Role) => {
  return ['superadmin', 'admin_finanzas'].includes(userRole);
};
```

---

## 8. Casos de Error a Manejar

### 8.1 Errores de Sistema

| Código | Escenario | Mensaje Usuario | Acción |
|--------|-----------|-----------------|--------|
| `PERIOD_CLOSED` | Intentar crear/editar en período cerrado | "El período está cerrado. Contacte al administrador." | Bloquear, mostrar alerta |
| `INSUFFICIENT_FUNDS` | Transferencia sin fondos suficientes | "Fondos insuficientes en cuenta origen" | Validar antes de guardar |
| `DUPLICATE_DOC` | Número de documento duplicado | "Este número de documento ya existe" | Validar en blur |
| `INVALID_TRANSITION` | Cambio de estado inválido | "No se puede cambiar el estado de esta transacción" | Deshabilitar botón |
| `UNAUTHORIZED` | Usuario sin permisos | "No tiene permisos para esta acción" | Ocultar acción |

### 8.2 Errores de Red/Backend

| Escenario | Mensaje | Retry |
|-----------|---------|-------|
| Timeout Supabase | "Error de conexión. Reintentando..." | Sí, 3 veces |
| 500 Server Error | "Error del servidor. Intente más tarde." | No |
| RLS Violation | "Acceso no autorizado" | No (logout) |
| Validation Error | Mostrar errores específicos por campo | No |

### 8.3 Manejo en UI

```typescript
// Toast notifications con sonner
import { toast } from 'sonner';

// Éxito
toast.success('Transacción creada exitosamente');
toast.success('Transacción aprobada');

// Error
toast.error('Error: Período cerrado');
toast.error('No tiene permisos para aprobar');

// Confirmación
const confirmDelete = () => {
  toast.promise(deleteTransaction(id), {
    loading: 'Eliminando...',
    success: 'Transacción eliminada',
    error: 'Error al eliminar'
  });
};
```

---

## 9. Requerimientos No Funcionales

### 9.1 Performance

- Paginación: 50 registros por página
- Búsqueda: debounce 300ms
- Carga inicial: < 2 segundos
- Filtros: aplicar client-side si < 500 registros

### 9.2 UX/UI

- Tema ClickUp: Primary #7B68EE (violeta)
- Tabla con ordenamiento por columna
- Filtros persistentes en URL (query params)
- Atajos de teclado:
  - `Ctrl+N`: Nueva transacción
  - `Ctrl+F`: Buscar
  - `Esc`: Cerrar modal
- Responsive: Tabla scrollable horizontal en móvil

### 9.3 Accesibilidad

- ARIA labels en todos los botones de acción
- Focus trap en modales
- Contraste mínimo 4.5:1
- Navegación por teclado completa

---

## 10. Pendientes / Futuras Versiones

- [ ] Importador Excel (V2)
- [ ] Etiquetas/tags personalizadas
- [ ] Conciliación bancaria automática
- [ ] Reportes PDF/Excel
- [ ] APIs para integraciones
- [ ] Notificaciones email de aprobaciones
- [ ] App móvil (React Native)

---

**Notas de Implementación:**
- La tabla transactions YA EXISTE en la base de datos (ver migración 20260416105000_create_tables.sql)
- Esta especificación REQUIERE migración para extender la tabla con nuevos campos
- Los triggers de soft delete y audit log YA ESTÁN configurados
- El trigger de período cerrado YA EXISTE pero debe validarse con nuevos estados
