-- Permite a administradores eliminar usuarios de su empresa (no a sí mismos).

DROP POLICY IF EXISTS users_delete_company_admin ON public.users;
CREATE POLICY users_delete_company_admin ON public.users
  FOR DELETE
  USING (
    company_id = (SELECT public.auth_user_company_id())
    AND public.auth_user_is_admin()
    AND id <> auth.uid()
  );
