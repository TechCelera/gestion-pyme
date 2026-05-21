-- RPC solo para desarrollo: tablero operativo en cero (movimientos, contactos, cuentas, categorías).
-- Invocar desde scripts/wipe-dev-data.mjs con service_role. No usar en producción.

CREATE OR REPLACE FUNCTION public.dev_wipe_operational_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jel INT;
  v_je INT;
  v_oc INT;
  v_tx INT;
  v_ct INT;
  v_acc INT;
  v_cat INT;
BEGIN
  ALTER TABLE operation_components DISABLE TRIGGER tr_operation_components_guard;

  DELETE FROM journal_entry_lines WHERE true;
  GET DIAGNOSTICS v_jel = ROW_COUNT;

  DELETE FROM journal_entries WHERE true;
  GET DIAGNOSTICS v_je = ROW_COUNT;

  DELETE FROM operation_components WHERE true;
  GET DIAGNOSTICS v_oc = ROW_COUNT;

  ALTER TABLE transactions DISABLE TRIGGER tr_transactions_soft_delete;
  ALTER TABLE transactions DISABLE TRIGGER tr_transactions_audit;
  DELETE FROM transactions WHERE true;
  GET DIAGNOSTICS v_tx = ROW_COUNT;
  ALTER TABLE transactions ENABLE TRIGGER tr_transactions_audit;
  ALTER TABLE transactions ENABLE TRIGGER tr_transactions_soft_delete;

  ALTER TABLE operation_components ENABLE TRIGGER tr_operation_components_guard;

  DELETE FROM contacts WHERE true;
  GET DIAGNOSTICS v_ct = ROW_COUNT;

  ALTER TABLE accounts DISABLE TRIGGER tr_accounts_soft_delete;
  DELETE FROM accounts WHERE true;
  GET DIAGNOSTICS v_acc = ROW_COUNT;
  ALTER TABLE accounts ENABLE TRIGGER tr_accounts_soft_delete;

  ALTER TABLE categories DISABLE TRIGGER tr_categories_soft_delete;
  DELETE FROM categories WHERE true;
  GET DIAGNOSTICS v_cat = ROW_COUNT;
  ALTER TABLE categories ENABLE TRIGGER tr_categories_soft_delete;

  RETURN jsonb_build_object(
    'journal_entry_lines', v_jel,
    'journal_entries', v_je,
    'operation_components', v_oc,
    'transactions', v_tx,
    'contacts', v_ct,
    'accounts', v_acc,
    'categories', v_cat
  );
END;
$$;

REVOKE ALL ON FUNCTION public.dev_wipe_operational_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dev_wipe_operational_data() TO service_role;

COMMENT ON FUNCTION public.dev_wipe_operational_data IS
  'Desarrollo: borra movimientos, contactos, cuentas y categorías. Ejecutar vía service_role (wipe:dev).';
