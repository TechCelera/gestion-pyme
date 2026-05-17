-- ============================================================================
-- Reset operativo (desarrollo): tablero limpio de movimientos y maestros operativos.
-- Tras esto, aplicar 20260517150000_seed_operational_defaults_after_reset o entrar al dashboard (seed app).
-- ============================================================================

-- Triggers de negocio bloquean DELETE si el movimiento ya no está draft/pending.
ALTER TABLE operation_components DISABLE TRIGGER tr_operation_components_guard;

DELETE FROM journal_entry_lines;
DELETE FROM journal_entries;
DELETE FROM operation_components;

ALTER TABLE transactions DISABLE TRIGGER tr_transactions_soft_delete;
ALTER TABLE transactions DISABLE TRIGGER tr_transactions_audit;
DELETE FROM transactions;
ALTER TABLE transactions ENABLE TRIGGER tr_transactions_audit;
ALTER TABLE transactions ENABLE TRIGGER tr_transactions_soft_delete;

ALTER TABLE operation_components ENABLE TRIGGER tr_operation_components_guard;

ALTER TABLE accounts DISABLE TRIGGER tr_accounts_soft_delete;
DELETE FROM accounts;
ALTER TABLE accounts ENABLE TRIGGER tr_accounts_soft_delete;

ALTER TABLE categories DISABLE TRIGGER tr_categories_soft_delete;
DELETE FROM categories;
ALTER TABLE categories ENABLE TRIGGER tr_categories_soft_delete;

COMMENT ON TABLE accounts IS 'Cuentas operativas (caja, bancos). El usuario las crea; sin semilla automática.';
COMMENT ON TABLE categories IS 'Categorías ingreso/gasto. El usuario las crea; sin backfill automático.';
