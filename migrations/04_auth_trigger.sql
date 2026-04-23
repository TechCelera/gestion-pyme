-- Trigger: Crear empresa y usuario automáticamente al registrarse
-- Ejecutar en SQL Editor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_id uuid;
  user_full_name text;
  company_name text;
BEGIN
  -- Extraer metadata del JWT
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  company_name := NEW.raw_user_meta_data->>'company_name';
  
  -- Si no hay metadata, usar defaults
  IF user_full_name IS NULL THEN
    user_full_name := split_part(NEW.email, '@', 1);
  END IF;
  
  IF company_name IS NULL THEN
    company_name := 'Empresa ' || user_full_name;
  END IF;

  -- 1. Crear empresa
  INSERT INTO public.companies (name, currency)
  VALUES (company_name, 'USD')
  RETURNING id INTO company_id;

  -- 2. Crear usuario en nuestra tabla
  INSERT INTO public.users (id, company_id, email, full_name, role, is_active)
  VALUES (NEW.id, company_id, NEW.email, user_full_name, 'superadmin', true);

  -- 3. Actualizar metadata del auth.user con company_id
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('company_id', company_id)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verificar que existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';