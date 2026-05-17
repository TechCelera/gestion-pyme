-- Tenant roles: keep legacy slugs in DB for RLS compatibility; default new rows to admin_finanzas.
-- App layer normalizes admin_finanzas|superadmin → admin, vendedor|responsable → collaborator.

UPDATE public.users
SET role = 'admin_finanzas'
WHERE role IN ('vendedor', 'responsable', 'superadmin');

ALTER TABLE public.users
  ALTER COLUMN role SET DEFAULT 'admin_finanzas';

COMMENT ON COLUMN public.users.role IS
  'Tenant role slug. Product: Administrador (admin_finanzas, superadmin) | Colaborador (vendedor, responsable). App normalizes to admin|collaborator.';
