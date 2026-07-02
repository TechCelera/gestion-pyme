-- Signup: operating_profile opcional en raw_user_meta_data (default si falta o inválido).
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
  v_operating_profile TEXT;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa');
  v_country := COALESCE(NEW.raw_user_meta_data->>'country', 'AR');
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
