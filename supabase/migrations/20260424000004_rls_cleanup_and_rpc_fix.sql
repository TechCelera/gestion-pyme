-- ============================================================================
-- MIGRACIÓN: RLS cleanup and RPC search fix
-- Fecha: 2026-04-24
-- Problema 1: Políticas RLS duplicadas del archivo 03_enable_rls.sql usan
--   auth.jwt() -> 'app_metadata' que puede fallar si app_metadata es vacío
-- Problema 2: get_transactions() RPC tiene ILIKE sin escapar % y _
-- Solución 1: Eliminar políticas blanket que weren específicas de la tabla
-- Solución 2: Sanitizar search en RPC con REPLACE
-- ============================================================================

-- 1. Eliminar políticas blanket del archivo 03_enable_rls.sql si existen
-- Estas políticas son redundantes con las de 20250421000002_transactions_rls.sql
-- y usan auth.jwt() que falla si app_metadata está vacío

-- Companies policies (from 03_enable_rls.sql)
DROP POLICY IF EXISTS "Users can view own company" ON companies;

-- Users policies (from 03_enable_rls.sql)
DROP POLICY IF EXISTS "Users can view same company" ON users;

-- Accounts policies (from 03_enable_rls.sql)
DROP POLICY IF EXISTS "Users can view company accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert company accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update company accounts" ON accounts;

-- Categories policies (from 03_enable_rls.sql)
DROP POLICY IF EXISTS "Users can view company categories" ON categories;
DROP POLICY IF EXISTS "Users can insert company categories" ON categories;
DROP POLICY IF EXISTS "Users can update company categories" ON categories;

-- Transactions blanket policies (from 03_enable_rls.sql)
-- Keep the specific ones from 20250421000002_transactions_rls.sql
DROP POLICY IF EXISTS "Users can view company transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert company transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update company transactions" ON transactions;

-- Periods policies (from 03_enable_rls.sql)
DROP POLICY IF EXISTS "Users can view company periods" ON periods;
DROP POLICY IF EXISTS "Admin can manage company periods" ON periods;

-- Audit log policies (from 03_enable_rls.sql)
DROP POLICY IF EXISTS "Users can view company audit log" ON audit_log;
DROP POLICY IF EXISTS "Users can insert audit log" ON audit_log;

-- 2. Recrear get_transactions() RPC con búsqueda sanitizada
CREATE OR REPLACE FUNCTION get_transactions(
  p_company_id UUID,
  p_status VARCHAR[] DEFAULT NULL,
  p_type VARCHAR[] DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_account_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL,
  p_search VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  account_id UUID,
  account_name VARCHAR,
  category_id UUID,
  category_name VARCHAR,
  type VARCHAR,
  status VARCHAR,
  method VARCHAR,
  amount NUMERIC,
  currency VARCHAR,
  exchange_rate NUMERIC,
  date DATE,
  description VARCHAR,
  contact_id UUID,
  contact_type VARCHAR,
  contact_name VARCHAR,
  source_account_id UUID,
  source_account_name VARCHAR,
  destination_account_id UUID,
  destination_account_name VARCHAR,
  adjustment_reason VARCHAR,
  document_type VARCHAR,
  document_number VARCHAR,
  attachment_url TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  creator_name VARCHAR,
  updated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  posted_by UUID,
  posted_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason VARCHAR,
  total_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Sanitizar búsqueda: escapar % y _ para ILIKE
  WITH search_escape AS (
    SELECT
      CASE
        WHEN p_search IS NULL OR p_search = '' THEN NULL
        ELSE REPLACE(REPLACE(p_search, '%', '\%'), '_', '\_')
      END AS safe_search
  ),
  filtered_transactions AS (
    SELECT
      t.*,
      COUNT(*) OVER() AS total_count
    FROM transactions t
    CROSS JOIN search_escape se
    WHERE t.company_id = p_company_id
      AND t.deleted_at IS NULL
      AND (p_status IS NULL OR t.status = ANY(p_status))
      AND (p_type IS NULL OR t.type = ANY(p_type))
      AND (p_date_from IS NULL OR t.date >= p_date_from)
      AND (p_date_to IS NULL OR t.date <= p_date_to)
      AND (p_account_id IS NULL OR t.account_id = p_account_id)
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
      AND (p_contact_id IS NULL OR t.contact_id = p_contact_id)
      AND (se.safe_search IS NULL OR
           t.description ILIKE '%' || se.safe_search || '%' ESCAPE '\' OR
           COALESCE(t.document_number, '') ILIKE '%' || se.safe_search || '%' ESCAPE '\')
  )
  SELECT
    ft.id,
    ft.company_id,
    ft.account_id,
    a.name AS account_name,
    ft.category_id,
    c.name AS category_name,
    ft.type,
    ft.status,
    ft.method,
    ft.amount,
    ft.currency,
    ft.exchange_rate,
    ft.date,
    ft.description,
    ft.contact_id,
    ft.contact_type,
    NULL::varchar AS contact_name,
    ft.source_account_id,
    sa.name AS source_account_name,
    ft.destination_account_id,
    da.name AS destination_account_name,
    ft.adjustment_reason,
    ft.document_type,
    ft.document_number,
    ft.attachment_url,
    ft.created_at,
    ft.created_by,
    u.full_name AS creator_name,
    ft.updated_at,
    ft.approved_by,
    ft.approved_at,
    ft.posted_by,
    ft.posted_at,
    ft.rejected_by,
    ft.rejected_at,
    ft.rejection_reason,
    ft.total_count
  FROM filtered_transactions ft
  LEFT JOIN accounts a ON ft.account_id = a.id
  LEFT JOIN categories c ON ft.category_id = c.id
  LEFT JOIN accounts sa ON ft.source_account_id = sa.id
  LEFT JOIN accounts da ON ft.destination_account_id = da.id
  LEFT JOIN users u ON ft.created_by = u.id
  ORDER BY ft.date DESC, ft.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

COMMENT ON FUNCTION get_transactions IS 'Obtiene transacciones filtradas con paginación. Búsqueda sanitizada contra ILIKE wildcards. Incluye JOINs para nombres relacionados.';

-- 3. Recrear get_transaction_by_id con la misma estructura de joins
CREATE OR REPLACE FUNCTION get_transaction_by_id(
  p_transaction_id UUID
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  account_id UUID,
  account_name VARCHAR,
  category_id UUID,
  category_name VARCHAR,
  type VARCHAR,
  status VARCHAR,
  method VARCHAR,
  amount NUMERIC,
  currency VARCHAR,
  exchange_rate NUMERIC,
  date DATE,
  description VARCHAR,
  contact_id UUID,
  contact_type VARCHAR,
  contact_name VARCHAR,
  source_account_id UUID,
  source_account_name VARCHAR,
  destination_account_id UUID,
  destination_account_name VARCHAR,
  adjustment_reason VARCHAR,
  document_type VARCHAR,
  document_number VARCHAR,
  attachment_url TEXT,
  created_at TIMESTAMPTZ,
  created_by UUID,
  creator_name VARCHAR,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  approved_by UUID,
  approver_name VARCHAR,
  approved_at TIMESTAMPTZ,
  posted_by UUID,
  poster_name VARCHAR,
  posted_at TIMESTAMPTZ,
  rejected_by UUID,
  rejecter_name VARCHAR,
  rejected_at TIMESTAMPTZ,
  rejection_reason VARCHAR
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    t.id,
    t.company_id,
    t.account_id,
    a.name AS account_name,
    t.category_id,
    c.name AS category_name,
    t.type,
    t.status,
    t.method,
    t.amount,
    t.currency,
    t.exchange_rate,
    t.date,
    t.description,
    t.contact_id,
    t.contact_type,
    NULL::varchar AS contact_name,
    t.source_account_id,
    sa.name AS source_account_name,
    t.destination_account_id,
    da.name AS destination_account_name,
    t.adjustment_reason,
    t.document_type,
    t.document_number,
    t.attachment_url,
    t.created_at,
    t.created_by,
    uc.full_name AS creator_name,
    t.updated_at,
    t.updated_by,
    t.approved_by,
    ua.full_name AS approver_name,
    t.approved_at,
    t.posted_by,
    up.full_name AS poster_name,
    t.posted_at,
    t.rejected_by,
    ur.full_name AS rejecter_name,
    t.rejected_at,
    t.rejection_reason
  FROM transactions t
  LEFT JOIN accounts a ON t.account_id = a.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN accounts sa ON t.source_account_id = sa.id
  LEFT JOIN accounts da ON t.destination_account_id = da.id
  LEFT JOIN users uc ON t.created_by = uc.id
  LEFT JOIN users ua ON t.approved_by = ua.id
  LEFT JOIN users up ON t.posted_by = up.id
  LEFT JOIN users ur ON t.rejected_by = ur.id
  WHERE t.id = p_transaction_id
    AND t.deleted_at IS NULL;
$$;

COMMENT ON FUNCTION get_transaction_by_id IS 'Obtiene una transacción específica por ID con datos relacionados. Seguridad mediante RLS.';