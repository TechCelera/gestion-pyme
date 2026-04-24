-- ============================================================================
-- MIGRACIÓN: Restaurar políticas RLS de accounts
-- Fecha: 2026-04-24
-- Problema: la migración 20260424000004 eliminó políticas legacy de accounts
--   y no creó reemplazos. Consultas y joins sobre accounts quedan bloqueados
--   por RLS, afectando creación y lectura de transacciones.
-- Solución: recrear políticas mínimas de SELECT/INSERT/UPDATE por empresa.
-- ============================================================================

DROP POLICY IF EXISTS accounts_select ON accounts;
DROP POLICY IF EXISTS accounts_insert ON accounts;
DROP POLICY IF EXISTS accounts_update ON accounts;

CREATE POLICY accounts_select ON accounts
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
    AND deleted_at IS NULL
  );

CREATE POLICY accounts_insert ON accounts
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY accounts_update ON accounts
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
    AND deleted_at IS NULL
  )
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY accounts_select ON accounts IS
  'Usuarios pueden ver cuentas activas de su empresa.';

COMMENT ON POLICY accounts_insert ON accounts IS
  'Usuarios pueden crear cuentas dentro de su empresa.';

COMMENT ON POLICY accounts_update ON accounts IS
  'Usuarios pueden actualizar cuentas activas de su empresa.';
