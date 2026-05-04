-- ============================================================================
-- MIGRACION: Restaurar politicas RLS de audit_log
-- Fecha: 2026-05-04
-- Problema: updates/inserts en operaciones fallan por trigger fn_audit_log()
--           con error "new row violates row-level security policy for table audit_log"
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select_company" ON audit_log;
CREATE POLICY "audit_log_select_company" ON audit_log
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "audit_log_insert_company" ON audit_log;
CREATE POLICY "audit_log_insert_company" ON audit_log
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
  );
