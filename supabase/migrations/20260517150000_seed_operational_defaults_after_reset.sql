-- ============================================================================
-- Mínimo operativo por país (cuentas + categorías) si faltan tras reset/dev.
-- Idempotente: no duplica nombres activos.
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
