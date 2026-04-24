-- ============================================================================
-- MIGRACIÓN: Restaurar políticas RLS de categories
-- Fecha: 2026-04-24
-- Problema: la migración 20260424000004 eliminó políticas legacy de categories
--   y no creó reemplazos. El formulario de transacciones y la pantalla de
--   configuración quedan sin acceso a categorías bajo RLS.
-- Solución: recrear políticas mínimas de SELECT/INSERT/UPDATE por empresa.
-- ============================================================================

DROP POLICY IF EXISTS categories_select ON categories;
DROP POLICY IF EXISTS categories_insert ON categories;
DROP POLICY IF EXISTS categories_update ON categories;

CREATE POLICY categories_select ON categories
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
    AND deleted_at IS NULL
  );

CREATE POLICY categories_insert ON categories
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id
      FROM users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY categories_update ON categories
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

COMMENT ON POLICY categories_select ON categories IS
  'Usuarios pueden ver categorías activas de su empresa.';

COMMENT ON POLICY categories_insert ON categories IS
  'Usuarios pueden crear categorías dentro de su empresa.';

COMMENT ON POLICY categories_update ON categories IS
  'Usuarios pueden actualizar categorías activas de su empresa.';
