-- ============================================================================
-- MIGRACIÓN: Fix signup trigger - add back app_metadata update
-- Fecha: 2026-04-24
-- Problema: El trigger anterior no actualiza raw_app_meta_data causando que
--   RLS policies que dependen de app_metadata.company_id fallen con 500
-- Solución: Recrear la función para incluir la actualización de app_metadata
-- ============================================================================

-- 1. Recrear la función handle_new_user() con actualización de app_metadata
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
  -- Obtener metadata del registro
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario');
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mi Empresa');
  v_country := COALESCE(NEW.raw_user_meta_data->>'country', 'AR');

  -- Crear la empresa
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

  -- Crear el usuario asociado a la empresa
  INSERT INTO users (id, company_id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    v_company_id,
    NEW.email,
    v_full_name,
    'admin_finanzas',
    true
  );

  -- Actualizar app_metadata con company_id, role, is_active y country
  -- Esto es CRÍTICO para que las políticas RLS basadas en auth.jwt() funcionen
  -- Usamos || (merge) para preservar keys existentes como 'provider' de OAuth
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
        'company_id', v_company_id,
        'role', 'admin_finanzas',
        'is_active', true,
        'country', v_country
      )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- 2. Recrear el trigger con cláusula FOR EACH ROW explícita
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentario
COMMENT ON FUNCTION public.handle_new_user IS 'Trigger que crea empresa y usuario al registrar un nuevo usuario. Actualiza app_metadata con company_id, role, is_active y country para que las políticas RLS funcionen correctamente.';