-- ============================================================================
-- MIGRACIÓN: Políticas RLS para tabla transactions
-- ID: TX-005
-- Fecha: 2025-04-21
-- Autor: Sistema Gestion PYME Pro
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Habilitar Row Level Security en la tabla
-- ----------------------------------------------------------------------------

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Comentario
COMMENT ON TABLE transactions IS 'Tabla de transacciones financieras con soporte para workflow de aprobación (draft → pending → approved → posted). RLS habilitado.';

-- ----------------------------------------------------------------------------
-- 2. Política: Company Isolation
-- ----------------------------------------------------------------------------
-- Usuarios solo pueden ver transacciones de su empresa

CREATE POLICY transactions_company_isolation ON transactions
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND deleted_at IS NULL  -- Excluir eliminadas
  );

COMMENT ON POLICY transactions_company_isolation ON transactions IS 
  'Usuarios solo pueden ver transacciones de su empresa y no eliminadas';

-- ----------------------------------------------------------------------------
-- 3. Política: Insert
-- ----------------------------------------------------------------------------
-- Solo usuarios autenticados de la empresa pueden crear transacciones

CREATE POLICY transactions_insert ON transactions
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

COMMENT ON POLICY transactions_insert ON transactions IS 
  'Solo usuarios de la empresa pueden crear transacciones, registrando created_by';

-- ----------------------------------------------------------------------------
-- 4. Política: Update DRAFT
-- ----------------------------------------------------------------------------
-- Solo el creador puede editar sus borradores
-- Admins y SuperAdmins pueden editar cualquier borrador

CREATE POLICY transactions_update_draft ON transactions
  FOR UPDATE
  USING (
    status = 'draft'  -- Solo transacciones en estado draft
    AND company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      created_by = auth.uid()  -- El creador puede editar
      OR EXISTS (  -- O es admin/superadmin
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
          AND role IN ('superadmin', 'admin_finanzas')
      )
    )
  );

COMMENT ON POLICY transactions_update_draft ON transactions IS 
  'Solo el creador puede editar sus borradores. Admins también pueden editar cualquier borrador.';

-- ----------------------------------------------------------------------------
-- 5. Política: No Update POSTED
-- ----------------------------------------------------------------------------
-- Las transacciones POSTED son inmutables - no pueden modificarse

CREATE POLICY transactions_no_update_posted ON transactions
  FOR UPDATE
  USING (status <> 'posted');

COMMENT ON POLICY transactions_no_update_posted ON transactions IS 
  'Las transacciones contabilizadas (posted) son inmutables y no pueden modificarse';

-- ----------------------------------------------------------------------------
-- 6. Política: Approve/Reject
-- ----------------------------------------------------------------------------
-- Solo Admin Finanzas y SuperAdmin pueden aprobar/rechazar transacciones PENDING

CREATE POLICY transactions_approve ON transactions
  FOR UPDATE
  USING (
    status = 'pending'  -- Solo transacciones pendientes
    AND company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
        AND role IN ('superadmin', 'admin_finanzas')
    )
  );

COMMENT ON POLICY transactions_approve ON transactions IS 
  'Solo Admin Finanzas y SuperAdmin pueden aprobar o rechazar transacciones pendientes';

-- ----------------------------------------------------------------------------
-- 7. Política: Post
-- ----------------------------------------------------------------------------
-- Solo Admin Finanzas y SuperAdmin pueden contabilizar (post) transacciones APPROVED

CREATE POLICY transactions_post ON transactions
  FOR UPDATE
  USING (
    status = 'approved'  -- Solo transacciones aprobadas
    AND company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
        AND role IN ('superadmin', 'admin_finanzas')
    )
  );

COMMENT ON POLICY transactions_post ON transactions IS 
  'Solo Admin Finanzas y SuperAdmin pueden contabilizar transacciones aprobadas';

-- ----------------------------------------------------------------------------
-- 8. Política: Delete (Soft Delete)
-- ----------------------------------------------------------------------------
-- Solo el creador puede eliminar sus borradores
-- Admins y SuperAdmins pueden eliminar cualquier borrador

CREATE POLICY transactions_delete ON transactions
  FOR DELETE
  USING (
    status = 'draft'  -- Solo transacciones en estado draft
    AND company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      created_by = auth.uid()  -- El creador puede eliminar
      OR EXISTS (  -- O es admin/superadmin
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
          AND role IN ('superadmin', 'admin_finanzas')
      )
    )
  );

COMMENT ON POLICY transactions_delete ON transactions IS 
  'Solo el creador puede eliminar sus borradores. Admins también pueden eliminar cualquier borrador.';

-- ----------------------------------------------------------------------------
-- 9. Política: Revert APPROVED to DRAFT
-- ----------------------------------------------------------------------------
-- Solo Admin Finanzas y SuperAdmin pueden revertir transacciones aprobadas a borrador

CREATE POLICY transactions_revert_approved ON transactions
  FOR UPDATE
  USING (
    status = 'approved'  -- Solo transacciones aprobadas
    AND company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
        AND role IN ('superadmin', 'admin_finanzas')
    )
  );

COMMENT ON POLICY transactions_revert_approved ON transactions IS 
  'Solo Admin Finanzas y SuperAdmin pueden revertir transacciones aprobadas a borrador';

-- ----------------------------------------------------------------------------
-- 10. Política: Update REJECTED to DRAFT/PENDING
-- ----------------------------------------------------------------------------
-- El creador o admins pueden volver a enviar transacciones rechazadas

CREATE POLICY transactions_update_rejected ON transactions
  FOR UPDATE
  USING (
    status = 'rejected'  -- Solo transacciones rechazadas
    AND company_id IN (
      SELECT company_id 
      FROM users 
      WHERE id = auth.uid()
    )
    AND (
      created_by = auth.uid()  -- El creador puede reenviar
      OR EXISTS (  -- O es admin/superadmin
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
          AND role IN ('superadmin', 'admin_finanzas')
      )
    )
  );

COMMENT ON POLICY transactions_update_rejected ON transactions IS 
  'El creador puede volver a enviar transacciones rechazadas a borrador o pendiente';

-- ----------------------------------------------------------------------------
-- Resumen de permisos por rol
-- ----------------------------------------------------------------------------
-- SuperAdmin / Admin Finanzas:
--   - SELECT: Todas las transacciones de su empresa
--   - INSERT: Crear transacciones
--   - UPDATE: Cualquier transacción DRAFT, APPROVED (revertir), REJECTED, PENDING (aprobar/rechazar)
--   - DELETE: Cualquier transacción DRAFT
--
-- Responsable / Vendedor (creadores):
--   - SELECT: Todas las transacciones de su empresa
--   - INSERT: Crear transacciones (vendedor solo income)
--   - UPDATE: Solo sus transacciones DRAFT o REJECTED
--   - DELETE: Solo sus transacciones DRAFT
--
-- Nota: Las transacciones POSTED son inmutables para todos los roles
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Comentarios finales
-- ----------------------------------------------------------------------------

-- Nota sobre la validación de roles de vendedor:
-- La restricción de que vendedores solo pueden crear transacciones de tipo 'income'
-- se implementa en la capa de aplicación (Domain/Server Actions) ya que
-- PostgreSQL RLS no tiene acceso directo al tipo de transacción en el INSERT.
-- La política transactions_insert permite a cualquier usuario de la empresa crear,
-- pero el código de aplicación debe validar el tipo según el rol.
