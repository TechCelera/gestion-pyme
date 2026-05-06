-- ============================================================================
-- Núcleo contable (Fase 2.A) — fundaciones
-- Plan de cuentas por empresa, contactos, mapeo desde accounts/categories
-- Criterio técnico: nombres/id en BD no copian el PDF; el comportamiento sí.
-- ============================================================================

-- 1) Tabla plan de cuentas (jerárquica)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(200) NOT NULL,
  account_type VARCHAR(20) NOT NULL
    CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  is_postable BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_chart_company ON chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_chart_company_code ON chart_of_accounts(company_id, code);

COMMENT ON TABLE chart_of_accounts IS 'Plan de cuentas contable por empresa (codificación 1=Activo … 5=Egreso, con subniveles tipo 1.1.1).';

-- 2) Sembrar plan base para una empresa (idempotente)
CREATE OR REPLACE FUNCTION fn_seed_company_chart_accounts(p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  id1 UUID; id11 UUID; id12 UUID; id13 UUID;
  id2 UUID; id21 UUID;
  id3 UUID;
  id4 UUID;
  id5 UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM chart_of_accounts WHERE company_id = p_company_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, NULL, '1', 'Activo', 'asset', false, 10)
  RETURNING id INTO id1;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, id1, '1.1', 'Activos Corrientes', 'asset', false, 20)
  RETURNING id INTO id11;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, id1, '1.2', 'Créditos', 'asset', false, 30)
  RETURNING id INTO id12;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, id1, '1.3', 'Otros Activos Corrientes', 'asset', false, 40)
  RETURNING id INTO id13;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES
    (p_company_id, id11, '1.1.1', 'Caja ARS', 'asset', true, 101),
    (p_company_id, id11, '1.1.2', 'Caja USD', 'asset', true, 102),
    (p_company_id, id11, '1.1.3', 'Bancos', 'asset', true, 103),
    (p_company_id, id12, '1.2.1', 'Clientes', 'asset', true, 201),
    (p_company_id, id12, '1.2.2', 'Cheques en cartera', 'asset', true, 202),
    (p_company_id, id13, '1.3.1', 'Cheques depositados', 'asset', true, 301);

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, NULL, '2', 'Pasivo', 'liability', false, 50)
  RETURNING id INTO id2;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, id2, '2.1', 'Pasivos Corrientes', 'liability', false, 60)
  RETURNING id INTO id21;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES
    (p_company_id, id21, '2.1.1', 'Proveedores', 'liability', true, 601),
    (p_company_id, id21, '2.1.2', 'Obligaciones', 'liability', true, 602);

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, NULL, '3', 'Patrimonio Neto', 'equity', false, 70)
  RETURNING id INTO id3;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES
    (p_company_id, id3, '3.1', 'Capital', 'equity', true, 701),
    (p_company_id, id3, '3.2', 'Resultados Acumulados', 'equity', true, 702);

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, NULL, '4', 'Ingresos', 'income', false, 80)
  RETURNING id INTO id4;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES
    (p_company_id, id4, '4.1', 'Ingresos por servicios', 'income', true, 801),
    (p_company_id, id4, '4.2', 'Ingresos financieros', 'income', true, 802);

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES (p_company_id, NULL, '5', 'Egresos', 'expense', false, 90)
  RETURNING id INTO id5;

  INSERT INTO chart_of_accounts (company_id, parent_id, code, name, account_type, is_postable, sort_order)
  VALUES
    (p_company_id, id5, '5.1', 'Gastos operativos', 'expense', true, 901),
    (p_company_id, id5, '5.2', 'Gastos financieros', 'expense', true, 902);
END;
$$;

COMMENT ON FUNCTION fn_seed_company_chart_accounts(UUID) IS 'Inserta plan de cuentas base si la empresa no tiene filas en chart_of_accounts.';

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT id AS company_id FROM companies LOOP
    PERFORM fn_seed_company_chart_accounts(rec.company_id);
  END LOOP;
END;
$$;

-- 3) Contactos (para cuenta corriente / AR / AP auxiliar por línea)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind VARCHAR(20) NOT NULL DEFAULT 'both'
    CHECK (kind IN ('client', 'provider', 'both')),
  name VARCHAR(200) NOT NULL,
  tax_id VARCHAR(50),
  notes VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE contacts IS 'Clientes/proveedores para operaciones con cuenta corriente y etiquetado auxiliar en líneas del diario.';

-- 4) Referencia transacciones -> contactos (datos huérfanos se limpian)
UPDATE transactions SET contact_id = NULL;

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS fk_transactions_contact;

ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_contact
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;

-- 5) Mapeo contable desde cuentas operativas y categorías
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS chart_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS chart_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;

-- Backfill wallets -> Caja/Bancos por moneda/tipo operativo
UPDATE accounts a SET chart_account_id = (
  SELECT coa.id FROM chart_of_accounts coa
  WHERE coa.company_id = a.company_id
    AND coa.code = CASE
      WHEN UPPER(COALESCE(a.currency, 'ARS')) = 'USD' AND a.type = 'cash' THEN '1.1.2'
      WHEN a.type = 'cash' THEN '1.1.1'
      WHEN a.type = 'bank' THEN '1.1.3'
      ELSE '1.1.3'
    END
  LIMIT 1
)
WHERE a.chart_account_id IS NULL AND a.deleted_at IS NULL;

-- Todas las categorías operativas hacia naturaleza económica
UPDATE categories c SET chart_account_id = (
  SELECT coa.id FROM chart_of_accounts coa
  WHERE coa.company_id = c.company_id
    AND coa.code = CASE WHEN c.type = 'income' THEN '4.1' ELSE '5.1' END
  LIMIT 1
)
WHERE c.chart_account_id IS NULL AND c.deleted_at IS NULL;

-- INSERT futuros pueden omitir chart_account_id: derivamos desde el plan sembrado
CREATE OR REPLACE FUNCTION fn_categories_default_chart_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.chart_account_id IS NULL THEN
    SELECT coa.id INTO NEW.chart_account_id
    FROM chart_of_accounts coa
    WHERE coa.company_id = NEW.company_id
      AND coa.code = CASE WHEN NEW.type = 'income' THEN '4.1' ELSE '5.1' END
    LIMIT 1;

    IF NEW.chart_account_id IS NULL THEN
      RAISE EXCEPTION 'CHART_SEED_MISSING: plan de cuentas no inicializado para la empresa';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_accounts_default_chart_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.chart_account_id IS NULL THEN
    SELECT coa.id INTO NEW.chart_account_id
    FROM chart_of_accounts coa
    WHERE coa.company_id = NEW.company_id
      AND coa.code = CASE
        WHEN NEW.type::text = 'cash' AND UPPER(COALESCE(NEW.currency, 'ARS')) = 'USD' THEN '1.1.2'
        WHEN NEW.type::text = 'cash' THEN '1.1.1'
        ELSE '1.1.3'
      END
    LIMIT 1;

    IF NEW.chart_account_id IS NULL THEN
      RAISE EXCEPTION 'CHART_SEED_MISSING: plan de cuentas no inicializado para la empresa';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_categories_chart_default ON categories;
CREATE TRIGGER tr_categories_chart_default
  BEFORE INSERT ON categories
  FOR EACH ROW EXECUTE FUNCTION fn_categories_default_chart_account();

DROP TRIGGER IF EXISTS tr_accounts_chart_default ON accounts;
CREATE TRIGGER tr_accounts_chart_default
  BEFORE INSERT ON accounts
  FOR EACH ROW EXECUTE FUNCTION fn_accounts_default_chart_account();

ALTER TABLE accounts
  ALTER COLUMN chart_account_id SET NOT NULL;

ALTER TABLE categories
  ALTER COLUMN chart_account_id SET NOT NULL;

COMMENT ON COLUMN accounts.chart_account_id IS 'Contrapartida patrimonial de la cuenta operativa en el plan de cuentas (hoja tipo 1.1.x).';
COMMENT ON COLUMN categories.chart_account_id IS 'Clasificación P&L (4.x ingreso / 5.x gasto) enlazada a la naturaleza de la categoría.';

-- RLS nuevas tablas plan de cuentas y contactos
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY chart_of_accounts_select ON chart_of_accounts
  FOR SELECT
  USING (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY chart_of_accounts_modify ON chart_of_accounts
  FOR ALL
  USING (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('superadmin', 'admin_finanzas')
    )
  )
  WITH CHECK (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('superadmin', 'admin_finanzas')
    )
  );

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_select ON contacts
  FOR SELECT
  USING (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
    AND deleted_at IS NULL
  );

CREATE POLICY contacts_modify ON contacts
  FOR INSERT
  WITH CHECK (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  );

CREATE POLICY contacts_update ON contacts
  FOR UPDATE
  USING (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
    AND deleted_at IS NULL
  )
  WITH CHECK (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
  );
