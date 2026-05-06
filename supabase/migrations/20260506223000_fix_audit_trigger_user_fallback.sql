-- Evita que migraciones de mantenimiento fallen por audit_log.user_id NULL
-- cuando no existe auth.uid() en contexto de ejecución (CLI/maintenance).
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_log (company_id, table_name, record_id, action, old_values, new_values, user_id)
  VALUES (
    COALESCE(NEW.company_id, OLD.company_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    COALESCE(auth.uid(), NEW.updated_by, NEW.created_by, NEW.deleted_by, OLD.updated_by, OLD.created_by, OLD.deleted_by)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;
