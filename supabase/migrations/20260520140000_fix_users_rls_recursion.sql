-- Evita "infinite recursion detected in policy for relation users":
-- no subconsultar public.users dentro de políticas ON public.users.

CREATE OR REPLACE FUNCTION public.auth_user_company_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.company_id
  FROM public.users u
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.auth_user_company_id() IS
  'company_id del usuario autenticado; SECURITY DEFINER para no disparar RLS recursivo en users.';

DROP POLICY IF EXISTS users_select_company ON public.users;
CREATE POLICY users_select_company ON public.users
  FOR SELECT
  USING (
    company_id = (SELECT public.auth_user_company_id())
    AND public.auth_user_is_admin()
  );

DROP POLICY IF EXISTS users_update_company_admin ON public.users;
CREATE POLICY users_update_company_admin ON public.users
  FOR UPDATE
  USING (
    company_id = (SELECT public.auth_user_company_id())
    AND public.auth_user_is_admin()
    AND id <> auth.uid()
  )
  WITH CHECK (
    company_id = (SELECT public.auth_user_company_id())
    AND public.auth_user_is_admin()
    AND id <> auth.uid()
  );

DROP POLICY IF EXISTS company_invites_admin ON public.company_invites;
CREATE POLICY company_invites_admin ON public.company_invites
  FOR ALL
  USING (
    company_id = (SELECT public.auth_user_company_id())
    AND public.auth_user_is_admin()
  )
  WITH CHECK (
    company_id = (SELECT public.auth_user_company_id())
    AND public.auth_user_is_admin()
  );
