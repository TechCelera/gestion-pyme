-- Saldos por cuenta del plan (desde diario, movimientos approved)

CREATE OR REPLACE FUNCTION rpc_chart_of_accounts_balances(
  p_company_id UUID,
  p_as_of DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', coa.id,
          'balance', ROUND(bal::numeric, 2)
        )
        ORDER BY coa.sort_order, coa.code
      )
      FROM chart_of_accounts coa
      CROSS JOIN LATERAL (
        SELECT
          CASE coa.account_type
            WHEN 'asset' THEN COALESCE(SUM(jel.debit - jel.credit), 0)
            WHEN 'expense' THEN COALESCE(SUM(jel.debit - jel.credit), 0)
            ELSE COALESCE(SUM(jel.credit - jel.debit), 0)
          END AS bal
        FROM journal_entry_lines jel
        INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
        INNER JOIN transactions t ON t.id = je.transaction_id
        WHERE jel.chart_account_id = coa.id
          AND je.company_id = p_company_id
          AND t.company_id = p_company_id
          AND t.status = 'approved'
          AND t.deleted_at IS NULL
          AND je.entry_date <= p_as_of
      ) agg
      WHERE coa.company_id = p_company_id
    ),
    '[]'::jsonb
  );
END;
$$;

COMMENT ON FUNCTION rpc_chart_of_accounts_balances(UUID, DATE) IS
  'Saldo acumulado por cuenta del plan al corte (solo movimientos approved en el diario).';
