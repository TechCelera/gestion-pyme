-- ============================================================================
-- MIGRACIÓN: Agregar campo country a companies
-- Fecha: 2026-04-23
-- ============================================================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS country varchar(2) NOT NULL DEFAULT 'AR';

COMMENT ON COLUMN companies.country IS 'Código ISO del país: AR (Argentina), CO (Colombia)';
