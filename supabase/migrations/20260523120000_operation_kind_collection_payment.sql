-- ============================================================================
-- Subtipo de operación: sale / purchase / collection / payment
-- Cobro y pago sin línea P&L; venta/compra conservan categoría + componentes.
-- ============================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS operation_kind VARCHAR(20);

UPDATE transactions
SET operation_kind = 'sale'
WHERE type = 'income' AND operation_kind IS NULL;

UPDATE transactions
SET operation_kind = 'purchase'
WHERE type = 'expense' AND operation_kind IS NULL;

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_operation_kind_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_operation_kind_check CHECK (
    (type IN ('transfer', 'adjustment') AND operation_kind IS NULL)
    OR (type = 'income' AND operation_kind IN ('sale', 'collection'))
    OR (type = 'expense' AND operation_kind IN ('purchase', 'payment'))
  );

COMMENT ON COLUMN transactions.operation_kind IS
  'Subtipo de negocio: sale, purchase, collection, payment. NULL en transfer/adjustment.';

-- ---------------------------------------------------------------------------
-- Validación al salir de borrador
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validate_transaction_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_kind VARCHAR;
BEGIN
  v_kind := COALESCE(
    NEW.operation_kind,
    CASE
      WHEN NEW.type = 'income' THEN 'sale'
      WHEN NEW.type = 'expense' THEN 'purchase'
      ELSE NULL
    END
  );

  IF NEW.type IN ('income', 'expense')
     AND NEW.status NOT IN ('draft', 'cancelled') THEN
    IF v_kind IN ('sale', 'purchase') AND NEW.category_id IS NULL THEN
      RAISE EXCEPTION 'CATEGORY_REQUIRED_FOR_TYPE_%', NEW.type
        USING ERRCODE = 'check_violation';
    END IF;
    IF v_kind IN ('collection', 'payment') AND NEW.contact_id IS NULL THEN
      RAISE EXCEPTION 'CONTACT_REQUIRED_FOR_COLLECTION_PAYMENT'
        USING ERRCODE = 'check_violation';
    END IF;
    IF v_kind IN ('collection', 'payment') AND NEW.category_id IS NOT NULL THEN
      -- Cobro/pago no usan categoría P&L; forzar NULL al publicar
      NEW.category_id := NULL;
    END IF;
  END IF;

  IF NEW.type = 'transfer'
     AND NEW.status NOT IN ('draft', 'cancelled') THEN
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

-- ---------------------------------------------------------------------------
-- create_transaction: operation_kind + reglas categoría/contacto
-- (DROP firma previa: CREATE OR REPLACE con un parámetro más crea overload, no reemplaza)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_transaction(
  uuid,
  uuid,
  character varying,
  numeric,
  date,
  character varying,
  uuid,
  character varying,
  character varying,
  numeric,
  uuid,
  character varying,
  uuid,
  uuid,
  character varying,
  character varying,
  character varying,
  text
);

CREATE OR REPLACE FUNCTION public.create_transaction(
  p_company_id UUID,
  p_account_id UUID,
  p_type VARCHAR,
  p_amount NUMERIC,
  p_date DATE,
  p_description VARCHAR,
  p_category_id UUID DEFAULT NULL,
  p_method VARCHAR DEFAULT 'cash',
  p_currency VARCHAR DEFAULT 'USD',
  p_exchange_rate NUMERIC DEFAULT 1.000000,
  p_contact_id UUID DEFAULT NULL,
  p_contact_type VARCHAR DEFAULT NULL,
  p_source_account_id UUID DEFAULT NULL,
  p_destination_account_id UUID DEFAULT NULL,
  p_adjustment_reason VARCHAR DEFAULT NULL,
  p_document_type VARCHAR DEFAULT NULL,
  p_document_number VARCHAR DEFAULT NULL,
  p_attachment_url TEXT DEFAULT NULL,
  p_operation_kind VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_period_status VARCHAR;
  v_user_id UUID;
  v_kind VARCHAR;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT status INTO v_period_status
  FROM periods
  WHERE company_id = p_company_id
    AND year = EXTRACT(YEAR FROM p_date)
    AND month = EXTRACT(MONTH FROM p_date);

  IF v_period_status = 'closed' THEN
    RAISE EXCEPTION 'PERIOD_CLOSED: El período está cerrado. No se pueden crear transacciones.';
  END IF;

  v_kind := p_operation_kind;
  IF p_type = 'income' AND v_kind IS NULL THEN
    v_kind := 'sale';
  ELSIF p_type = 'expense' AND v_kind IS NULL THEN
    v_kind := 'purchase';
  END IF;

  IF p_type = 'transfer' THEN
    v_kind := NULL;
    IF p_source_account_id IS NULL OR p_destination_account_id IS NULL THEN
      RAISE EXCEPTION 'MISSING_ACCOUNTS: Las transferencias requieren cuenta origen y destino';
    END IF;
    IF p_source_account_id = p_destination_account_id THEN
      RAISE EXCEPTION 'SAME_ACCOUNT: La cuenta origen y destino deben ser diferentes';
    END IF;
  ELSIF p_type IN ('income', 'expense') THEN
    -- Borrador: categoría/contacto se validan al pasar a pending (fn_validate_transaction_refs)
    IF v_kind = 'collection' AND p_type <> 'income' THEN
      RAISE EXCEPTION 'INVALID_KIND_FOR_TYPE';
    END IF;
    IF v_kind = 'payment' AND p_type <> 'expense' THEN
      RAISE EXCEPTION 'INVALID_KIND_FOR_TYPE';
    END IF;
    IF v_kind = 'sale' AND p_type <> 'income' THEN
      RAISE EXCEPTION 'INVALID_KIND_FOR_TYPE';
    END IF;
    IF v_kind = 'purchase' AND p_type <> 'expense' THEN
      RAISE EXCEPTION 'INVALID_KIND_FOR_TYPE';
    END IF;
  ELSIF p_type = 'adjustment' THEN
    v_kind := NULL;
    IF p_adjustment_reason IS NULL THEN
      RAISE EXCEPTION 'MISSING_REASON: Los ajustes requieren motivo';
    END IF;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: El monto debe ser mayor a 0';
  END IF;

  INSERT INTO transactions (
    company_id,
    account_id,
    category_id,
    type,
    operation_kind,
    method,
    status,
    amount,
    currency,
    exchange_rate,
    date,
    description,
    contact_id,
    contact_type,
    source_account_id,
    destination_account_id,
    adjustment_reason,
    document_type,
    document_number,
    attachment_url,
    created_by,
    updated_by
  ) VALUES (
    p_company_id,
    p_account_id,
    CASE WHEN v_kind IN ('collection', 'payment') THEN NULL ELSE p_category_id END,
    p_type,
    v_kind,
    p_method,
    'draft',
    p_amount,
    p_currency,
    p_exchange_rate,
    p_date,
    p_description,
    p_contact_id,
    p_contact_type,
    p_source_account_id,
    p_destination_account_id,
    p_adjustment_reason,
    p_document_type,
    p_document_number,
    p_attachment_url,
    v_user_id,
    v_user_id
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;

COMMENT ON FUNCTION public.create_transaction(
  uuid,
  uuid,
  character varying,
  numeric,
  date,
  character varying,
  uuid,
  character varying,
  character varying,
  numeric,
  uuid,
  character varying,
  uuid,
  uuid,
  character varying,
  character varying,
  character varying,
  text,
  character varying
) IS 'Crea operación en borrador. operation_kind: sale, purchase, collection, payment.';

-- ---------------------------------------------------------------------------
-- set_operation_components: sin CxC en cobro/pago
-- ---------------------------------------------------------------------------
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
  v_kind VARCHAR;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT company_id INTO v_user_company FROM users WHERE id = auth.uid();
  SELECT id, company_id, status, type, amount, operation_kind, contact_id
    INTO txn
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

  v_kind := COALESCE(
    txn.operation_kind,
    CASE WHEN txn.type = 'income' THEN 'sale' ELSE 'purchase' END
  );

  DELETE FROM operation_components WHERE transaction_id = p_transaction_id;

  IF p_components IS NULL OR jsonb_typeof(p_components) <> 'array' THEN
    RAISE EXCEPTION 'COMPONENTS_PAYLOAD_INVALID';
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(p_components)
  LOOP
    v_tp := elem->>'component_type';
    v_sum := v_sum + (elem->>'amount')::numeric;

    IF v_kind IN ('collection', 'payment')
       AND v_tp IN ('client_receivable', 'supplier_payable') THEN
      RAISE EXCEPTION 'COMPONENT_TYPE_NOT_ALLOWED_FOR_KIND: %', v_kind;
    END IF;

    IF v_kind IN ('collection', 'payment')
       AND v_tp NOT IN ('operative_cash', 'operative_bank') THEN
      RAISE EXCEPTION 'COLLECTION_PAYMENT_REQUIRES_OPERATIVE_COMPONENT';
    END IF;

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
    RAISE EXCEPTION 'COMPONENTS_SUM_MISMATCH: suma % vs total %', v_sum, txn.amount;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- fn_post_journal_for_transaction: ramas collection / payment
-- ---------------------------------------------------------------------------
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
  v_kind VARCHAR;
  v_operative_sum NUMERIC;
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

    v_kind := COALESCE(
      txn.operation_kind,
      CASE WHEN txn.type = 'income' THEN 'sale' ELSE 'purchase' END
    );

    SELECT COUNT(*)::INT, COALESCE(SUM(oc.amount), 0)
      INTO v_cnt, v_sum
    FROM operation_components oc
    WHERE oc.transaction_id = p_transaction_id;

    IF v_cnt = 0 OR v_sum <> txn.amount THEN
      RAISE EXCEPTION 'COMPONENTS_INVALID: La suma de componentes debe ser igual al monto total';
    END IF;

    IF v_kind = 'collection' THEN
      IF txn.contact_id IS NULL THEN
        RAISE EXCEPTION 'MISSING_CONTACT_FOR_COLLECTION';
      END IF;
      SELECT ct.kind INTO v_ckind FROM contacts ct
      WHERE ct.id = txn.contact_id AND ct.company_id = txn.company_id;
      IF v_ckind IS NULL THEN
        RAISE EXCEPTION 'CONTACT_NOT_FOUND';
      END IF;
      IF v_ckind NOT IN ('client', 'both') THEN
        RAISE EXCEPTION 'CONTACT_KIND_MISMATCH: cobro requiere cliente';
      END IF;

      v_operative_sum := 0;
      FOR comp IN
        SELECT * FROM operation_components oc WHERE oc.transaction_id = p_transaction_id
      LOOP
        IF comp.component_type NOT IN ('operative_cash', 'operative_bank') THEN
          RAISE EXCEPTION 'INVALID_COMPONENT_FOR_COLLECTION';
        END IF;
        SELECT a.chart_account_id INTO v_wallet_chart FROM accounts a WHERE a.id = comp.account_id;
        INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
        VALUES (v_entry_id, v_wallet_chart, comp.account_id, NULL, comp.amount, 0);
        v_operative_sum := v_operative_sum + comp.amount;
      END LOOP;

      INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
      VALUES (v_entry_id, v_clients_ca, NULL, txn.contact_id, 0, v_operative_sum);

    ELSIF v_kind = 'payment' THEN
      IF txn.contact_id IS NULL THEN
        RAISE EXCEPTION 'MISSING_CONTACT_FOR_PAYMENT';
      END IF;
      SELECT ct.kind INTO v_ckind FROM contacts ct
      WHERE ct.id = txn.contact_id AND ct.company_id = txn.company_id;
      IF v_ckind IS NULL THEN
        RAISE EXCEPTION 'CONTACT_NOT_FOUND';
      END IF;
      IF v_ckind NOT IN ('provider', 'both') THEN
        RAISE EXCEPTION 'CONTACT_KIND_MISMATCH: pago requiere proveedor';
      END IF;

      INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
      VALUES (v_entry_id, v_suppliers_ca, NULL, txn.contact_id, txn.amount, 0);

      FOR comp IN
        SELECT * FROM operation_components oc WHERE oc.transaction_id = p_transaction_id
      LOOP
        IF comp.component_type NOT IN ('operative_cash', 'operative_bank') THEN
          RAISE EXCEPTION 'INVALID_COMPONENT_FOR_PAYMENT';
        END IF;
        SELECT a.chart_account_id INTO v_wallet_chart FROM accounts a WHERE a.id = comp.account_id;
        INSERT INTO journal_entry_lines (journal_entry_id, chart_account_id, operative_account_id, contact_id, debit, credit)
        VALUES (v_entry_id, v_wallet_chart, comp.account_id, NULL, 0, comp.amount);
      END LOOP;

    ELSE
      -- sale / purchase (comportamiento previo)
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

-- ---------------------------------------------------------------------------
-- Estado de resultados: solo venta y compra
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION rpc_reports_income_statement_period(
  p_company_id UUID,
  p_from DATE,
  p_to DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_income NUMERIC;
  v_total_expenses NUMERIC;
  v_breakdown JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.company_id = p_company_id
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT COALESCE(SUM(jel.credit - jel.debit), 0) INTO v_total_income
  FROM journal_entry_lines jel
  INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
  INNER JOIN transactions t ON t.id = je.transaction_id
  INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
  WHERE je.company_id = p_company_id
    AND t.company_id = p_company_id
    AND t.status = 'approved'
    AND t.deleted_at IS NULL
    AND je.entry_date >= p_from
    AND je.entry_date <= p_to
    AND coa.account_type = 'income'
    AND COALESCE(t.operation_kind, CASE WHEN t.type = 'income' THEN 'sale' END) = 'sale';

  SELECT COALESCE(SUM(jel.debit - jel.credit), 0) INTO v_total_expenses
  FROM journal_entry_lines jel
  INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
  INNER JOIN transactions t ON t.id = je.transaction_id
  INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
  WHERE je.company_id = p_company_id
    AND t.company_id = p_company_id
    AND t.status = 'approved'
    AND t.deleted_at IS NULL
    AND je.entry_date >= p_from
    AND je.entry_date <= p_to
    AND coa.account_type = 'expense'
    AND COALESCE(t.operation_kind, CASE WHEN t.type = 'expense' THEN 'purchase' END) = 'purchase';

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('category', cat, 'amount', amt) ORDER BY amt DESC),
    '[]'::jsonb
  ) INTO v_breakdown
  FROM (
    SELECT coa.name AS cat, SUM(jel.debit - jel.credit) AS amt
    FROM journal_entry_lines jel
    INNER JOIN journal_entries je ON je.id = jel.journal_entry_id
    INNER JOIN transactions t ON t.id = je.transaction_id
    INNER JOIN chart_of_accounts coa ON coa.id = jel.chart_account_id
    WHERE je.company_id = p_company_id
      AND t.company_id = p_company_id
      AND t.status = 'approved'
      AND t.deleted_at IS NULL
      AND je.entry_date >= p_from
      AND je.entry_date <= p_to
      AND coa.account_type = 'expense'
      AND COALESCE(t.operation_kind, CASE WHEN t.type = 'expense' THEN 'purchase' END) = 'purchase'
    GROUP BY coa.name
    ORDER BY amt DESC
    LIMIT 8
  ) sub;

  RETURN jsonb_build_object(
    'totalIncome', ROUND(v_total_income::numeric, 2),
    'totalExpenses', ROUND(v_total_expenses::numeric, 2),
    'expenseBreakdown', v_breakdown
  );
END;
$$;

COMMENT ON FUNCTION rpc_reports_income_statement_period(UUID, DATE, DATE) IS
  'Estado de resultados: solo ventas (sale) y compras (purchase); excluye cobros y pagos.';

-- ---------------------------------------------------------------------------
-- RPC listado / detalle: exponer operation_kind
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_transactions(UUID, VARCHAR[], VARCHAR[], DATE, DATE, UUID, UUID, UUID, VARCHAR, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_transactions(
  p_company_id UUID,
  p_status VARCHAR[] DEFAULT NULL,
  p_type VARCHAR[] DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL,
  p_search VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  account_id UUID,
  account_name VARCHAR,
  category_id UUID,
  category_name VARCHAR,
  type VARCHAR,
  operation_kind VARCHAR,
  status VARCHAR,
  method VARCHAR,
  amount NUMERIC,
  currency VARCHAR,
  exchange_rate NUMERIC,
  date DATE,
  description VARCHAR,
  contact_id UUID,
  contact_type VARCHAR,
  contact_name VARCHAR,
  source_account_id UUID,
  source_account_name VARCHAR,
  destination_account_id UUID,
  destination_account_name VARCHAR,
  adjustment_reason VARCHAR,
  document_type VARCHAR,
  document_number VARCHAR,
  attachment_url TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  creator_name VARCHAR,
  updated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  posted_by UUID,
  posted_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason VARCHAR,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH search_escape AS (
    SELECT
      CASE
        WHEN p_search IS NULL OR p_search = '' THEN NULL
        ELSE REPLACE(REPLACE(p_search, '%', '\%'), '_', '\_')
      END AS safe_search
  ),
  filtered_transactions AS (
    SELECT
      t.*,
      COUNT(*) OVER() AS total_count
    FROM transactions t
    CROSS JOIN search_escape se
    WHERE t.company_id = p_company_id
      AND t.deleted_at IS NULL
      AND (p_status IS NULL OR t.status = ANY(p_status))
      AND (p_type IS NULL OR t.type = ANY(p_type))
      AND (p_date_from IS NULL OR t.date >= p_date_from)
      AND (p_date_to IS NULL OR t.date <= p_date_to)
      AND (p_account_id IS NULL OR t.account_id = p_account_id)
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
      AND (p_contact_id IS NULL OR t.contact_id = p_contact_id)
      AND (se.safe_search IS NULL OR
           t.description ILIKE '%' || se.safe_search || '%' ESCAPE '\' OR
           COALESCE(t.document_number, '') ILIKE '%' || se.safe_search || '%' ESCAPE '\')
  )
  SELECT
    ft.id,
    ft.company_id,
    ft.account_id,
    a.name AS account_name,
    ft.category_id,
    c.name AS category_name,
    ft.type,
    ft.operation_kind,
    ft.status,
    ft.method,
    ft.amount,
    ft.currency,
    ft.exchange_rate,
    ft.date,
    ft.description,
    ft.contact_id,
    ft.contact_type,
    NULL::varchar AS contact_name,
    ft.source_account_id,
    sa.name AS source_account_name,
    ft.destination_account_id,
    da.name AS destination_account_name,
    ft.adjustment_reason,
    ft.document_type,
    ft.document_number,
    ft.attachment_url,
    ft.created_at,
    ft.created_by,
    u.full_name AS creator_name,
    ft.updated_at,
    ft.approved_by,
    ft.approved_at,
    ft.posted_by,
    ft.posted_at,
    ft.rejected_by,
    ft.rejected_at,
    ft.rejection_reason,
    ft.total_count
  FROM filtered_transactions ft
  LEFT JOIN accounts a ON ft.account_id = a.id
  LEFT JOIN categories c ON ft.category_id = c.id
  LEFT JOIN accounts sa ON ft.source_account_id = sa.id
  LEFT JOIN accounts da ON ft.destination_account_id = da.id
  LEFT JOIN users u ON ft.created_by = u.id
  ORDER BY ft.date DESC, ft.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

DROP FUNCTION IF EXISTS get_transaction_by_id(UUID);

CREATE OR REPLACE FUNCTION get_transaction_by_id(p_transaction_id UUID)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  account_id UUID,
  account_name VARCHAR,
  category_id UUID,
  category_name VARCHAR,
  type VARCHAR,
  operation_kind VARCHAR,
  status VARCHAR,
  method VARCHAR,
  amount NUMERIC,
  currency VARCHAR,
  exchange_rate NUMERIC,
  date DATE,
  description VARCHAR,
  contact_id UUID,
  contact_type VARCHAR,
  contact_name VARCHAR,
  source_account_id UUID,
  source_account_name VARCHAR,
  destination_account_id UUID,
  destination_account_name VARCHAR,
  adjustment_reason VARCHAR,
  document_type VARCHAR,
  document_number VARCHAR,
  attachment_url TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  creator_name VARCHAR,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  approved_by UUID,
  approver_name VARCHAR,
  approved_at TIMESTAMPTZ,
  posted_by UUID,
  poster_name VARCHAR,
  posted_at TIMESTAMPTZ,
  rejected_by UUID,
  rejecter_name VARCHAR,
  rejected_at TIMESTAMPTZ,
  rejection_reason VARCHAR
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    t.id,
    t.company_id,
    t.account_id,
    a.name AS account_name,
    t.category_id,
    c.name AS category_name,
    t.type,
    t.operation_kind,
    t.status,
    t.method,
    t.amount,
    t.currency,
    t.exchange_rate,
    t.date,
    t.description,
    t.contact_id,
    t.contact_type,
    NULL::varchar AS contact_name,
    t.source_account_id,
    sa.name AS source_account_name,
    t.destination_account_id,
    da.name AS destination_account_name,
    t.adjustment_reason,
    t.document_type,
    t.document_number,
    t.attachment_url,
    t.created_at,
    t.created_by,
    uc.full_name AS creator_name,
    t.updated_at,
    t.updated_by,
    t.approved_by,
    ua.full_name AS approver_name,
    t.approved_at,
    t.posted_by,
    up.full_name AS poster_name,
    t.posted_at,
    t.rejected_by,
    ur.full_name AS rejecter_name,
    t.rejected_at,
    t.rejection_reason
  FROM transactions t
  LEFT JOIN accounts a ON t.account_id = a.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN accounts sa ON t.source_account_id = sa.id
  LEFT JOIN accounts da ON t.destination_account_id = da.id
  LEFT JOIN users uc ON t.created_by = uc.id
  LEFT JOIN users ua ON t.approved_by = ua.id
  LEFT JOIN users up ON t.posted_by = up.id
  LEFT JOIN users ur ON t.rejected_by = ur.id
  WHERE t.id = p_transaction_id
    AND t.deleted_at IS NULL;
$$;
