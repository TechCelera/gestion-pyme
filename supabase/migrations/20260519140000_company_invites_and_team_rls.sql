-- Invitaciones a empresa + políticas para que admin gestione el equipo.

CREATE TABLE IF NOT EXISTS public.company_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'collaborator' CHECK (role IN ('admin', 'collaborator')),
  token VARCHAR(64) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES public.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_invites_company ON public.company_invites(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invites_token ON public.company_invites(token);

COMMENT ON TABLE public.company_invites IS 'Invitaciones pendientes para unirse a una empresa existente.';

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_invites_admin ON public.company_invites;
CREATE POLICY company_invites_admin ON public.company_invites
  FOR ALL
  USING (
    company_id IN (SELECT u.company_id FROM public.users u WHERE u.id = auth.uid())
    AND public.auth_user_is_admin()
  )
  WITH CHECK (
    company_id IN (SELECT u.company_id FROM public.users u WHERE u.id = auth.uid())
    AND public.auth_user_is_admin()
  );

-- Admin puede listar y editar usuarios de su empresa (no solo el propio registro).
DROP POLICY IF EXISTS users_select_company ON public.users;
CREATE POLICY users_select_company ON public.users
  FOR SELECT
  USING (
    company_id IN (SELECT u.company_id FROM public.users u WHERE u.id = auth.uid())
    AND public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS users_update_company_admin ON public.users;
CREATE POLICY users_update_company_admin ON public.users
  FOR UPDATE
  USING (
    company_id IN (SELECT u.company_id FROM public.users u WHERE u.id = auth.uid())
    AND public.auth_user_is_admin()
    AND id <> auth.uid()
  )
  WITH CHECK (
    company_id IN (SELECT u.company_id FROM public.users u WHERE u.id = auth.uid())
    AND public.auth_user_is_admin()
    AND id <> auth.uid()
  );

-- RPC público (solo datos mínimos) para pantalla de registro con invitación.
CREATE OR REPLACE FUNCTION public.get_company_invite_by_token(p_token TEXT)
RETURNS TABLE (
  email VARCHAR,
  full_name VARCHAR,
  company_name VARCHAR,
  expired BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.email,
    i.full_name,
    c.name AS company_name,
  (i.accepted_at IS NOT NULL OR i.expires_at < NOW()) AS expired
  FROM public.company_invites i
  JOIN public.companies c ON c.id = i.company_id
  WHERE i.token = p_token
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_company_invite_by_token IS
  'Datos de invitación para registro; no expone company_id ni token interno.';

-- Signup: unirse por invitación o crear empresa nueva.
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
