-- ============================================================
-- Quiz Funnel — Passo 1: controlo de acesso Premium
--
-- * subscriptions: user_id, plano (trial/7d/30d), data_inicio, data_fim,
--   estado (ativo/expirado). O teste grátis de 1 dia é activável apenas
--   uma vez por conta (índice único parcial).
-- * subscription_orders: compra de plano pelos métodos já usados na
--   InfroPay (Entidade/Referência PayPay + comprovativo verificado pela
--   administração). Nenhum cliente escreve nesta tabela: só service role.
-- ============================================================

-- 1) Ordens de compra de plano ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL DEFAULT encode(gen_random_bytes(18),'hex'),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano text NOT NULL CHECK (plano IN ('7d','30d')),
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'AOA',
  payment_method text NOT NULL DEFAULT 'referencia',
  provider text,
  payment_ref text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
  receipt_path text,
  receipt_kind text,
  receipt_status text NOT NULL DEFAULT 'sem_comprovativo'
    CHECK (receipt_status IN ('sem_comprovativo','enviado','aprovado','rejeitado')),
  receipt_submitted_at timestamptz,
  receipt_reviewed_at timestamptz,
  receipt_reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  receipt_note text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscription_orders_token_uidx
  ON public.subscription_orders (access_token);
CREATE INDEX IF NOT EXISTS subscription_orders_user_idx
  ON public.subscription_orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_orders_receipt_idx
  ON public.subscription_orders (receipt_status, created_at DESC);

GRANT SELECT ON public.subscription_orders TO authenticated;
GRANT ALL ON public.subscription_orders TO service_role;
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own plan orders" ON public.subscription_orders;
CREATE POLICY "Users see own plan orders" ON public.subscription_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins see all plan orders" ON public.subscription_orders;
CREATE POLICY "Admins see all plan orders" ON public.subscription_orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Sem políticas de INSERT/UPDATE para clientes: escrita apenas via servidor.

-- 2) Subscrições -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano text NOT NULL CHECK (plano IN ('trial','7d','30d')),
  data_inicio timestamptz NOT NULL DEFAULT now(),
  data_fim timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'ativo' CHECK (estado IN ('ativo','expirado')),
  order_id uuid REFERENCES public.subscription_orders(id) ON DELETE SET NULL,
  avisado_24h boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_fim_depois_inicio CHECK (data_fim > data_inicio)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_idx
  ON public.subscriptions (user_id, data_inicio DESC);
CREATE INDEX IF NOT EXISTS subscriptions_actives_idx
  ON public.subscriptions (data_fim) WHERE estado = 'ativo';
-- Teste grátis: uma única vez por conta.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_trial_once_idx
  ON public.subscriptions (user_id) WHERE plano = 'trial';

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own subscriptions" ON public.subscriptions;
CREATE POLICY "Users see own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins see all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins see all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3) Expiração automática: estado deixa de 'ativo' quando passa data_fim.
CREATE OR REPLACE FUNCTION public.expire_stale_subscriptions(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
     SET estado = 'expirado', updated_at = now()
   WHERE user_id = _user_id
     AND estado = 'ativo'
     AND data_fim <= now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_stale_subscriptions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_subscriptions(uuid) TO authenticated, service_role;
