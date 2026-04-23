-- GESTION PYME PRO - Tablas y Triggers (sin RLS)
-- Las políticas RLS deben agregarse manualmente en Dashboard

-- Tablas
CREATE TABLE IF NOT EXISTS companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(100) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  email varchar(255) NOT NULL,
  full_name varchar(100) NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'vendedor' CHECK (role IN ('superadmin', 'admin_finanzas', 'responsable', 'vendedor')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  name varchar(100) NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('cash', 'bank', 'other')),
  currency varchar(3) NOT NULL DEFAULT 'USD',
  balance numeric(15,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  name varchar(100) NOT NULL,
  type varchar(25) NOT NULL CHECK (type IN ('income', 'cost', 'admin_expense', 'commercial_expense', 'financial_expense')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  account_id uuid NOT NULL REFERENCES accounts(id),
  category_id uuid NOT NULL REFERENCES categories(id),
  type varchar(10) NOT NULL CHECK (type IN ('income', 'expense')),
  method varchar(10) NOT NULL CHECK (method IN ('accrual', 'cash')),
  amount numeric(15,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  exchange_rate numeric(10,6),
  date date NOT NULL,
  description varchar(500) NOT NULL,
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE IF NOT EXISTS periods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  status varchar(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_by uuid,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id, year, month)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  table_name varchar(50) NOT NULL,
  record_id uuid NOT NULL,
  action varchar(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE')),
  old_values jsonb,
  new_values jsonb,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Soft delete function
CREATE OR REPLACE FUNCTION public.fn_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.deleted_at = NOW();
  NEW.deleted_by = auth.uid();
  RETURN NEW;
END;
$$;

-- Soft delete triggers
CREATE TRIGGER tr_accounts_soft_delete
  BEFORE DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();

CREATE TRIGGER tr_categories_soft_delete
  BEFORE DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();

CREATE TRIGGER tr_transactions_soft_delete
  BEFORE DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_soft_delete();

-- Audit log function
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
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tr_transactions_audit
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Period closing check
CREATE OR REPLACE FUNCTION public.fn_check_period_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status VARCHAR;
BEGIN
  SELECT status INTO v_status
  FROM periods
  WHERE company_id = NEW.company_id
    AND year = EXTRACT(YEAR FROM NEW.date)
    AND month = EXTRACT(MONTH FROM NEW.date);

  IF v_status = 'closed' THEN
    RAISE EXCEPTION 'Periodo cerrado: no se pueden modificar transacciones (año: %, mes: %)', 
      EXTRACT(YEAR FROM NEW.date), EXTRACT(MONTH FROM NEW.date);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_check_period_closed
  BEFORE INSERT OR UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_period_closed();