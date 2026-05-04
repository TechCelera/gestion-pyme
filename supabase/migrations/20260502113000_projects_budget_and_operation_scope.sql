-- ============================================================================
-- MIGRACIÓN: Proyectos jerárquicos + alcance de operación + control presupuesto
-- Fecha: 2026-05-02
-- ============================================================================

-- 1) Tabla de proyectos (padre-hijo)
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id),
  parent_project_id uuid REFERENCES projects(id),
  name varchar(120) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  budget_amount numeric(15,2) NOT NULL DEFAULT 0 CHECK (budget_amount >= 0),
  start_date date,
  end_date date,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT projects_dates_valid CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
);

CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_unique_name_per_parent
  ON projects(company_id, COALESCE(parent_project_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
  WHERE deleted_at IS NULL;

-- 2) Extensiones sobre transactions (operaciones)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id),
  ADD COLUMN IF NOT EXISTS fund_owner varchar(20) NOT NULL DEFAULT 'company'
    CHECK (fund_owner IN ('company', 'client_advance')),
  ADD COLUMN IF NOT EXISTS requires_budget_approval boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS budget_approved_by uuid,
  ADD COLUMN IF NOT EXISTS budget_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS budget_approval_note varchar(500);

CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_transactions_requires_budget_approval
  ON transactions(company_id, requires_budget_approval, status);

-- 3) Normalización de caja única (Caja Principal -> Caja)
UPDATE accounts
SET name = 'Caja'
WHERE deleted_at IS NULL
  AND lower(regexp_replace(name, '\s+', ' ', 'g')) IN ('caja principal', 'caja ppal', 'caja general');

-- Soft dedupe: si quedaron múltiples "Caja" activas por empresa, mantener la más antigua
WITH ranked_cash AS (
  SELECT
    id,
    company_id,
    row_number() OVER (PARTITION BY company_id ORDER BY created_at, id) AS rn
  FROM accounts
  WHERE deleted_at IS NULL
    AND lower(name) = 'caja'
)
UPDATE accounts a
SET deleted_at = now()
FROM ranked_cash rc
WHERE a.id = rc.id
  AND rc.rn > 1;

-- 4) Asegurar cuenta contable de anticipo de clientes por empresa
INSERT INTO accounts (company_id, name, type, currency, balance)
SELECT c.id, 'Anticipo de Clientes', 'other', COALESCE(c.currency, 'ARS'), 0
FROM companies c
WHERE NOT EXISTS (
  SELECT 1
  FROM accounts a
  WHERE a.company_id = c.id
    AND lower(a.name) = 'anticipo de clientes'
    AND a.deleted_at IS NULL
);

-- 5) Crear proyecto general por empresa (no borrable por UX, manejado en app)
INSERT INTO projects (company_id, parent_project_id, name, status, budget_amount)
SELECT c.id, NULL, 'General Empresa', 'active', 0
FROM companies c
WHERE NOT EXISTS (
  SELECT 1
  FROM projects p
  WHERE p.company_id = c.id
    AND p.parent_project_id IS NULL
    AND lower(p.name) = 'general empresa'
    AND p.deleted_at IS NULL
);

-- 6) RLS básica para proyectos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_company_isolation ON projects;
CREATE POLICY projects_company_isolation ON projects
  FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
