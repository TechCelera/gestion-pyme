-- ============================================================================
-- Listo para prueba con cliente: bootstrap al registrarse, validaciones suaves
-- en borrador, montos positivos y coherencia del diario.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Montos siempre positivos en operaciones
-- ---------------------------------------------------------------------------
UPDATE transactions
SET amount = ABS(amount)
WHERE amount < 0 AND deleted_at IS NULL;

UPDATE transactions
SET amount = 0.01
WHERE amount = 0 AND deleted_at IS NULL;

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_amount_positive;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0);

-- ---------------------------------------------------------------------------
-- 2) Validación de operaciones: borradores incompletos permitidos
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
-- 3) Líneas de diario: cuenta del plan de la misma empresa que el asiento
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validate_journal_line_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT je.company_id INTO v_company_id
  FROM journal_entries je
  WHERE je.id = NEW.journal_entry_id;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'JOURNAL_LINE_ENTRY_NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM chart_of_accounts coa
    WHERE coa.id = NEW.chart_account_id
      AND coa.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'JOURNAL_LINE_CHART_ACCOUNT_TENANT_MISMATCH';
  END IF;

  IF NEW.operative_account_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM accounts a
    WHERE a.id = NEW.operative_account_id
      AND a.company_id = v_company_id
      AND a.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'JOURNAL_LINE_OPERATIVE_ACCOUNT_TENANT_MISMATCH';
  END IF;

  IF NEW.contact_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM contacts c
    WHERE c.id = NEW.contact_id
      AND c.company_id = v_company_id
      AND c.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'JOURNAL_LINE_CONTACT_TENANT_MISMATCH';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_journal_line_tenant ON journal_entry_lines;
CREATE TRIGGER tr_validate_journal_line_tenant
  BEFORE INSERT OR UPDATE ON journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_journal_line_tenant();

-- ---------------------------------------------------------------------------
-- 4) Período abierto del mes en curso (evita bloqueo al primer movimiento)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_ensure_open_period(
  p_company_id UUID,
  p_reference DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO periods (company_id, year, month, status)
  VALUES (
    p_company_id,
    EXTRACT(YEAR FROM p_reference)::INTEGER,
    EXTRACT(MONTH FROM p_reference)::INTEGER,
    'open'
  )
  ON CONFLICT (company_id, year, month) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.fn_ensure_open_period(UUID, DATE) IS
  'Garantiza período contable abierto para el mes de referencia (idempotente).';

-- ---------------------------------------------------------------------------
-- 5) Bootstrap operativo por país (plan + cuentas + categorías + período)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_bootstrap_company_operational(
  p_company_id UUID,
  p_country TEXT DEFAULT 'AR'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_country TEXT := COALESCE(NULLIF(TRIM(p_country), ''), 'AR');
BEGIN
  PERFORM public.fn_seed_company_chart_accounts(p_company_id);
  PERFORM public.fn_ensure_open_period(p_company_id, CURRENT_DATE);

  INSERT INTO accounts (company_id, name, type, currency, balance)
  SELECT p_company_id, da.name, da.type, da.currency, 0
  FROM (
    VALUES
      ('AR', 'Caja', 'cash', 'ARS'),
      ('AR', 'Cuenta Corriente', 'bank', 'ARS'),
      ('AR', 'Cuenta de Ahorros', 'bank', 'ARS'),
      ('CO', 'Caja', 'cash', 'COP'),
      ('CO', 'Cuenta Corriente', 'bank', 'COP'),
      ('CO', 'Cuenta de Ahorros', 'bank', 'COP')
  ) AS da(country, name, type, currency)
  WHERE da.country = v_country
    AND NOT EXISTS (
      SELECT 1
      FROM accounts existing
      WHERE existing.company_id = p_company_id
        AND existing.name = da.name
        AND existing.deleted_at IS NULL
    );

  INSERT INTO categories (company_id, name, type)
  SELECT p_company_id, dc.name, dc.type
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
  ) AS dc(country, name, type)
  WHERE dc.country = v_country
    AND NOT EXISTS (
      SELECT 1
      FROM categories existing
      WHERE existing.company_id = p_company_id
        AND existing.name = dc.name
        AND existing.deleted_at IS NULL
    );
END;
$$;

COMMENT ON FUNCTION public.fn_bootstrap_company_operational(UUID, TEXT) IS
  'Semilla idempotente: plan de cuentas, período abierto, cuentas y categorías por país.';

-- Empresas existentes sin cuentas (p. ej. creadas antes de esta migración)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT c.id AS company_id, COALESCE(c.country, 'AR') AS country
    FROM companies c
    WHERE c.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM accounts a
        WHERE a.company_id = c.id AND a.deleted_at IS NULL
        LIMIT 1
      )
  LOOP
    PERFORM public.fn_bootstrap_company_operational(rec.company_id, rec.country);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 6) Recalcular saldos operativos (soporte si algo quedó desfasado)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_reconcile_company_balances(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_company_id IS DISTINCT FROM public.auth_user_company_id()
     AND NOT public.auth_user_is_admin() THEN
    RAISE EXCEPTION 'RECONCILE_BALANCES_FORBIDDEN';
  END IF;

  PERFORM public.update_account_balance(p_company_id);
END;
$$;

COMMENT ON FUNCTION public.fn_reconcile_company_balances(UUID) IS
  'Recalcula saldos de cuentas operativas desde el diario (admin de la empresa).';

REVOKE ALL ON FUNCTION public.fn_reconcile_company_balances(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_reconcile_company_balances(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7) Signup: empresa nueva sale con datos listos para operar
-- ---------------------------------------------------------------------------
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
  v_invite_token TEXT;
  v_invite_email TEXT;
  v_invite_full_name TEXT;
  v_role TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');
  v_country := COALESCE(NEW.raw_user_meta_data->>'country', 'AR');
  v_invite_token := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'invite_token', '')), '');

  IF v_invite_token IS NOT NULL THEN
    SELECT i.company_id, i.email, i.full_name, i.role, c.country
    INTO v_company_id, v_invite_email, v_invite_full_name, v_role, v_country
    FROM public.company_invites i
    JOIN public.companies c ON c.id = i.company_id
    WHERE i.token = v_invite_token
      AND i.accepted_at IS NULL
      AND i.expires_at >= NOW()
    LIMIT 1;

    IF v_company_id IS NULL THEN
      RAISE EXCEPTION 'INVITE_INVALID: La invitación no existe o ya venció';
    END IF;

    IF LOWER(TRIM(NEW.email)) <> LOWER(TRIM(v_invite_email)) THEN
      RAISE EXCEPTION 'INVITE_EMAIL_MISMATCH: Usá el mismo correo de la invitación';
    END IF;

    v_full_name := COALESCE(NULLIF(TRIM(v_full_name), 'Usuario'), v_invite_full_name);

    INSERT INTO public.users (id, company_id, email, full_name, role, is_active)
    VALUES (NEW.id, v_company_id, NEW.email, v_full_name, v_role, true);

    UPDATE public.company_invites
    SET accepted_at = NOW()
    WHERE token = v_invite_token;

    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'company_id', v_company_id,
        'role', v_role,
        'is_active', true,
        'country', v_country
      )
    WHERE id = NEW.id;

    RETURN NEW;
  END IF;

  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa');

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

  INSERT INTO public.users (id, company_id, email, full_name, role, is_active)
  VALUES (NEW.id, v_company_id, NEW.email, v_full_name, 'admin', true);

  PERFORM public.fn_bootstrap_company_operational(v_company_id, v_country);

  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
      'company_id', v_company_id,
      'role', 'admin',
      'is_active', true,
      'country', v_country
    )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;
