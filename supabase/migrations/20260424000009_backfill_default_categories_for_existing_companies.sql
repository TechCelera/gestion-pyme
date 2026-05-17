-- ============================================================================
-- MIGRACIÓN: Backfill de categorías por defecto para empresas existentes
-- Fecha: 2026-04-24
-- Descripción: crea categorías faltantes para todas las empresas existentes
--   según su país. Es idempotente y no duplica categorías activas.
-- Tipos: income | expense (véase 20260517120000_categories_income_expense_only.sql)
-- ============================================================================

WITH default_categories AS (
  SELECT *
  FROM (
    VALUES
      ('AR', 'Ventas de Productos', 'income'),
      ('AR', 'Ventas de Servicios', 'income'),
      ('AR', 'Otros Ingresos', 'income'),
      ('AR', 'Costo de Mercadería', 'expense'),
      ('AR', 'Sueldos y Jornales', 'expense'),
      ('AR', 'Servicios Públicos', 'expense'),
      ('AR', 'Alquiler', 'expense'),
      ('AR', 'Publicidad y Marketing', 'expense'),
      ('AR', 'Transporte y Logística', 'expense'),
      ('AR', 'Intereses Bancarios', 'expense'),
      ('AR', 'Comisiones Bancarias', 'expense'),
      ('CO', 'Ventas de Productos', 'income'),
      ('CO', 'Ventas de Servicios', 'income'),
      ('CO', 'Otros Ingresos', 'income'),
      ('CO', 'Costo de Mercancía', 'expense'),
      ('CO', 'Sueldos y Salarios', 'expense'),
      ('CO', 'Servicios Públicos', 'expense'),
      ('CO', 'Arriendo', 'expense'),
      ('CO', 'Publicidad y Marketing', 'expense'),
      ('CO', 'Transporte y Logística', 'expense'),
      ('CO', 'Intereses Bancarios', 'expense'),
      ('CO', 'Comisiones Bancarias', 'expense')
  ) AS t(country, name, type)
)
INSERT INTO categories (company_id, name, type)
SELECT
  c.id,
  dc.name,
  dc.type
FROM companies c
JOIN default_categories dc
  ON dc.country = COALESCE(c.country, 'AR')
WHERE NOT EXISTS (
  SELECT 1
  FROM categories existing
  WHERE existing.company_id = c.id
    AND existing.name = dc.name
    AND existing.deleted_at IS NULL
);

COMMENT ON TABLE categories IS
  'Categorías financieras por empresa. Tipos: income (ingreso) o expense (gasto).';
