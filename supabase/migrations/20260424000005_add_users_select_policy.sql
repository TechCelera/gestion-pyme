-- ============================================================================
-- MIGRACIÓN: Add SELECT policy for users table
-- Fecha: 2026-04-24
-- Problema: Tabla users tiene RLS habilitado (rowsecurity=true) pero sin
--   políticas SELECT. getCurrentUserCompany() hace .from('users').select()
--   y RLS bloquea todo — siempre retorna null.
-- Solución: Agregar política SELECT para que cada usuario pueda leer su
--   propio registro (where id = auth.uid())
-- ============================================================================

CREATE POLICY users_select ON users
  FOR SELECT
  USING (id = auth.uid());

-- Notas:
-- - transactions_company_isolation usa subquery similar: id IN (SELECT company_id FROM users WHERE id = auth.uid())
-- - Pero esa política es sobre TRANSACTIONS, no sobre USERS
-- - La tabla USERS no tenía política SELECT, por eso getCurrentUserCompany() fallaba
-- - Esta política permite que cada usuario lea SOLO su propio registro
