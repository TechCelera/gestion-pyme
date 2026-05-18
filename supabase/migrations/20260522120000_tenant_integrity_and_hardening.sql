-- ============================================================================
-- Endurecimiento multi-tenant: FKs compuestas (id + company_id), unicidad,
-- validación de referencias y soporte de mantenimiento en audit_log.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0) Limpiar referencias huérfanas antes de FKs compuestas
-- ---------------------------------------------------------------------------
UPDATE transactions t
SET contact_id = NULL
WHERE contact_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.id = t.contact_id AND c.company_id = t.company_id
  );

UPDATE transactions t
SET category_id = NULL
WHERE category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.id = t.category_id AND c.company_id = t.company_id
  );

UPDATE transactions t
SET project_id = NULL
WHERE project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = t.project_id AND p.company_id = t.company_id
  );

UPDATE transactions t
SET source_account_id = NULL
WHERE source_account_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM accounts a
    WHERE a.id = t.source_account_id AND a.company_id = t.company_id
  );

UPDATE transactions t
SET destination_account_id = NULL
WHERE destination_account_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM accounts a
    WHERE a.id = t.destination_account_id AND a.company_id = t.company_id
  );

-- Cuenta principal: debe pertenecer a la misma empresa
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    WHERE a.company_id IS DISTINCT FROM t.company_id
    LIMIT 1
  ) THEN
    RAISE EXCEPTION 'TENANT_INTEGRITY: transactions con account_id de otra empresa; corregir datos antes de migrar';
  END IF;
END;
$$;

UPDATE accounts a
SET chart_account_id = NULL
WHERE chart_account_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM chart_of_accounts coa
    WHERE coa.id = a.chart_account_id AND coa.company_id = a.company_id
  );

UPDATE categories c
SET chart_account_id = NULL
WHERE chart_account_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM chart_of_accounts coa
    WHERE coa.id = c.chart_account_id AND coa.company_id = c.company_id
  );

UPDATE projects p
SET parent_project_id = NULL
WHERE parent_project_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM projects parent
    WHERE parent.id = p.parent_project_id AND parent.company_id = p.company_id
  );

-- ---------------------------------------------------------------------------
-- 1) UNIQUE (id, company_id) en tablas hijas del tenant
-- ---------------------------------------------------------------------------
ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS accounts_id_company_key;
ALTER TABLE accounts
  ADD CONSTRAINT accounts_id_company_key UNIQUE (id, company_id);

ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS categories_id_company_key;
ALTER TABLE categories
  ADD CONSTRAINT categories_id_company_key UNIQUE (id, company_id);

ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_id_company_key;
ALTER TABLE contacts
  ADD CONSTRAINT contacts_id_company_key UNIQUE (id, company_id);

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_id_company_key;
ALTER TABLE projects
  ADD CONSTRAINT projects_id_company_key UNIQUE (id, company_id);

ALTER TABLE chart_of_accounts
  DROP CONSTRAINT IF EXISTS chart_of_accounts_id_company_key;
ALTER TABLE chart_of_accounts
  ADD CONSTRAINT chart_of_accounts_id_company_key UNIQUE (id, company_id);

-- ---------------------------------------------------------------------------
-- 2) Reemplazar FKs simples en transactions por FKs compuestas
-- ---------------------------------------------------------------------------
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_contact;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_project_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_source_account_id_fkey;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_destination_account_id_fkey;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_account_tenant_fk
  FOREIGN KEY (account_id, company_id) REFERENCES accounts (id, company_id);

ALTER TABLE transactions
  ADD CONSTRAINT transactions_category_tenant_fk
  FOREIGN KEY (category_id, company_id) REFERENCES categories (id, company_id);

ALTER TABLE transactions
  ADD CONSTRAINT transactions_contact_tenant_fk
  FOREIGN KEY (contact_id, company_id) REFERENCES contacts (id, company_id);

ALTER TABLE transactions
  ADD CONSTRAINT transactions_project_tenant_fk
  FOREIGN KEY (project_id, company_id) REFERENCES projects (id, company_id);

ALTER TABLE transactions
  ADD CONSTRAINT transactions_source_account_tenant_fk
  FOREIGN KEY (source_account_id, company_id) REFERENCES accounts (id, company_id);

ALTER TABLE transactions
  ADD CONSTRAINT transactions_destination_account_tenant_fk
  FOREIGN KEY (destination_account_id, company_id) REFERENCES accounts (id, company_id);

-- ---------------------------------------------------------------------------
-- 3) Plan de cuentas en wallets y categorías (misma empresa)
-- ---------------------------------------------------------------------------
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_chart_account_id_fkey;
ALTER TABLE accounts
  ADD CONSTRAINT accounts_chart_account_tenant_fk
  FOREIGN KEY (chart_account_id, company_id) REFERENCES chart_of_accounts (id, company_id);

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_chart_account_id_fkey;
ALTER TABLE categories
  ADD CONSTRAINT categories_chart_account_tenant_fk
  FOREIGN KEY (chart_account_id, company_id) REFERENCES chart_of_accounts (id, company_id);

-- ---------------------------------------------------------------------------
-- 4) Proyectos: padre en la misma empresa
-- ---------------------------------------------------------------------------
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_parent_project_id_fkey;
ALTER TABLE projects
  ADD CONSTRAINT projects_parent_tenant_fk
  FOREIGN KEY (parent_project_id, company_id) REFERENCES projects (id, company_id);

-- ---------------------------------------------------------------------------
-- 5) Unicidad de nombres activos por empresa
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_company_name_active
  ON accounts (company_id, lower(trim(name)))
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_company_name_type_active
  ON categories (company_id, lower(trim(name)), type)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
  ON users (lower(trim(email)));

-- ---------------------------------------------------------------------------
-- 6) Índices de consulta / mantenimiento
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_log_company_created
  ON audit_log (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_company_date
  ON journal_entries (company_id, entry_date DESC);

-- ---------------------------------------------------------------------------
-- 7) Validación de reglas de negocio en transactions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validate_transaction_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('income', 'expense')
     AND NEW.category_id IS NULL
     AND NEW.status NOT IN ('draft', 'cancelled') THEN
    RAISE EXCEPTION 'CATEGORY_REQUIRED_FOR_TYPE_%', NEW.type
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.type = 'transfer' THEN
    IF NEW.source_account_id IS NULL OR NEW.destination_account_id IS NULL THEN
      RAISE EXCEPTION 'TRANSFER_REQUIRES_SOURCE_AND_DESTINATION'
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.source_account_id = NEW.destination_account_id THEN
      RAISE EXCEPTION 'TRANSFER_SOURCE_EQUALS_DESTINATION'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF NEW.type = 'adjustment'
     AND NEW.adjustment_reason IS NULL
     AND NEW.status NOT IN ('draft', 'cancelled') THEN
    RAISE EXCEPTION 'ADJUSTMENT_REQUIRES_REASON'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_validate_transaction_refs() IS
  'Impide operaciones con referencias incoherentes (categoría, transferencia, ajuste).';

DROP TRIGGER IF EXISTS tr_validate_transaction_refs ON transactions;
CREATE TRIGGER tr_validate_transaction_refs
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_transaction_refs();

-- ---------------------------------------------------------------------------
-- 8) Componentes: cuenta/contacto alineados al movimiento
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validate_operation_component_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT t.company_id INTO v_company_id
  FROM transactions t
  WHERE t.id = COALESCE(NEW.transaction_id, OLD.transaction_id);

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'OPERATION_COMPONENT_TRANSACTION_NOT_FOUND';
  END IF;

  IF NEW.account_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM accounts a
    WHERE a.id = NEW.account_id AND a.company_id = v_company_id AND a.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'OPERATION_COMPONENT_ACCOUNT_TENANT_MISMATCH';
  END IF;

  IF NEW.contact_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.id = NEW.contact_id AND c.company_id = v_company_id AND c.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'OPERATION_COMPONENT_CONTACT_TENANT_MISMATCH';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_operation_component_refs ON operation_components;
CREATE TRIGGER tr_validate_operation_component_refs
  BEFORE INSERT OR UPDATE ON operation_components
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_operation_component_refs();

-- ---------------------------------------------------------------------------
-- 9) Retención opcional de audit_log (solo admin del tenant)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_prune_company_audit_log(
  p_company_id UUID,
  p_keep_days INTEGER DEFAULT 365
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  IF p_keep_days < 30 THEN
    RAISE EXCEPTION 'AUDIT_RETENTION_MIN_30_DAYS';
  END IF;

  IF NOT public.auth_user_is_admin() THEN
    RAISE EXCEPTION 'AUDIT_PRUNE_ADMIN_ONLY';
  END IF;

  IF p_company_id IS DISTINCT FROM public.auth_user_company_id() THEN
    RAISE EXCEPTION 'AUDIT_PRUNE_WRONG_COMPANY';
  END IF;

  DELETE FROM audit_log al
  WHERE al.company_id = p_company_id
    AND al.created_at < (now() - make_interval(days => p_keep_days));

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.fn_prune_company_audit_log(UUID, INTEGER) IS
  'Elimina filas de audit_log más antiguas que p_keep_days para la empresa del admin autenticado.';

REVOKE ALL ON FUNCTION public.fn_prune_company_audit_log(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_prune_company_audit_log(UUID, INTEGER) TO authenticated;
