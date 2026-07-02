-- Restaura signup/invitaciones con roles canónicos y operating_profile.
-- La migración 20260701140100 simplificó el trigger y reintrodujo 'admin_finanzas',
-- incompatible con roles canónicos ('admin' / 'collaborator').
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
  v_operating_profile TEXT;
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
  v_operating_profile := COALESCE(NEW.raw_user_meta_data->>'operating_profile', 'default');
  IF v_operating_profile NOT IN ('default', 'distribuidora') THEN
    v_operating_profile := 'default';
  END IF;

  INSERT INTO companies (name, currency, country, operating_profile)
  VALUES (
    v_company_name,
    CASE v_country
      WHEN 'CO' THEN 'COP'
      ELSE 'ARS'
    END,
    v_country,
    v_operating_profile
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

COMMENT ON FUNCTION public.handle_new_user IS
  'Signup: crea empresa con operating_profile o une por invitación; usa roles canónicos.';
