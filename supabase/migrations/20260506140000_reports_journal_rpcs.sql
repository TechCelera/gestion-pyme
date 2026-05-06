-- Reportes desde libro diario (Bernabé §7) — SECURITY DEFINER con chequeo de empresa

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
    AND t.status = 'posted'
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
    AND t.status = 'posted'
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
      AND t.status = 'posted'
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
  'Estado de resultados del período desde líneas del diario (solo operaciones posted).';

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
      AND t.status = 'posted'
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

COMMENT ON FUNCTION rpc_reports_cash_flow_real_monthly(UUID, DATE, DATE) IS
  'Flujo de caja real mensual solo desde movimientos en carteras efectivo/banco (líneas con operative_account_id).';

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
    AND t.status = 'posted'
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
    AND t.status = 'posted'
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
    AND t.status = 'posted'
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
  'Balance patrimonial acumulado hasta fecha de corte desde el diario (posted).';

GRANT EXECUTE ON FUNCTION rpc_reports_income_statement_period(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_reports_cash_flow_real_monthly(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_reports_balance_sheet(UUID, DATE) TO authenticated;
