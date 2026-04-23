-- ============================================================================
-- MIGRACIÓN: Cambiar método 'nequi' a 'digital' (neutral AR/CO)
-- Fecha: 2026-04-23
-- ============================================================================

-- 1. Actualizar constraint CHECK
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_method_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_method_check
  CHECK (method IN ('cash', 'transfer', 'card', 'digital', 'other'));

-- 2. Actualizar datos existentes (si hay 'nequi', cambiar a 'digital')
UPDATE transactions SET method = 'digital' WHERE method = 'nequi';

-- 3. Actualizar la función RPC
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
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT status INTO v_period_status
  FROM periods
  WHERE company_id = p_company_id
    AND year = EXTRACT(YEAR FROM p_date)
    AND month = EXTRACT(MONTH FROM p_date);
    
  IF v_period_status = 'closed' THEN
    RAISE EXCEPTION 'PERIOD_CLOSED: El período está cerrado. No se pueden crear transacciones.';
  END IF;

  IF p_type = 'transfer' THEN
    IF p_source_account_id IS NULL OR p_destination_account_id IS NULL THEN
      RAISE EXCEPTION 'MISSING_ACCOUNTS: Las transferencias requieren cuenta origen y destino';
    END IF;
    IF p_source_account_id = p_destination_account_id THEN
      RAISE EXCEPTION 'SAME_ACCOUNT: La cuenta origen y destino deben ser diferentes';
    END IF;
  ELSIF p_type IN ('income', 'expense') THEN
    IF p_category_id IS NULL THEN
      RAISE EXCEPTION 'MISSING_CATEGORY: Los ingresos y egresos requieren categoría';
    END IF;
  ELSIF p_type = 'adjustment' THEN
    IF p_adjustment_reason IS NULL THEN
      RAISE EXCEPTION 'MISSING_REASON: Los ajustes requieren motivo';
    END IF;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: El monto debe ser mayor a 0';
  END IF;

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

COMMENT ON COLUMN transactions.method IS 'Método de pago: cash (efectivo), transfer (transferencia), card (tarjeta), digital (billetera digital), other (otro)';
COMMENT ON FUNCTION create_transaction IS 'Crea una nueva transacción con estado DRAFT. Valida período cerrado y campos requeridos según el tipo. Método de pago: cash, transfer, card, digital, other.';
