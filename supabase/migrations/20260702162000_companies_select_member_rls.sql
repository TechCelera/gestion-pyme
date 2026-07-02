-- Restaura lectura de companies para miembros del tenant (admin y collaborator).
-- La política basada solo en JWT app_metadata falla si el token está desalineado con public.users.

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS companies_select_member ON public.companies;

CREATE POLICY companies_select_member ON public.companies
  FOR SELECT
  USING (
    id IN (
      SELECT u.company_id
      FROM public.users u
      WHERE u.id = auth.uid()
    )
  );
