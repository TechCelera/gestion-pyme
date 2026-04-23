-- ============================================================================
-- RLS POLICIES - Versión sin funciones en schema auth
-- ============================================================================
-- Ejecutar en: https://raudmopfohcvcwqvkxzq.supabase.co → SQL Editor
-- ============================================================================

-- Enable RLS on all tables (ya debería estar, pero por si acaso)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Force RLS
ALTER TABLE companies FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE periods FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES - Usando auth.jwt() directamente
-- ============================================================================

-- Companies: users can only see their own company
DROP POLICY IF EXISTS "Users can view own company" ON companies;
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

-- Users: users can only see users in their company
DROP POLICY IF EXISTS "Users can view same company" ON users;
CREATE POLICY "Users can view same company" ON users
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

-- Accounts policies
DROP POLICY IF EXISTS "Users can view company accounts" ON accounts;
CREATE POLICY "Users can view company accounts" ON accounts
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can insert company accounts" ON accounts;
CREATE POLICY "Users can insert company accounts" ON accounts
  FOR INSERT WITH CHECK (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

DROP POLICY IF EXISTS "Users can update company accounts" ON accounts;
CREATE POLICY "Users can update company accounts" ON accounts
  FOR UPDATE USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

-- Categories policies
DROP POLICY IF EXISTS "Users can view company categories" ON categories;
CREATE POLICY "Users can view company categories" ON categories
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can insert company categories" ON categories;
CREATE POLICY "Users can insert company categories" ON categories
  FOR INSERT WITH CHECK (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

DROP POLICY IF EXISTS "Users can update company categories" ON categories;
CREATE POLICY "Users can update company categories" ON categories
  FOR UPDATE USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

-- Transactions policies
DROP POLICY IF EXISTS "Users can view company transactions" ON transactions;
CREATE POLICY "Users can view company transactions" ON transactions
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Users can insert company transactions" ON transactions;
CREATE POLICY "Users can insert company transactions" ON transactions
  FOR INSERT WITH CHECK (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

DROP POLICY IF EXISTS "Users can update company transactions" ON transactions;
CREATE POLICY "Users can update company transactions" ON transactions
  FOR UPDATE USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

-- Periods policies
DROP POLICY IF EXISTS "Users can view company periods" ON periods;
CREATE POLICY "Users can view company periods" ON periods
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

DROP POLICY IF EXISTS "Admin can manage company periods" ON periods;
CREATE POLICY "Admin can manage company periods" ON periods
  FOR ALL USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

-- Audit log policies
DROP POLICY IF EXISTS "Users can view company audit log" ON audit_log;
CREATE POLICY "Users can view company audit log" ON audit_log
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

DROP POLICY IF EXISTS "Users can insert audit log" ON audit_log;
CREATE POLICY "Users can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('companies', 'users', 'accounts', 'categories', 'transactions', 'periods', 'audit_log')
ORDER BY tablename;