-- ============================================================================
-- Motor de posteo: componentes financieros + libro diario + saldos desde diario
-- ============================================================================

-- Transferencias y ajustes pueden no llevar categoría contable de resultados
ALTER TABLE transactions
  ALTER COLUMN category_id DROP NOT NULL;

-- 1) Componentes financieros (desglose de la operación; suma debe = transactions.amount al postear)
CREATE TABLE IF NOT EXISTS operation_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  component_type VARCHAR(30) NOT NULL
    CHECK (component_type IN (
      'operative_cash',
      'operative_bank',
      'client_receivable',
      'supplier_payable'
    )),
  account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  contact_id UUID REFERENCES contacts(id) ON DELETE RESTRICT,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'ARS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT operation_components_wallet_or_ar_ap CHECK (
    (component_type IN ('operative_cash', 'operative_bank') AND account_id IS NOT NULL AND contact_id IS NULL)
    OR (component_type = 'client_receivable' AND contact_id IS NOT NULL AND account_id IS NULL)
    OR (component_type = 'supplier_payable' AND contact_id IS NOT NULL AND account_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_op_comp_txn ON operation_components(transaction_id);

COMMENT ON TABLE operation_components IS 'Desglose de cobro/pago por operación (Bernabé 2.2 / 5.1 Paso 2).';

-- Diario por operación posteada
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  UNIQUE (transaction_id)
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  chart_account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  operative_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT,
  contact_id UUID REFERENCES contacts(id) ON DELETE RESTRICT,
  debit NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_jel_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jel_chart ON journal_entry_lines(chart_account_id);
CREATE INDEX IF NOT EXISTS idx_jel_operative ON journal_entry_lines(operative_account_id)
  WHERE operative_account_id IS NOT NULL;

COMMENT ON TABLE journal_entries IS 'Asiento principal generado por el sistema al contabilizar una operación.';
COMMENT ON TABLE journal_entry_lines IS 'Líneas de partida doble (usuario no arma manualmente el asiento).';

-- RLS lectura empresa
ALTER TABLE operation_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY operation_components_select ON operation_components
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = operation_components.transaction_id
        AND t.company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
        AND t.deleted_at IS NULL
    )
  );

CREATE POLICY operation_components_mutate ON operation_components
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = operation_components.transaction_id
        AND t.company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
        AND t.status IN ('draft', 'pending')
        AND t.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = operation_components.transaction_id
        AND t.company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
        AND t.status IN ('draft', 'pending')
        AND t.deleted_at IS NULL
    )
  );

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_entries_select ON journal_entries
  FOR SELECT
  USING (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
  );

CREATE POLICY journal_lines_select ON journal_entry_lines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journal_entries je
      WHERE je.id = journal_entry_lines.journal_entry_id
        AND je.company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- Solo el motor (SECURITY DEFINER) puede insertar asientos desde la app cliente
-- sin políticas INSERT en journal_*.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_protect_operation_components()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_status VARCHAR;
  v_tid UUID;
BEGIN
  v_tid := COALESCE(NEW.transaction_id, OLD.transaction_id);

  SELECT t.status INTO v_status
  FROM transactions t WHERE t.id = v_tid FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  IF v_status IN ('draft', 'pending') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_status = 'posted' THEN
    IF TG_OP <> 'INSERT' THEN
      RAISE EXCEPTION 'OPERATION_COMPONENTS_IMMUTABLE: No se modifican líneas después de la contabilización';
    END IF;
    IF EXISTS (SELECT 1 FROM journal_entries je WHERE je.transaction_id = v_tid LIMIT 1) THEN
      RAISE EXCEPTION 'OPERATION_COMPONENTS_SEALED: La operación ya tiene asiento contable';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'OPERATION_COMPONENTS_IMMUTABLE_FOR_STATUS';
END;
$$;

DROP TRIGGER IF EXISTS tr_operation_components_guard ON operation_components;

CREATE TRIGGER tr_operation_components_guard
  BEFORE INSERT OR UPDATE OR DELETE ON operation_components
  FOR EACH ROW EXECUTE FUNCTION trg_protect_operation_components();

-- -----------------------------------------------------------------------------
-- fn_post_journal_for_transaction: única entrada de asientos automáticos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_post_journal_for_transaction(
  p_transaction_id UUID,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  txn RECORD;
  v_entry_id UUID;
  v_cat_type VARCHAR;
  v_cat_chart UUID;
  v_sum NUMERIC;
  v_cnt INT;
  v_total_debit NUMERIC;
  v_total_credit NUMERIC;
  v_clients_ca UUID;
  v_suppliers_ca UUID;
  v_eq UUID;
  comp RECORD;
  v_ckind VARCHAR;
  v_wallet_chart UUID;
  vd UUID;
  vs UUID;
  acc_chart UUID;
  adj_chart UUID;
  adj_type VARCHAR;
BEGIN
  IF EXISTS (SELECT 1 FROM journal_entries WHERE transaction_id = p_transaction_id) THEN
    RETURN (SELECT id FROM journal_entries WHERE transaction_id = p_transaction_id LIMIT 1);
  END IF;

  SELECT *
  INTO txn
  FROM transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF txn IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  SELECT id INTO v_clients_ca
  FROM chart_of_accounts WHERE company_id = txn.company_id AND code = '1.2.1';

  SELECT id INTO v_suppliers_ca
  FROM chart_of_accounts WHERE company_id = txn.company_id AND code = '2.1.1';

  SELECT id INTO v_eq
  FROM chart_of_accounts WHERE company_id = txn.company_id AND code = '3.2';

  INSERT INTO journal_entries (company_id, transaction_id, entry_date, description, created_by)
  VALUES (
    txn.company_id,
    p_transaction_id,
    txn.date,
    LEFT(txn.description, 500),
    p_created_by
  )
  RETURNING id INTO v_entry_id;

  IF txn.type IN ('income', 'expense') THEN

    SELECT COUNT(*)::INT, COALESCE(SUM(oc.amount), 0)
      INTO v_cnt, v_sum
    FROM operation_components oc
    WHERE oc.transaction_id = p_transaction_id;

    IF v_cnt = 0 OR v_sum <> txn.amount THEN
      RAISE EXCEPTION 'COMPONENTS_INVALID: Para ingreso/egreso la suma de componentes debe ser igual al monto total de la operación';
    END IF;

    SELECT c.type, c.chart_account_id
      INTO v_cat_type, v_cat_chart
    FROM categories c
    WHERE c.id = txn.category_id AND c.company_id = txn.company_id AND c.deleted_at IS NULL;

    IF NOT FOUND OR v_cat_chart IS NULL THEN
      RAISE EXCEPTION 'MISSING_CATEGORY_CHART';
    END IF;

    IF txn.type = 'income' THEN
      INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
      VALUES (v_entry_id, v_cat_chart, NULL, NULL, 0, txn.amount);

      FOR comp IN
        SELECT * FROM operation_components oc WHERE oc.transaction_id = p_transaction_id
      LOOP
        IF comp.component_type IN ('operative_cash','operative_bank') THEN
          SELECT a.chart_account_id INTO v_wallet_chart FROM accounts a WHERE a.id = comp.account_id;
          INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
          VALUES (v_entry_id, v_wallet_chart, comp.account_id, NULL, comp.amount, 0);
        ELSIF comp.component_type = 'client_receivable' THEN
          SELECT ct.kind INTO v_ckind FROM contacts ct WHERE ct.id = comp.contact_id AND ct.company_id = txn.company_id;
          IF v_ckind IS NULL THEN
            RAISE EXCEPTION 'CONTACT_NOT_FOUND';
          END IF;
          IF v_ckind NOT IN ('client','both') THEN
            RAISE EXCEPTION 'CONTACT_KIND_MISMATCH: cuenta corriente cliente';
          END IF;
          INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
          VALUES (v_entry_id, v_clients_ca, NULL, comp.contact_id, comp.amount, 0);
        ELSE
          RAISE EXCEPTION 'INVALID_COMPONENT_FOR_INCOME';
        END IF;
      END LOOP;

    ELSE
      INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
      VALUES (v_entry_id, v_cat_chart, NULL, NULL, txn.amount, 0);

      FOR comp IN
        SELECT * FROM operation_components oc WHERE oc.transaction_id = p_transaction_id
      LOOP
        IF comp.component_type IN ('operative_cash','operative_bank') THEN
          SELECT a.chart_account_id INTO v_wallet_chart FROM accounts a WHERE a.id = comp.account_id;
          INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
          VALUES (v_entry_id, v_wallet_chart, comp.account_id, NULL, 0, comp.amount);
        ELSIF comp.component_type = 'supplier_payable' THEN
          SELECT ct.kind INTO v_ckind FROM contacts ct WHERE ct.id = comp.contact_id AND ct.company_id = txn.company_id;
          IF v_ckind NOT IN ('provider','both') THEN
            RAISE EXCEPTION 'CONTACT_KIND_MISMATCH: cuenta corriente proveedor';
          END IF;
          INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
          VALUES (v_entry_id, v_suppliers_ca, NULL, comp.contact_id, 0, comp.amount);
        ELSE
          RAISE EXCEPTION 'INVALID_COMPONENT_FOR_EXPENSE';
        END IF;
      END LOOP;

    END IF;

  ELSIF txn.type = 'transfer' THEN
    IF txn.source_account_id IS NULL OR txn.destination_account_id IS NULL THEN
      RAISE EXCEPTION 'TRANSFER_MISSING_ACCOUNTS';
    END IF;

    SELECT a.chart_account_id INTO vd FROM accounts a WHERE a.id = txn.destination_account_id;
    SELECT a.chart_account_id INTO vs FROM accounts a WHERE a.id = txn.source_account_id;

    IF vd IS NULL OR vs IS NULL THEN
      RAISE EXCEPTION 'MISSING_ACCOUNT_CHART';
    END IF;

    INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, debit, credit)
    VALUES (v_entry_id, vd, txn.destination_account_id, txn.amount, 0);

    INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, debit, credit)
    VALUES (v_entry_id, vs, txn.source_account_id, 0, txn.amount);

  ELSIF txn.type = 'adjustment' THEN
    SELECT a.chart_account_id INTO acc_chart FROM accounts a WHERE a.id = txn.account_id;

    IF acc_chart IS NULL THEN
      RAISE EXCEPTION 'MISSING_ACCOUNT_CHART';
    END IF;

    IF txn.category_id IS NOT NULL THEN
      SELECT c.type, c.chart_account_id INTO adj_type, adj_chart
      FROM categories c
      WHERE c.id = txn.category_id AND c.company_id = txn.company_id AND c.deleted_at IS NULL;

      IF NOT FOUND OR adj_chart IS NULL THEN
        RAISE EXCEPTION 'MISSING_CATEGORY_CHART';
      END IF;

      IF adj_type = 'income' THEN
        INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, debit, credit)
        VALUES (v_entry_id, acc_chart, txn.account_id, txn.amount, 0);
        INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
        VALUES (v_entry_id, adj_chart, NULL, NULL, 0, txn.amount);
      ELSE
        INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
        VALUES (v_entry_id, adj_chart, NULL, NULL, txn.amount, 0);
        INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, debit, credit)
        VALUES (v_entry_id, acc_chart, txn.account_id, 0, txn.amount);
      END IF;
    ELSE
      IF v_eq IS NULL THEN
        RAISE EXCEPTION 'MISSING_EQUITY_ACCOUNT';
      END IF;

      INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, debit, credit)
      VALUES (v_entry_id, acc_chart, txn.account_id, txn.amount, 0);
      INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
      VALUES (v_entry_id, v_eq, NULL, NULL, 0, txn.amount);
    END IF;

  ELSE
    RAISE EXCEPTION 'POSTING_NOT_IMPLEMENTED_FOR_TYPE';
  END IF;

  SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0)
    INTO v_total_debit, v_total_credit
  FROM journal_entry_lines
  WHERE journal_entry_id = v_entry_id;

  IF v_total_debit <> v_total_credit THEN
    RAISE EXCEPTION 'UNBALANCED_ENTRY: debe % haber %', v_total_debit, v_total_credit;
  END IF;

  RETURN v_entry_id;
END;
$$;

COMMENT ON FUNCTION fn_post_journal_for_transaction(UUID, UUID) IS 'Genera asiento contable determinístico cuando la operación pasa a posted. SECURITY DEFINER.';

-- Saldos de carteras (accounts operativos) desde el diario
CREATE OR REPLACE FUNCTION update_account_balance(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE accounts a
  SET
    balance = COALESCE(agg.bal, 0),
    updated_at = NOW()
  FROM (
    SELECT
      a2.id AS account_key,
      ROUND(COALESCE(SUM(l.debit - l.credit), 0)::numeric, 2) AS bal
    FROM accounts a2
    LEFT JOIN journal_entry_lines l ON l.operative_account_id = a2.id
    LEFT JOIN journal_entries je ON je.id = l.journal_entry_id AND je.company_id = p_company_id
    LEFT JOIN transactions t ON t.id = je.transaction_id
      AND t.company_id = p_company_id
      AND t.status = 'posted'
      AND t.deleted_at IS NULL
    WHERE a2.company_id = p_company_id
      AND a2.deleted_at IS NULL
    GROUP BY a2.id
  ) agg
  WHERE a.id = agg.account_key
    AND a.company_id = p_company_id;
END;
$$;

COMMENT ON FUNCTION update_account_balance(UUID) IS 'Recalcula balance de todas las cuentas operativas de la empresa a partir del diario (líneas con operative_account_id).';

-- -----------------------------------------------------------------------------
-- RPC: definir/editar componentes (borrador/pendientes)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_operation_components(
  p_transaction_id UUID,
  p_components JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  txn RECORD;
  v_user_company UUID;
  elem JSONB;
  v_sum NUMERIC := 0;
  v_tp VARCHAR;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT company_id INTO v_user_company FROM users WHERE id = auth.uid();
  SELECT id, company_id, status, type, amount INTO txn
  FROM transactions WHERE id = p_transaction_id FOR UPDATE;

  IF txn.id IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND';
  END IF;

  IF txn.company_id <> v_user_company THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF txn.status NOT IN ('draft', 'pending') THEN
    RAISE EXCEPTION 'OPERATION_NOT_EDITABLE_FOR_COMPONENTS';
  END IF;

  IF txn.type NOT IN ('income', 'expense') THEN
    RAISE EXCEPTION 'COMPONENTS_UNSUPPORTED_TYPE';
  END IF;

  DELETE FROM operation_components WHERE transaction_id = p_transaction_id;

  IF p_components IS NULL OR jsonb_typeof(p_components) <> 'array' THEN
    RAISE EXCEPTION 'COMPONENTS_PAYLOAD_INVALID';
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(p_components)
  LOOP
    v_tp := elem->>'component_type';
    v_sum := v_sum + (elem->>'amount')::numeric;

    INSERT INTO operation_components (transaction_id, component_type, account_id, contact_id, amount, currency)
    VALUES (
      p_transaction_id,
      v_tp::varchar,
      CASE WHEN elem->>'account_id' IS NOT NULL AND btrim(elem->>'account_id') <> ''
        THEN (elem->>'account_id')::uuid END,
      CASE WHEN elem->>'contact_id' IS NOT NULL AND btrim(elem->>'contact_id') <> ''
        THEN (elem->>'contact_id')::uuid END,
      (elem->>'amount')::numeric,
      COALESCE(
        NULLIF(btrim(elem->>'currency'), ''),
        (SELECT currency FROM transactions WHERE id = p_transaction_id)
      )
    );
  END LOOP;

  IF ROUND(v_sum::numeric, 2) <> ROUND(txn.amount::numeric, 2) THEN
    RAISE EXCEPTION 'COMPONENTS_SUM_MISMATCH: suma %% vs total %% ', v_sum, txn.amount;
  END IF;

END;
$$;

COMMENT ON FUNCTION set_operation_components(UUID, JSONB) IS 'Guarda líneas contables intermedias hasta que coincida exactamente transaction.amount';

-- -----------------------------------------------------------------------------
-- update_transaction_status: validar borrador pendiente para ingreso/egreso y postear desde diario
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_transaction_status(
  p_transaction_id UUID,
  p_new_status VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_reason VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status VARCHAR;
  v_company_id UUID;
  v_transaction_date DATE;
  v_period_status VARCHAR;
  v_effective_user_id UUID;
  v_transaction_type VARCHAR;
  v_transaction_amount NUMERIC;
  v_cmp_cnt INT;
  v_cmp_sum NUMERIC;
BEGIN
  v_effective_user_id := COALESCE(p_user_id, auth.uid());

  IF v_effective_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT status, company_id, date, type, amount
  INTO v_current_status, v_company_id, v_transaction_date, v_transaction_type, v_transaction_amount
  FROM transactions
  WHERE id = p_transaction_id;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'TRANSACTION_NOT_FOUND: Transacción no encontrada';
  END IF;

  IF EXISTS (
    SELECT 1 FROM transactions
    WHERE id = p_transaction_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'TRANSACTION_DELETED: No se puede modificar una transacción eliminada';
  END IF;

  IF v_current_status = 'posted' THEN
    RAISE EXCEPTION 'POSTED_IMMUTABLE: Las transacciones contabilizadas no pueden modificarse';
  END IF;

  CASE v_current_status
    WHEN 'draft' THEN
      IF NOT (p_new_status IN ('pending', 'deleted')) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde DRAFT solo se puede ir a PENDING o DELETED';
      END IF;
    WHEN 'pending' THEN
      IF NOT (p_new_status IN ('approved', 'rejected')) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde PENDING solo se puede ir a APPROVED o REJECTED';
      END IF;
    WHEN 'approved' THEN
      IF NOT (p_new_status IN ('posted', 'draft')) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde APPROVED solo se puede ir a POSTED o volver a DRAFT';
      END IF;
    WHEN 'rejected' THEN
      IF NOT (p_new_status IN ('draft', 'pending')) THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Desde REJECTED solo se puede ir a DRAFT o PENDING';
      END IF;
    ELSE
      RAISE EXCEPTION 'INVALID_STATUS: Estado actual no válido';
  END CASE;

  IF p_new_status = 'pending'
     AND v_current_status = 'draft'
     AND v_transaction_type IN ('income', 'expense') THEN

    SELECT COUNT(*)::INT, COALESCE(SUM(amount), 0)
      INTO v_cmp_cnt, v_cmp_sum
    FROM operation_components
    WHERE transaction_id = p_transaction_id;

    IF v_cmp_cnt = 0 THEN
      RAISE EXCEPTION 'MISSING_OPERATION_COMPONENTS: Debe cargar los medios de pago antes de enviar';
    END IF;

    IF ROUND(v_cmp_sum::numeric, 2) <> ROUND(v_transaction_amount::numeric, 2) THEN
      RAISE EXCEPTION 'COMPONENTS_SUM_MISMATCH_BEFORE_PENDING';
    END IF;
  END IF;

  IF p_new_status = 'posted' THEN
    SELECT status INTO v_period_status
    FROM periods
    WHERE company_id = v_company_id
      AND year = EXTRACT(YEAR FROM v_transaction_date)
      AND month = EXTRACT(MONTH FROM v_transaction_date);

    IF v_period_status = 'closed' THEN
      RAISE EXCEPTION 'PERIOD_CLOSED: No se puede contabilizar en un período cerrado';
    END IF;
  END IF;

  CASE p_new_status
    WHEN 'approved' THEN
      UPDATE transactions
      SET status = p_new_status,
          approved_by = v_effective_user_id,
          approved_at = NOW(),
          updated_at = NOW(),
          updated_by = v_effective_user_id
      WHERE id = p_transaction_id;

    WHEN 'posted' THEN

      PERFORM fn_post_journal_for_transaction(p_transaction_id, v_effective_user_id);

      UPDATE transactions
      SET status = p_new_status,
          posted_by = v_effective_user_id,
          posted_at = NOW(),
          updated_at = NOW(),
          updated_by = v_effective_user_id
      WHERE id = p_transaction_id;

      PERFORM update_account_balance(v_company_id);

    WHEN 'rejected' THEN
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'MISSING_REASON: Debe proporcionar un motivo para el rechazo';
      END IF;

      UPDATE transactions
      SET status = p_new_status,
          rejected_by = v_effective_user_id,
          rejected_at = NOW(),
          rejection_reason = p_reason,
          updated_at = NOW(),
          updated_by = v_effective_user_id
      WHERE id = p_transaction_id;

    WHEN 'deleted' THEN
      UPDATE transactions
      SET status = p_new_status,
          deleted_at = NOW(),
          deleted_by = v_effective_user_id,
          updated_at = NOW(),
          updated_by = v_effective_user_id
      WHERE id = p_transaction_id;

    ELSE
      UPDATE transactions
      SET status = p_new_status,
          updated_at = NOW(),
          updated_by = v_effective_user_id
      WHERE id = p_transaction_id;
  END CASE;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION update_transaction_status IS 'Máquina de estados; al posted genera libro diario y recalcula saldos desde el diario.';

-- -----------------------------------------------------------------------------
-- Nueva empresa desde signup → plan contable inicial
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_full_name TEXT;
  v_company_name TEXT;
  v_country TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa');
  v_country := COALESCE(NEW.raw_user_meta_data->>'country', 'AR');

  INSERT INTO companies (name, currency, country)
  VALUES (
    v_company_name,
    CASE v_country
      WHEN 'CO' THEN 'COP'
      ELSE 'ARS'
    END,
    v_country
  )
  RETURNING id INTO v_company_id;

  PERFORM fn_seed_company_chart_accounts(v_company_id);

  INSERT INTO users (id, company_id, email, full_name, role)
  VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    v_full_name,
    'admin_finanzas'
  );

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Backfill: operaciones legacy ingreso/gasto ya contabilizadas o en flujo futuro
-- -----------------------------------------------------------------------------
INSERT INTO operation_components (transaction_id, component_type, account_id, contact_id, amount, currency)
SELECT
  t.id,
  CASE WHEN ac.type::text = 'cash' THEN 'operative_cash' ELSE 'operative_bank' END,
  t.account_id,
  NULL::uuid AS contact_id,
  t.amount::numeric AS amount,
  COALESCE(NULLIF(trim(t.currency::text), ''), COALESCE(trim(ac.currency::text), 'ARS')) AS currency
FROM transactions t
INNER JOIN accounts ac ON ac.id = t.account_id AND ac.company_id = t.company_id AND ac.deleted_at IS NULL
WHERE t.type IN ('income', 'expense')
  AND t.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM operation_components oc WHERE oc.transaction_id = t.id LIMIT 1
  );

-- Anticipos de clientes como pasivo estimado del negocio
UPDATE accounts a
SET chart_account_id = COALESCE(
  (SELECT ca.id FROM chart_of_accounts ca
   WHERE ca.company_id = a.company_id AND ca.code = '2.1.2' LIMIT 1),
  a.chart_account_id
),
    updated_at = NOW()
WHERE a.deleted_at IS NULL
  AND a.type = 'other'
  AND lower(regexp_replace(a.name, '\\s+', ' ', 'g')) LIKE '%anticipo%cliente%';

-- -----------------------------------------------------------------------------
-- Retro-contabilización de histórico posted sin asiento (idempotente)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  c RECORD;
BEGIN
  FOR r IN
    SELECT t.id, COALESCE(t.posted_by, t.created_by, t.updated_by)::uuid AS who
    FROM transactions t
    WHERE t.status = 'posted'
      AND t.deleted_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM journal_entries je WHERE je.transaction_id = t.id)
  LOOP
    BEGIN
      PERFORM fn_post_journal_for_transaction(r.id, r.who);
    EXCEPTION WHEN others THEN
      RAISE WARNING 'Retro-post falló para transacción %: % %', r.id, SQLSTATE, SQLERRM;
    END;
  END LOOP;

  FOR c IN
    SELECT DISTINCT company_id FROM transactions WHERE status = 'posted' AND deleted_at IS NULL
  LOOP
    PERFORM update_account_balance(c.company_id);
  END LOOP;
END;
$$;
