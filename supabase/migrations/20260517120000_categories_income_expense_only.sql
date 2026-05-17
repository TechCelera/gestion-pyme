-- Categorías: solo ingreso | gasto (alineado con movimientos income/expense)
-- En desarrollo: migrar subtipos contables legacy a 'expense'

-- Primero quitar el CHECK legacy (cost, admin_expense, …); si no, UPDATE a 'expense' falla.
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;

UPDATE categories
SET
  type = 'expense',
  updated_at = now()
WHERE type NOT IN ('income', 'expense');

ALTER TABLE categories
  ADD CONSTRAINT categories_type_check CHECK (type IN ('income', 'expense'));

COMMENT ON COLUMN categories.type IS 'income = ingreso, expense = gasto (clasificación para movimientos e informes).';
