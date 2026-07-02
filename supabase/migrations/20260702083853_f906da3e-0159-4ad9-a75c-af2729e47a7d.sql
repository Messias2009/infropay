
-- Allow user to self-assign non-admin roles (producer/buyer)
DROP POLICY IF EXISTS "Users can self-assign non-admin roles" ON public.user_roles;
CREATE POLICY "Users can self-assign non-admin roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role IN ('producer','buyer'));

-- Bootstrap first admin
CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_any_admin boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO has_any_admin;
  IF has_any_admin THEN
    RETURN false;
  END IF;
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END $$;

GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;
