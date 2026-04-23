-- ============================================================================
-- ACTIVAR RLS Y CREAR POLICIAS - Ejecutar en SQL Editor
-- ============================================================================

-- 1. Activar RLS en todas las tablas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;

ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

-- 2. Crear políticas para companies
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

-- 3. Crear políticas para users  
CREATE POLICY "Users can view same company" ON users
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

-- 4. Crear políticas para accounts
CREATE POLICY "Users can view company accounts" ON accounts
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can insert company accounts" ON accounts
  FOR INSERT WITH CHECK (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

CREATE POLICY "Users can update company accounts" ON accounts
  FOR UPDATE USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

-- 5. Crear políticas para categories
CREATE POLICY "Users can view company categories" ON categories
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can insert company categories" ON categories
  FOR INSERT WITH CHECK (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

CREATE POLICY "Users can update company categories" ON categories
  FOR UPDATE USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

-- 6. Crear políticas para transactions
CREATE POLICY "Users can view company transactions" ON transactions
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can insert company transactions" ON transactions
  FOR INSERT WITH CHECK (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

CREATE POLICY "Users can update company transactions" ON transactions
  FOR UPDATE USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid 
    AND deleted_at IS NULL
  );

-- 7. Crear políticas para periods
CREATE POLICY "Users can view company periods" ON periods
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

CREATE POLICY "Admin can manage company periods" ON periods
  FOR ALL USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

-- 8. Crear políticas para audit_log
CREATE POLICY "Users can view company audit log" ON audit_log
  FOR SELECT USING (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

CREATE POLICY "Users can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (
    company_id = ((auth.jwt() -> 'app_metadata' ->> 'company_id'))::uuid
  );

-- ============================================================================
-- VERIFICACIÓN - RLS debe mostrar ENABLED en todas
-- ============================================================================
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('companies', 'users', 'accounts', 'categories', 'transactions', 'periods', 'audit_log')
ORDER BY tablename;