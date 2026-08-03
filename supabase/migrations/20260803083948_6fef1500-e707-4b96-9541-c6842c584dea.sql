-- 1) Ban support on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_banned FROM public.profiles WHERE id = _user_id), false)
$$;

GRANT EXECUTE ON FUNCTION public.is_user_banned(uuid) TO authenticated, anon, service_role;

-- Only admins may flip the ban flags
CREATE OR REPLACE FUNCTION public.protect_ban_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.is_banned IS DISTINCT FROM OLD.is_banned
      OR NEW.banned_at IS DISTINCT FROM OLD.banned_at
      OR NEW.ban_reason IS DISTINCT FROM OLD.ban_reason)
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o estado da conta';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_ban_columns_trg ON public.profiles;
CREATE TRIGGER protect_ban_columns_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_ban_columns();

-- Banned producers cannot create/edit products
CREATE OR REPLACE FUNCTION public.block_banned_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_user_banned(NEW.producer_id) THEN
    RAISE EXCEPTION 'Conta bloqueada: não é possível publicar produtos';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_banned_products_trg ON public.products;
CREATE TRIGGER block_banned_products_trg
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.block_banned_products();

-- Banned producers cannot receive new sales
CREATE OR REPLACE FUNCTION public.block_banned_sales()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_user_banned(NEW.producer_id) THEN
    RAISE EXCEPTION 'Produto indisponível';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_banned_sales_trg ON public.sales;
CREATE TRIGGER block_banned_sales_trg
BEFORE INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.block_banned_sales();

-- 2) Admin audit logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_name text,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin logs" ON public.admin_logs;
CREATE POLICY "Admins can read admin logs"
ON public.admin_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can write admin logs" ON public.admin_logs;
CREATE POLICY "Admins can write admin logs"
ON public.admin_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND admin_id = auth.uid());

CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_logs_action_idx ON public.admin_logs (action);