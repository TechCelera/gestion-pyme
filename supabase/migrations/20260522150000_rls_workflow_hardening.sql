-- ============================================================================
-- Cierre RLS workflow: sin revertir approved ni paso posted legacy.
-- Alinea comentarios y políticas huérfanas con modelo approved + cancelled.
-- ============================================================================

COMMENT ON TABLE transactions IS
  'Operaciones financieras: draft → pending → approved (diario) | rejected | cancelled. Sin estado posted.';

-- Legacy (idempotente; pueden quedar en entornos viejos)
DROP POLICY IF EXISTS transactions_revert_approved ON transactions;
DROP POLICY IF EXISTS transactions_post ON transactions;
DROP POLICY IF EXISTS transactions_no_update_posted ON transactions;

-- Presupuesto: solo admin canónico (por si quedó política con roles viejos)
DROP POLICY IF EXISTS transactions_budget_exemption_update ON transactions;
CREATE POLICY transactions_budget_exemption_update ON transactions
  FOR UPDATE
  USING (
    status = 'approved'
    AND COALESCE(requires_budget_approval, false) = true
    AND budget_approved_by IS NULL
    AND company_id = (SELECT public.auth_user_company_id())
    AND public.auth_user_is_admin()
  )
  WITH CHECK (
    company_id = (SELECT public.auth_user_company_id())
  );

COMMENT ON POLICY transactions_budget_exemption_update ON transactions IS
  'Admin aprueba excepción de presupuesto en operación approved pendiente de ello.';
