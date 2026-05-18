-- Canonical tenant roles in DB: admin | collaborator (aligned with src/lib/auth/roles.ts).
-- Legacy slugs (admin_finanzas, vendedor, …) are migrated once; RLS uses auth_user_is_admin().

-- 1) Drop legacy constraint before rewriting role values
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2) Map legacy slugs → canonical
UPDATE public.users
SET role = 'admin'
WHERE role IN ('superadmin', 'admin_finanzas');

UPDATE public.users
SET role = 'collaborator'
WHERE role IN ('vendedor', 'responsable');

-- 3) Constraint + default
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'collaborator'));

ALTER TABLE public.users
  ALTER COLUMN role SET DEFAULT 'admin';

COMMENT ON COLUMN public.users.role IS
  'Tenant role: admin (Administrador) | collaborator (Colaborador). Product labels in app; RLS via auth_user_is_admin().';

-- 4) Sync auth.users app_metadata.role with public.users
UPDATE auth.users au
SET raw_app_meta_data = COALESCE(au.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', u.role)
FROM public.users u
WHERE au.id = u.id;

-- 5) RLS helper (single source of truth for finance-admin policies)
CREATE OR REPLACE FUNCTION public.auth_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND u.is_active = true
  );
$$;

COMMENT ON FUNCTION public.auth_user_is_admin() IS
  'True when the authenticated user is an active tenant admin (canonical role admin).';

-- 6) Signup: company creator is admin (canonical slug)
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

  INSERT INTO users (id, company_id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    v_full_name,
    'admin',
    true
  );

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

-- 7) transactions RLS — replace legacy role lists
DROP POLICY IF EXISTS transactions_update_draft ON transactions;
CREATE POLICY transactions_update_draft ON transactions
  FOR UPDATE
  USING (
    status = 'draft'
    AND company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    AND (
      created_by = auth.uid()
      OR public.auth_user_is_admin()
    )
  );

DROP POLICY IF EXISTS transactions_approve ON transactions;
CREATE POLICY transactions_approve ON transactions
  FOR UPDATE
  USING (
    status = 'pending'
    AND company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    AND public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS transactions_delete ON transactions;
CREATE POLICY transactions_delete ON transactions
  FOR DELETE
  USING (
    status = 'draft'
    AND company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    AND (
      created_by = auth.uid()
      OR public.auth_user_is_admin()
    )
  );

DROP POLICY IF EXISTS transactions_update_rejected ON transactions;
CREATE POLICY transactions_update_rejected ON transactions
  FOR UPDATE
  USING (
    status = 'rejected'
    AND company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    AND (
      created_by = auth.uid()
      OR public.auth_user_is_admin()
    )
  );

DROP POLICY IF EXISTS transactions_budget_exemption_update ON transactions;
CREATE POLICY transactions_budget_exemption_update ON transactions
  FOR UPDATE
  USING (
    status = 'approved'
    AND COALESCE(requires_budget_approval, false) = true
    AND budget_approved_by IS NULL
    AND company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
    AND public.auth_user_is_admin()
  )
  WITH CHECK (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
  );

-- 8) chart_of_accounts modify
DROP POLICY IF EXISTS chart_of_accounts_modify ON chart_of_accounts;
CREATE POLICY chart_of_accounts_modify ON chart_of_accounts
  FOR ALL
  USING (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
    AND public.auth_user_is_admin()
  )
  WITH CHECK (
    company_id IN (SELECT users.company_id FROM users WHERE users.id = auth.uid())
    AND public.auth_user_is_admin()
  );
