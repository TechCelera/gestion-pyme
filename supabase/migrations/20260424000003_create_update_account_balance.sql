-- ============================================================================
-- MIGRACIÓN: Create update_account_balance function
-- Fecha: 2026-04-24
-- Descripción: Función que recalcula el balance de las cuentas basándose
--   en las transacciones contabilizadas (status = 'posted', deleted_at IS NULL)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_account_balance(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recalcular balance de todas las cuentas de la empresa
  -- Income suma al balance, Expense resta del balance
  UPDATE accounts a
  SET balance = COALESCE((
    SELECT
      SUM(
        CASE
          WHEN t.type = 'income' THEN t.amount
          WHEN t.type = 'expense' THEN -t.amount
          WHEN t.type = 'adjustment' THEN t.amount  -- Ajustes pueden ser positivos o negativos
          ELSE 0
        END
      )
    FROM transactions t
    WHERE t.account_id = a.id
      AND t.company_id = p_company_id
      AND t.status = 'posted'
      AND t.deleted_at IS NULL
  ), 0),
  updated_at = NOW()
  WHERE a.company_id = p_company_id
    AND a.deleted_at IS NULL;
END;
$$;

COMMENT ON FUNCTION update_account_balance IS 'Recalcula el balance de las cuentas de una empresa basándose en transacciones contabilizadas (posted). Income suma, Expense resta.';