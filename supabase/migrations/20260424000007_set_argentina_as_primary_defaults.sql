-- ============================================================================
-- MIGRACIÓN: Argentina como configuración primaria por defecto
-- Fecha: 2026-04-24
-- Descripción: nuevas empresas, cuentas y transacciones deben usar ARS como
--   moneda base por defecto. Colombia sigue soportado vía country/config.
-- ============================================================================

ALTER TABLE companies
  ALTER COLUMN currency SET DEFAULT 'ARS';

ALTER TABLE accounts
  ALTER COLUMN currency SET DEFAULT 'ARS';

ALTER TABLE transactions
  ALTER COLUMN currency SET DEFAULT 'ARS';
