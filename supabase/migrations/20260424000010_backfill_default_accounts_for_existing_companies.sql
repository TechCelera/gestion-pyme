-- ============================================================================
-- MIGRACIÓN: Backfill de cuentas por defecto para empresas existentes
-- Fecha: 2026-04-24
-- Descripción: crea cuentas faltantes para todas las empresas existentes
--   según su país. Es idempotente y no duplica cuentas activas.
-- ============================================================================

WITH default_accounts AS (
  SELECT *
  FROM (
    VALUES
      ('AR', 'Caja', 'cash', 'ARS'),
      ('AR', 'Cuenta Corriente', 'bank', 'ARS'),
      ('AR', 'Cuenta de Ahorros', 'bank', 'ARS'),
      ('CO', 'Caja', 'cash', 'COP'),
      ('CO', 'Cuenta Corriente', 'bank', 'COP'),
      ('CO', 'Cuenta de Ahorros', 'bank', 'COP')
  ) AS t(country, name, type, currency)
)
INSERT INTO accounts (company_id, name, type, currency, balance)
SELECT
  c.id,
  da.name,
  da.type,
  da.currency,
  0
FROM companies c
JOIN default_accounts da
  ON da.country = COALESCE(c.country, 'AR')
WHERE NOT EXISTS (
  SELECT 1
  FROM accounts existing
  WHERE existing.company_id = c.id
    AND existing.name = da.name
    AND existing.deleted_at IS NULL
);
