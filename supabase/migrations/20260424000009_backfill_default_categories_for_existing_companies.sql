-- ============================================================================
-- MIGRACIÓN: Backfill de categorías por defecto para empresas existentes
-- Fecha: 2026-04-24
-- Descripción: crea categorías faltantes para todas las empresas existentes
--   según su país. Es idempotente y no duplica categorías activas.
-- ============================================================================

WITH default_categories AS (
  SELECT *
  FROM (
    VALUES
      ('AR', 'Ventas de Productos', 'income'),
      ('AR', 'Ventas de Servicios', 'income'),
      ('AR', 'Otros Ingresos', 'income'),
      ('AR', 'Costo de Mercadería', 'cost'),
      ('AR', 'Sueldos y Jornales', 'admin_expense'),
      ('AR', 'Servicios Públicos', 'admin_expense'),
      ('AR', 'Alquiler', 'admin_expense'),
      ('AR', 'Publicidad y Marketing', 'commercial_expense'),
      ('AR', 'Transporte y Logística', 'commercial_expense'),
      ('AR', 'Intereses Bancarios', 'financial_expense'),
      ('AR', 'Comisiones Bancarias', 'financial_expense'),
      ('CO', 'Ventas de Productos', 'income'),
      ('CO', 'Ventas de Servicios', 'income'),
      ('CO', 'Otros Ingresos', 'income'),
      ('CO', 'Costo de Mercancía', 'cost'),
      ('CO', 'Sueldos y Salarios', 'admin_expense'),
      ('CO', 'Servicios Públicos', 'admin_expense'),
      ('CO', 'Arriendo', 'admin_expense'),
      ('CO', 'Publicidad y Marketing', 'commercial_expense'),
      ('CO', 'Transporte y Logística', 'commercial_expense'),
      ('CO', 'Intereses Bancarios', 'financial_expense'),
      ('CO', 'Comisiones Bancarias', 'financial_expense')
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
  'Categorías financieras por empresa. Backfill aplicado el 2026-04-24 para empresas existentes.';
