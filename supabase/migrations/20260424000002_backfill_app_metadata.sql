-- ============================================================================
-- MIGRACIÓN: Backfill app_metadata for existing auth.users
-- Fecha: 2026-04-24
-- Problema: Usuarios existentes tienen app_metadata vacío o sin company_id
--   causando que RLS policies fallen (500 errors)
-- Solución: Actualizar raw_app_meta_data con datos de public.users + public.companies
-- ============================================================================

-- Backfill en batches para manejar grandes cantidades de usuarios
-- Procesar usuarios donde app_metadata no tiene company_id
DO $$
DECLARE
  v_batch_size INTEGER := 100;
  v_updated_count INTEGER;
  v_total_updated INTEGER := 0;
BEGIN
  LOOP
    -- Actualizar un batch de usuarios
    -- Usar || (merge) para preservar keys existentes como 'provider'
    UPDATE auth.users u
    SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
          'company_id', pu.company_id,
          'role', pu.role,
          'is_active', pu.is_active,
          'country', COALESCE(c.country, 'AR')
        )
    FROM public.users pu
    LEFT JOIN public.companies c ON c.id = pu.company_id
    WHERE u.id = pu.id
      AND (u.raw_app_meta_data->>'company_id' IS NULL
           OR u.raw_app_meta_data = '{}'::jsonb
           OR u.raw_app_meta_data IS NULL)
      AND u.id IN (
        SELECT u2.id
        FROM auth.users u2
        JOIN public.users pu2 ON u2.id = pu2.id
        WHERE u2.raw_app_meta_data->>'company_id' IS NULL
             OR u2.raw_app_meta_data = '{}'::jsonb
             OR u2.raw_app_meta_data IS NULL
        LIMIT v_batch_size
      );

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    v_total_updated := v_total_updated + v_updated_count;

    -- Si no se actualizaron más registros, salir del loop
    EXIT WHEN v_updated_count = 0;

    -- Pequeña pausa entre batches para no saturar
    PERFORM pg_sleep(0.1);
  END LOOP;

  RAISE NOTICE 'Backfill completado: % usuarios actualizados', v_total_updated;
END;
$$;