-- ============================================================================
-- MIGRACIÓN: Extensión de tabla transactions para CRUD completo
-- ID: TX-001 a TX-004
-- Fecha: 2025-04-21
-- Autor: Sistema Gestion PYME Pro
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TX-001: Extender tabla transactions con nuevos campos
-- ----------------------------------------------------------------------------

-- Agregar campos de estado y tipo extendido
ALTER TABLE IF EXISTS transactions
  -- Estado de aprobación (nuevo flujo de trabajo)
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'pending', 'approved', 'posted', 'rejected')),
  
  -- Tipo extendido de transacción
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'income'
    CHECK (type IN ('income', 'expense', 'transfer', 'adjustment')),
  
  -- Método contable
  ADD COLUMN IF NOT EXISTS method VARCHAR(10) NOT NULL DEFAULT 'cash'
    CHECK (method IN ('accrual', 'cash')),
  
  -- Campos de moneda
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,6) DEFAULT 1.000000;

-- Agregar campos específicos por tipo de transacción
ALTER TABLE IF EXISTS transactions
  -- Para income/expense: contacto (cliente o proveedor)
  ADD COLUMN IF NOT EXISTS contact_id UUID,
  ADD COLUMN IF NOT EXISTS contact_type VARCHAR(20) 
    CHECK (contact_type IN ('cliente', 'proveedor')),
  
  -- Para transferencias: cuentas origen y destino
  ADD COLUMN IF NOT EXISTS source_account_id UUID,
  ADD COLUMN IF NOT EXISTS destination_account_id UUID,
  
  -- Para ajustes: motivo del ajuste
  ADD COLUMN IF NOT EXISTS adjustment_reason VARCHAR(50)
    CHECK (adjustment_reason IN ('reconciliation', 'correction', 'other'));

-- Agregar campos de documento adjunto
ALTER TABLE IF EXISTS transactions
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(20)
    CHECK (document_type IN ('invoice', 'receipt', 'ticket', 'other')),
  ADD COLUMN IF NOT EXISTS document_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Agregar metadatos de aprobación y seguimiento
ALTER TABLE IF EXISTS transactions
  -- Quién y cuándo aprobó
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  
  -- Quién y cuándo contabilizó (posted)
  ADD COLUMN IF NOT EXISTS posted_by UUID,
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
  
  -- Quién y cuándo rechazó
  ADD COLUMN IF NOT EXISTS rejected_by UUID,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(255),
  
  -- Quién actualizó por última vez
  ADD COLUMN IF NOT EXISTS updated_by UUID,
  
  -- Soft delete
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN transactions.status IS 'Estado del flujo de aprobación: draft, pending, approved, posted, rejected';
COMMENT ON COLUMN transactions.type IS 'Tipo de transacción: income, expense, transfer, adjustment';
COMMENT ON COLUMN transactions.method IS 'Método contable: accrual (devengado) o cash (efectivo)';
COMMENT ON COLUMN transactions.currency IS 'Código ISO de moneda (USD, EUR, COP, etc.)';
COMMENT ON COLUMN transactions.exchange_rate IS 'Tasa de cambio respecto a la moneda base';
COMMENT ON COLUMN transactions.contact_id IS 'ID del contacto (cliente o proveedor) para income/expense';
COMMENT ON COLUMN transactions.contact_type IS 'Tipo de contacto: cliente o proveedor';
COMMENT ON COLUMN transactions.source_account_id IS 'Cuenta origen para transferencias';
COMMENT ON COLUMN transactions.destination_account_id IS 'Cuenta destino para transferencias';
COMMENT ON COLUMN transactions.adjustment_reason IS 'Motivo del ajuste: reconciliation, correction, other';
COMMENT ON COLUMN transactions.document_type IS 'Tipo de documento: invoice, receipt, ticket, other';
COMMENT ON COLUMN transactions.document_number IS 'Número de factura, recibo o documento';
COMMENT ON COLUMN transactions.attachment_url IS 'URL del archivo adjunto en storage';
COMMENT ON COLUMN transactions.approved_by IS 'Usuario que aprobó la transacción';
COMMENT ON COLUMN transactions.approved_at IS 'Fecha y hora de aprobación';
COMMENT ON COLUMN transactions.posted_by IS 'Usuario que contabilizó la transacción';
COMMENT ON COLUMN transactions.posted_at IS 'Fecha y hora de contabilización';
COMMENT ON COLUMN transactions.rejected_by IS 'Usuario que rechazó la transacción';
COMMENT ON COLUMN transactions.rejected_at IS 'Fecha y hora de rechazo';
COMMENT ON COLUMN transactions.rejection_reason IS 'Motivo del rechazo';
COMMENT ON COLUMN transactions.updated_by IS 'Usuario que realizó la última actualización';
COMMENT ON COLUMN transactions.deleted_at IS 'Fecha de eliminación lógica (soft delete)';
COMMENT ON COLUMN transactions.deleted_by IS 'Usuario que eliminó la transacción';

-- Crear índices para mejorar performance de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_company_status ON transactions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_company_date ON transactions(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_contact ON transactions(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_document ON transactions(document_number) WHERE document_number IS NOT NULL;

-- ----------------------------------------------------------------------------
-- TX-002: Función RPC create_transaction()
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_transaction(
  p_company_id UUID,
  p_account_id UUID,
  p_type VARCHAR,
  p_amount NUMERIC,
  p_date DATE,
  p_description VARCHAR,
  p_category_id UUID DEFAULT NULL,
  p_method VARCHAR DEFAULT 'cash',
  p_currency VARCHAR DEFAULT 'USD',
  p_exchange_rate NUMERIC DEFAULT 1.000000,
  p_contact_id UUID DEFAULT NULL,
  p_contact_type VARCHAR DEFAULT NULL,
  p_source_account_id UUID DEFAULT NULL,
  p_destination_account_id UUID DEFAULT NULL,
  p_adjustment_reason VARCHAR DEFAULT NULL,
  p_document_type VARCHAR DEFAULT NULL,
  p_document_number VARCHAR DEFAULT NULL,
  p_attachment_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_period_status VARCHAR;
  v_user_id UUID;
BEGIN
  -- Obtener el ID del usuario autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Validar que el período no esté cerrado
  SELECT status INTO v_period_status
  FROM periods
  WHERE company_id = p_company_id
    AND year = EXTRACT(YEAR FROM p_date)
    AND month = EXTRACT(MONTH FROM p_date);
    
  IF v_period_status = 'closed' THEN
    RAISE EXCEPTION 'PERIOD_CLOSED: El período está cerrado. No se pueden crear transacciones.';
  END IF;

  -- Validar tipo de transacción y campos requeridos
  IF p_type = 'transfer' THEN
    -- Las transferencias requieren cuenta origen y destino
    IF p_source_account_id IS NULL OR p_destination_account_id IS NULL THEN
      RAISE EXCEPTION 'MISSING_ACCOUNTS: Las transferencias requieren cuenta origen y destino';
    END IF;
    -- La cuenta origen y destino deben ser diferentes
    IF p_source_account_id = p_destination_account_id THEN
      RAISE EXCEPTION 'SAME_ACCOUNT: La cuenta origen y destino deben ser diferentes';
    END IF;
  ELSIF p_type IN ('income', 'expense') THEN
    -- Los ingresos y egresos requieren categoría
    IF p_category_id IS NULL THEN
      RAISE EXCEPTION 'MISSING_CATEGORY: Los ingresos y egresos requieren categoría';
    END IF;
  ELSIF p_type = 'adjustment' THEN
    -- Los ajustes requieren motivo
    IF p_adjustment_reason IS NULL THEN
      RAISE EXCEPTION 'MISSING_REASON: Los ajustes requieren motivo';
    END IF;
  END IF;

  -- Validar que el monto sea positivo
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: El monto debe ser mayor a 0';
  END IF;

  -- Insertar la transacción con estado 'draft'
  INSERT INTO transactions (
    company_id,
    account_id,
    category_id,
    type,
    method,
    status,
    amount,
    currency,
    exchange_rate,
    date,
    description,
    contact_id,
    contact_type,
    source_account_id,
    destination_account_id,
    adjustment_reason,
    document_type,
    document_number,
    attachment_url,
    created_by,
    updated_by
  ) VALUES (
    p_company_id,
    p_account_id,
    p_category_id,
    p_type,
    p_method,
    'draft',
    p_amount,
    p_currency,
    p_exchange_rate,
    p_date,
    p_description,
    p_contact_id,
    p_contact_type,
    p_source_account_id,
    p_destination_account_id,
    p_adjustment_reason,
    p_document_type,
    p_document_number,
    p_attachment_url,
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION create_transaction IS 'Crea una nueva transacción con estado DRAFT. Valida período cerrado y campos requeridos según el tipo.';

-- ----------------------------------------------------------------------------
-- TX-003: Función RPC update_transaction_status()
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_transaction_status(
  p_transaction_id UUID,
  p_new_status VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_reason VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status VARCHAR;
  v_company_id UUID;
  v_transaction_date DATE;
  v_period_status VARCHAR;
  v_effective_user_id UUID;
BEGIN
  -- Usar el user_id proporcionado o el usuario autenticado
  v_effective_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_effective_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener información de la transacción
  SELECT 
    status, 
    company_id,
    date
  INTO 
    v_current_status, 
    v_company_id,
    v_transaction_date
  FROM transactions 
  WHERE id = p_transaction_id;

  -- Verificar que la transacción existe
  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND: Transacción no encontrada';
  END IF;

  -- No permitir modificar transacciones eliminadas
  IF EXISTS (
    SELECT 1 FROM transactions 
    WHERE id = p_transaction_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'TRANSACTION_DELETED: No se puede modificar una transacción eliminada';
  END IF;

  -- Validar que las transacciones POSTED no puedan modificarse
  IF v_current_status = 'posted' THEN
    RAISE EXCEPTION 'POSTED_IMMUTABLE: Las transacciones contabilizadas no pueden modificarse';
  END IF;

  -- Validar transiciones de estado válidas
  CASE v_current_status
    WHEN 'draft' THEN
      IF NOT (p_new_status IN ('pending', 'deleted')) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde DRAFT solo se puede ir a PENDING o DELETED';
      END IF;
    
    WHEN 'pending' THEN
      IF NOT (p_new_status IN ('approved', 'rejected')) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde PENDING solo se puede ir a APPROVED o REJECTED';
      END IF;
    
    WHEN 'approved' THEN
      IF NOT (p_new_status IN ('posted', 'draft')) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde APPROVED solo se puede ir a POSTED o volver a DRAFT';
      END IF;
    
    WHEN 'rejected' THEN
      IF NOT (p_new_status IN ('draft', 'pending')) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde REJECTED solo se puede ir a DRAFT o PENDING';
      END IF;
    
    ELSE
      RAISE EXCEPTION 'INVALID_STATUS: Estado actual no válido';
  END CASE;

  -- Si se va a postear (posted), validar que el período no esté cerrado
  IF p_new_status = 'posted' THEN
    SELECT status INTO v_period_status
    FROM periods
    WHERE company_id = v_company_id
      AND year = EXTRACT(YEAR FROM v_transaction_date)
      AND month = EXTRACT(MONTH FROM v_transaction_date);
      
    IF v_period_status = 'closed' THEN
      RAISE EXCEPTION 'PERIOD_CLOSED: No se puede contabilizar en un período cerrado';
    END IF;
  END IF;

  -- Actualizar según el nuevo estado
  CASE p_new_status
    WHEN 'approved' THEN
      UPDATE transactions 
      SET 
        status = p_new_status, 
        approved_by = v_effective_user_id, 
        approved_at = NOW(), 
        updated_at = NOW(),
        updated_by = v_effective_user_id
      WHERE id = p_transaction_id;
    
    WHEN 'posted' THEN
      UPDATE transactions 
      SET 
        status = p_new_status, 
        posted_by = v_effective_user_id, 
        posted_at = NOW(), 
        updated_at = NOW(),
        updated_by = v_effective_user_id
      WHERE id = p_transaction_id;
      
      -- Actualizar el balance de la cuenta (llamar a función existente)
      PERFORM update_account_balance(v_company_id);
    
    WHEN 'rejected' THEN
      -- Validar que se proporcione un motivo para el rechazo
      IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
        RAISE EXCEPTION 'MISSING_REASON: Debe proporcionar un motivo para el rechazo';
      END IF;
      
      UPDATE transactions 
      SET 
        status = p_new_status, 
        rejected_by = v_effective_user_id, 
        rejected_at = NOW(), 
        rejection_reason = p_reason,
        updated_at = NOW(),
        updated_by = v_effective_user_id
      WHERE id = p_transaction_id;
    
    WHEN 'deleted' THEN
      -- Soft delete: marcar como eliminada
      UPDATE transactions 
      SET 
        status = p_new_status,
        deleted_at = NOW(),
        deleted_by = v_effective_user_id,
        updated_at = NOW(),
        updated_by = v_effective_user_id
      WHERE id = p_transaction_id;
    
    ELSE
      -- Para cualquier otro estado (draft, pending)
      UPDATE transactions 
      SET 
        status = p_new_status, 
        updated_at = NOW(),
        updated_by = v_effective_user_id
      WHERE id = p_transaction_id;
  END CASE;

  RETURN TRUE;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION update_transaction_status IS 'Actualiza el estado de una transacción con validación de máquina de estados. Registra metadatos según el nuevo estado.';

-- ----------------------------------------------------------------------------
-- TX-004: Función RPC get_transactions()
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_transactions(
  p_company_id UUID,
  p_status VARCHAR[] DEFAULT NULL,
  p_type VARCHAR[] DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL,
  p_search VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  account_id UUID,
  account_name VARCHAR,
  category_id UUID,
  category_name VARCHAR,
  type VARCHAR,
  status VARCHAR,
  method VARCHAR,
  amount NUMERIC,
  currency VARCHAR,
  exchange_rate NUMERIC,
  date DATE,
  description VARCHAR,
  contact_id UUID,
  contact_type VARCHAR,
  contact_name VARCHAR,
  source_account_id UUID,
  source_account_name VARCHAR,
  destination_account_id UUID,
  destination_account_name VARCHAR,
  adjustment_reason VARCHAR,
  document_type VARCHAR,
  document_number VARCHAR,
  attachment_url TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  creator_name VARCHAR,
  updated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  posted_by UUID,
  posted_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason VARCHAR,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH filtered_transactions AS (
    SELECT 
      t.*,
      -- Contar total de registros para paginación
      COUNT(*) OVER() as total_count
    FROM transactions t
    WHERE t.company_id = p_company_id
      AND t.deleted_at IS NULL  -- Excluir eliminadas
      AND (p_status IS NULL OR t.status = ANY(p_status))
      AND (p_type IS NULL OR t.type = ANY(p_type))
      AND (p_date_from IS NULL OR t.date >= p_date_from)
      AND (p_date_to IS NULL OR t.date <= p_date_to)
      AND (p_account_id IS NULL OR t.account_id = p_account_id)
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
      AND (p_contact_id IS NULL OR t.contact_id = p_contact_id)
      AND (p_search IS NULL OR 
           t.description ILIKE '%' || p_search || '%' OR
           COALESCE(t.document_number, '') ILIKE '%' || p_search || '%')
  )
  SELECT 
    ft.id,
    ft.company_id,
    ft.account_id,
    a.name as account_name,
    ft.category_id,
    c.name as category_name,
    ft.type,
    ft.status,
    ft.method,
    ft.amount,
    ft.currency,
    ft.exchange_rate,
    ft.date,
    ft.description,
    ft.contact_id,
    ft.contact_type,
    NULL::varchar as contact_name, -- TODO: Implementar cuando existan tablas clients/providers
    ft.source_account_id,
    sa.name as source_account_name,
    ft.destination_account_id,
    da.name as destination_account_name,
    ft.adjustment_reason,
    ft.document_type,
    ft.document_number,
    ft.attachment_url,
    ft.created_at,
    ft.created_by,
    u.full_name as creator_name,
    ft.updated_at,
    ft.approved_by,
    ft.approved_at,
    ft.posted_by,
    ft.posted_at,
    ft.rejected_by,
    ft.rejected_at,
    ft.rejection_reason,
    ft.total_count
  FROM filtered_transactions ft
  -- JOIN con accounts para obtener nombre de cuenta
  LEFT JOIN accounts a ON ft.account_id = a.id
  -- JOIN con categories para obtener nombre de categoría
  LEFT JOIN categories c ON ft.category_id = c.id
  -- JOIN con accounts para cuenta origen (transferencias)
  LEFT JOIN accounts sa ON ft.source_account_id = sa.id
  -- JOIN con accounts para cuenta destino (transferencias)
  LEFT JOIN accounts da ON ft.destination_account_id = da.id
  -- JOIN con users para obtener nombre del creador
  LEFT JOIN users u ON ft.created_by = u.id
  ORDER BY ft.date DESC, ft.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

-- Comentario de la función
COMMENT ON FUNCTION get_transactions IS 'Obtiene transacciones filtradas con paginación. Incluye JOINs para traer nombres relacionados.';

-- ----------------------------------------------------------------------------
-- Función auxiliar: get_transaction_by_id
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_transaction_by_id(
  p_transaction_id UUID
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  account_id UUID,
  account_name VARCHAR,
  category_id UUID,
  category_name VARCHAR,
  type VARCHAR,
  status VARCHAR,
  method VARCHAR,
  amount NUMERIC,
  currency VARCHAR,
  exchange_rate NUMERIC,
  date DATE,
  description VARCHAR,
  contact_id UUID,
  contact_type VARCHAR,
  contact_name VARCHAR,
  source_account_id UUID,
  source_account_name VARCHAR,
  destination_account_id UUID,
  destination_account_name VARCHAR,
  adjustment_reason VARCHAR,
  document_type VARCHAR,
  document_number VARCHAR,
  attachment_url TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  creator_name VARCHAR,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  approved_by UUID,
  approver_name VARCHAR,
  approved_at TIMESTAMPTZ,
  posted_by UUID,
  poster_name VARCHAR,
  posted_at TIMESTAMPTZ,
  rejected_by UUID,
  rejecter_name VARCHAR,
  rejected_at TIMESTAMPTZ,
  rejection_reason VARCHAR
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    t.id,
    t.company_id,
    t.account_id,
    a.name as account_name,
    t.category_id,
    c.name as category_name,
    t.type,
    t.status,
    t.method,
    t.amount,
    t.currency,
    t.exchange_rate,
    t.date,
    t.description,
    t.contact_id,
    t.contact_type,
    NULL::varchar as contact_name, -- TODO: Implementar cuando existan tablas clients/providers
    t.source_account_id,
    sa.name as source_account_name,
    t.destination_account_id,
    da.name as destination_account_name,
    t.adjustment_reason,
    t.document_type,
    t.document_number,
    t.attachment_url,
    t.created_at,
    t.created_by,
    uc.full_name as creator_name,
    t.updated_at,
    t.updated_by,
    t.approved_by,
    ua.full_name as approver_name,
    t.approved_at,
    t.posted_by,
    up.full_name as poster_name,
    t.posted_at,
    t.rejected_by,
    ur.full_name as rejecter_name,
    t.rejected_at,
    t.rejection_reason
  FROM transactions t
  LEFT JOIN accounts a ON t.account_id = a.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN accounts sa ON t.source_account_id = sa.id
  LEFT JOIN accounts da ON t.destination_account_id = da.id
  LEFT JOIN users uc ON t.created_by = uc.id
  LEFT JOIN users ua ON t.approved_by = ua.id
  LEFT JOIN users up ON t.posted_by = up.id
  LEFT JOIN users ur ON t.rejected_by = ur.id
  WHERE t.id = p_transaction_id
    AND t.deleted_at IS NULL;
$$;

COMMENT ON FUNCTION get_transaction_by_id IS 'Obtiene una transacción específica por ID con todos los datos relacionados.';

-- ----------------------------------------------------------------------------
-- Función auxiliar: soft_delete_transaction
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION soft_delete_transaction(
  p_transaction_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status VARCHAR;
  v_effective_user_id UUID;
BEGIN
  v_effective_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_effective_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  -- Obtener estado actual
  SELECT status INTO v_current_status
  FROM transactions 
  WHERE id = p_transaction_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND: Transacción no encontrada';
  END IF;

  -- Solo se pueden eliminar transacciones en estado DRAFT
  IF v_current_status != 'draft' THEN
    RAISE EXCEPTION 'INVALID_STATUS: Solo se pueden eliminar transacciones en estado borrador';
  END IF;

  -- Realizar soft delete
  UPDATE transactions 
  SET 
    deleted_at = NOW(),
    deleted_by = v_effective_user_id,
    updated_at = NOW(),
    updated_by = v_effective_user_id
  WHERE id = p_transaction_id;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION soft_delete_transaction IS 'Elimina una transacción de forma lógica (soft delete). Solo permite eliminar transacciones en estado DRAFT.';
