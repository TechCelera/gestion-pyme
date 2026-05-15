-- ============================================================================
-- Alineación flujo: un solo estado contable "approved" (genera diario al aprobar).
-- Elimina paso "posted". Añade "cancelled" con reversión de asiento.
-- ============================================================================

-- 1) Columnas de cancelación
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(500),
  ADD COLUMN IF NOT EXISTS cancelled_by UUID,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

COMMENT ON COLUMN transactions.cancellation_reason IS 'Motivo de cancelación total (admin).';

-- 2) Migrar posted → approved (preservar auditoría de aprobación)
UPDATE transactions
SET
  status = 'approved',
  approved_at = COALESCE(approved_at, posted_at),
  approved_by = COALESCE(approved_by, posted_by)
WHERE status = 'posted';

-- 3) Quitar CHECK antiguo y aplicar nuevos estados
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled'));

COMMENT ON COLUMN transactions.status IS 'Flujo: draft, pending, approved (con diario), rejected, cancelled (anulado, sin diario).';

-- 4) Trigger componentes: inmutabilidad cuando ya hay asiento (approved con journal)
CREATE OR REPLACE FUNCTION trg_protect_operation_components()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_status VARCHAR;
  v_tid UUID;
BEGIN
  v_tid := COALESCE(NEW.transaction_id, OLD.transaction_id);

  SELECT t.status INTO v_status
  FROM transactions t WHERE t.id = v_tid FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  IF v_status IN ('draft', 'pending') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  RAISE EXCEPTION 'OPERATION_COMPONENTS_IMMUTABLE_FOR_STATUS';
END;
$$;

-- 5) Balance desde diario — solo transacciones aprobadas (no canceladas)
CREATE OR REPLACE FUNCTION update_account_balance(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE accounts a
  SET
    balance = COALESCE(agg.bal, 0),
    updated_at = NOW()
  FROM (
    SELECT
      a2.id AS account_key,
      ROUND(COALESCE(SUM(l.debit - l.credit), 0)::numeric, 2) AS bal
    FROM accounts a2
    LEFT JOIN journal_entry_lines l ON l.operative_account_id = a2.id
    LEFT JOIN journal_entries je ON je.id = l.journal_entry_id AND je.company_id = p_company_id
    LEFT JOIN transactions t ON t.id = je.transaction_id
      AND t.company_id = p_company_id
      AND t.status = 'approved'
      AND t.deleted_at IS NULL
    WHERE a2.company_id = p_company_id
      AND a2.deleted_at IS NULL
    GROUP BY a2.id
  ) agg
  WHERE a.id = agg.account_key
    AND a.company_id = p_company_id;
END;
$$;

COMMENT ON FUNCTION update_account_balance(UUID) IS 'Recalcula balance operativo desde diario (solo transacciones approved con líneas).';

-- 6) Reportes RPC: posted → approved
CREATE OR REPLACE FUNCTION rpc_reports_income_statement_period(
  p_company_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_income NUMERIC;
  v_total_expenses NUMERIC;
  v_breakdown JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COALESCE(SUM(jel.credit - jel.debit), 0) INTO v_total_income
  FROM journal_entry_lines jel
  INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
  INNER JOIN transactions t ON t.id = je.transaction_id
  INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
  WHERE je.company_id = p_company_id
    AND t.company_id = p_company_id
    AND t.status = 'approved'
    AND t.deleted_at IS NULL
    AND je.entry_date >= p_from
    AND je.entry_date <= p_to
    AND coa.account_type = 'income';

  SELECT COALESCE(SUM(jel.debit - jel.credit), 0) INTO v_total_expenses
  FROM journal_entry_lines jel
  INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
  INNER JOIN transactions t ON t.id = je.transaction_id
  INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
  WHERE je.company_id = p_company_id
    AND t.company_id = p_company_id
    AND t.status = 'approved'
    AND t.deleted_at IS NULL
    AND je.entry_date >= p_from
    AND je.entry_date <= p_to
    AND coa.account_type = 'expense';

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('category', cat, 'amount', amt) ORDER BY amt DESC),
    '[]'::jsonb
  ) INTO v_breakdown
  FROM (
    SELECT coa.name AS cat, SUM(jel.debit - jel.credit) AS amt
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
    INNER JOIN transactions t ON t.id = je.transaction_id
    INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
    WHERE je.company_id = p_company_id
      AND t.company_id = p_company_id
      AND t.status = 'approved'
      AND t.deleted_at IS NULL
      AND je.entry_date >= p_from
      AND je.entry_date <= p_to
      AND coa.account_type = 'expense'
    GROUP BY coa.name
    ORDER BY amt DESC
    LIMIT 8
  ) sub;

  RETURN jsonb_build_object(
    'totalIncome', ROUND(v_total_income::numeric, 2),
    'totalExpenses', ROUND(v_total_expenses::numeric, 2),
    'expenseBreakdown', v_breakdown
  );
END;
$$;

COMMENT ON FUNCTION rpc_reports_income_statement_period(UUID, DATE, DATE) IS
  'Estado de resultados del período desde diario (operaciones approved).';

CREATE OR REPLACE FUNCTION rpc_reports_cash_flow_real_monthly(
  p_company_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_out JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'month', to_char(m, 'YYYY-MM'),
        'inflow', ROUND(inf::numeric, 2),
        'outflow', ROUND(outf::numeric, 2),
        'net', ROUND((inf - outf)::numeric, 2)
      )
      ORDER BY m
    ),
    '[]'::jsonb
  ) INTO v_out
  FROM (
    SELECT
      date_trunc('month', je.entry_date) AS m,
      SUM(jel.debit) AS inf,
      SUM(jel.credit) AS outf
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
    INNER JOIN transactions t ON t.id = je.transaction_id
    INNER JOIN accounts a ON a.id = jel.operative_account_id
    WHERE je.company_id = p_company_id
      AND t.company_id = p_company_id
      AND t.status = 'approved'
      AND t.deleted_at IS NULL
      AND jel.operative_account_id IS NOT NULL
      AND a.company_id = p_company_id
      AND a.type IN ('cash', 'bank')
      AND a.deleted_at IS NULL
      AND je.entry_date >= p_from
      AND je.entry_date <= p_to
    GROUP BY date_trunc('month', je.entry_date)
  ) sub;

  RETURN v_out;
END;
$$;

CREATE OR REPLACE FUNCTION rpc_reports_balance_sheet(
  p_company_id UUID,
  p_as_of DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assets NUMERIC;
  v_liabilities NUMERIC;
  v_equity NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COALESCE(SUM(jel.debit - jel.credit), 0) INTO v_assets
  FROM journal_entry_lines jel
  INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
  INNER JOIN transactions t ON t.id = je.transaction_id
  INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
  WHERE je.company_id = p_company_id
    AND t.company_id = p_company_id
    AND t.status = 'approved'
    AND t.deleted_at IS NULL
    AND je.entry_date <= p_as_of
    AND coa.account_type = 'asset';

  SELECT COALESCE(SUM(jel.credit - jel.debit), 0) INTO v_liabilities
  FROM journal_entry_lines jel
  INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
  INNER JOIN transactions t ON t.id = je.transaction_id
  INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
  WHERE je.company_id = p_company_id
    AND t.company_id = p_company_id
    AND t.status = 'approved'
    AND t.deleted_at IS NULL
    AND je.entry_date <= p_as_of
    AND coa.account_type = 'liability';

  SELECT COALESCE(SUM(jel.credit - jel.debit), 0) INTO v_equity
  FROM journal_entry_lines jel
  INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
  INNER JOIN transactions t ON t.id = je.transaction_id
  INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
  WHERE je.company_id = p_company_id
    AND t.company_id = p_company_id
    AND t.status = 'approved'
    AND t.deleted_at IS NULL
    AND je.entry_date <= p_as_of
    AND coa.account_type = 'equity';

  RETURN jsonb_build_object(
    'totalAssets', ROUND(v_assets::numeric, 2),
    'totalLiabilities', ROUND(v_liabilities::numeric, 2),
    'totalEquity', ROUND(v_equity::numeric, 2),
    'asOf', p_as_of
  );
END;
$$;

COMMENT ON FUNCTION rpc_reports_balance_sheet(UUID, DATE) IS
  'Balance patrimonial acumulado hasta fecha de corte (approved).';

-- 7) Máquina de estados
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
  v_transaction_type VARCHAR;
  v_transaction_amount NUMERIC;
  v_cmp_cnt INT;
  v_cmp_sum NUMERIC;
  v_req_budget BOOLEAN;
  v_budget_by UUID;
BEGIN
  v_effective_user_id := COALESCE(p_user_id, auth.uid());

  IF v_effective_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT status, company_id, date, type, amount
  INTO v_current_status, v_company_id, v_transaction_date, v_transaction_type, v_transaction_amount
  FROM transactions
  WHERE id = p_transaction_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND: Transacción no encontrada';
  END IF;

  IF EXISTS (
    SELECT 1 FROM transactions
    WHERE id = p_transaction_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'TRANSACTION_DELETED: No se puede modificar una transacción eliminada';
  END IF;

  IF v_current_status = 'cancelled' THEN
    RAISE EXCEPTION 'CANCELLED_IMMUTABLE: La operación está cancelada';
  END IF;

  IF v_current_status = 'approved' THEN
    IF EXISTS (SELECT 1 FROM journal_entries WHERE transaction_id = p_transaction_id LIMIT 1) THEN
      IF p_new_status <> 'cancelled' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde APPROVED con asiento solo se puede cancelar';
      END IF;
    ELSE
      IF p_new_status NOT IN ('cancelled', 'pending', 'draft') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Aprobación sin asiento: transiciones limitadas';
      END IF;
    END IF;
  ELSIF v_current_status = 'draft' THEN
    IF NOT (p_new_status IN ('pending')) THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Desde DRAFT solo se puede ir a PENDING';
    END IF;
  ELSIF v_current_status = 'pending' THEN
    IF NOT (p_new_status IN ('approved', 'rejected')) THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Desde PENDING solo se puede ir a APPROVED o REJECTED';
    END IF;
  ELSIF v_current_status = 'rejected' THEN
    IF NOT (p_new_status IN ('draft', 'pending')) THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Desde REJECTED solo se puede ir a DRAFT o PENDING';
    END IF;
  ELSE
    RAISE EXCEPTION 'INVALID_STATUS: Estado actual no válido';
  END IF;

  IF p_new_status = 'pending'
     AND v_current_status = 'draft'
     AND v_transaction_type IN ('income', 'expense') THEN

    SELECT COUNT(*)::INT, COALESCE(SUM(amount), 0)
      INTO v_cmp_cnt, v_cmp_sum
    FROM operation_components
    WHERE transaction_id = p_transaction_id;

    IF v_cmp_cnt = 0 THEN
      RAISE EXCEPTION 'MISSING_OPERATION_COMPONENTS: Debe cargar los medios de pago antes de enviar';
    END IF;

    IF ROUND(v_cmp_sum::numeric, 2) <> ROUND(v_transaction_amount::numeric, 2) THEN
      RAISE EXCEPTION 'COMPONENTS_SUM_MISMATCH_BEFORE_PENDING';
    END IF;
  END IF;

  IF p_new_status = 'approved' AND v_current_status = 'pending' THEN
    SELECT requires_budget_approval, budget_approved_by
    INTO v_req_budget, v_budget_by
    FROM transactions
    WHERE id = p_transaction_id;

    IF COALESCE(v_req_budget, false) = true AND v_budget_by IS NULL THEN
      RAISE EXCEPTION 'BUDGET_APPROVAL_REQUIRED: Requiere aprobación de excepción de presupuesto antes de aprobar';
    END IF;
  END IF;

  IF p_new_status = 'approved' THEN
    SELECT status INTO v_period_status
    FROM periods
    WHERE company_id = v_company_id
      AND year = EXTRACT(YEAR FROM v_transaction_date)
      AND month = EXTRACT(MONTH FROM v_transaction_date);

    IF v_period_status = 'closed' THEN
      RAISE EXCEPTION 'PERIOD_CLOSED: No se puede aprobar en un período cerrado';
    END IF;
  END IF;

  IF p_new_status = 'cancelled' THEN
    IF v_current_status <> 'approved' THEN
      RAISE EXCEPTION 'INVALID_TRANSITION: Solo operaciones aprobadas se cancelan';
    END IF;
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
      RAISE EXCEPTION 'MISSING_REASON: Motivo de cancelación obligatorio';
    END IF;

    DELETE FROM journal_entries WHERE transaction_id = p_transaction_id;

    UPDATE transactions
    SET status = 'cancelled',
        cancellation_reason = trim(p_reason),
        cancelled_by = v_effective_user_id,
        cancelled_at = NOW(),
        updated_at = NOW(),
        updated_by = v_effective_user_id
    WHERE id = p_transaction_id;

    PERFORM update_account_balance(v_company_id);
    RETURN TRUE;
  END IF;

  CASE p_new_status
    WHEN 'approved' THEN
      PERFORM fn_post_journal_for_transaction(p_transaction_id, v_effective_user_id);

      UPDATE transactions
      SET status = p_new_status,
          approved_by = v_effective_user_id,
          approved_at = NOW(),
          updated_at = NOW(),
          updated_by = v_effective_user_id
      WHERE id = p_transaction_id;

      PERFORM update_account_balance(v_company_id);

    WHEN 'rejected' THEN
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'MISSING_REASON: Debe proporcionar un motivo para el rechazo';
      END IF;

      UPDATE transactions
      SET status = p_new_status,
          rejected_by = v_effective_user_id,
          rejected_at = NOW(),
          rejection_reason = p_reason,
          updated_at = NOW(),
          updated_by = v_effective_user_id
      WHERE id = p_transaction_id;

    ELSE
      UPDATE transactions
      SET status = p_new_status,
          updated_at = NOW(),
          updated_by = v_effective_user_id
      WHERE id = p_transaction_id;
  END CASE;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION update_transaction_status IS
  'Al aprobar genera diario y saldos; sin paso posted. Cancelación borra asiento y marca cancelled.';

-- 8) Backfill: approved sin asiento → generar diario (ex contabilización pendiente)
DO $$
DECLARE
  r RECORD;
  v_who UUID;
BEGIN
  FOR r IN
    SELECT t.id, t.company_id, COALESCE(t.updated_by, t.created_by)::uuid AS who
    FROM transactions t
    WHERE t.status = 'approved'
      AND t.deleted_at IS NULL
      AND t.type IN ('income', 'expense', 'transfer', 'adjustment')
      AND NOT EXISTS (SELECT 1 FROM journal_entries je WHERE je.transaction_id = t.id)
  LOOP
    v_who := r.who;
    IF v_who IS NULL THEN
      CONTINUE;
    END IF;
    PERFORM fn_post_journal_for_transaction(r.id, v_who);
    PERFORM update_account_balance(r.company_id);
  END LOOP;
END $$;

-- 9) RLS: quitar paso post y revertir aprobado
DROP POLICY IF EXISTS transactions_post ON transactions;
DROP POLICY IF EXISTS transactions_revert_approved ON transactions;
DROP POLICY IF EXISTS transactions_no_update_posted ON transactions;

-- Excepción presupuesto sobre filas approved (approveBudgetException desde app)
CREATE POLICY transactions_budget_exemption_update ON transactions
  FOR UPDATE
  USING (
    status = 'approved'
    AND COALESCE(requires_budget_approval, false) = true
    AND budget_approved_by IS NULL
    AND company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.id = auth.uid()
        AND u2.role IN ('superadmin', 'admin_finanzas')
    )
  )
  WITH CHECK (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
  );

COMMENT ON POLICY transactions_budget_exemption_update ON transactions IS
  'Admin puede registrar aprobación de excepción de presupuesto en operación approved pendiente de ello.';

-- 10) Retro-contabilización batch
DO $$
DECLARE
  c UUID;
BEGIN
  FOR c IN SELECT DISTINCT company_id FROM transactions WHERE deleted_at IS NULL
  LOOP
    PERFORM update_account_balance(c);
  END LOOP;
END $$;
