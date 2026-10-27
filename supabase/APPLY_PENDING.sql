-- ============================================================
-- Script único de recuperação — correr UMA vez no SQL Editor
-- do Supabase (Dashboard > SQL Editor > New query > Run).
--
-- Contém, por ordem:
--   0) preâmbulo defensivo (tipo app_role + funções base)
--   1) comprovativos de pagamento (20261026000001)
--   2) Premium do Quiz Funnel (20261026000002)
--   3) dados do Quiz Funnel (20261026000003)
-- Todos os comandos são idempotentes (IF NOT EXISTS / OR
-- REPLACE / ON CONFLICT DO NOTHING) — pode ser corrido à
-- vontade sem efeitos secundários.
-- ============================================================

-- 0) Preâmbulo defensivo -----------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'producer', 'buyer');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 1) Comprovativos PayPay/EMIS ------------------------------
-- ============================================================
-- Comprovativos de pagamento por referência (PayPay / EMIS)
--
-- Fluxo: o comprador paga por Entidade + Referência, envia o
-- comprovativo (imagem ou PDF), o admin ou o produtor do produto
-- verifica e aprova → a venda passa a 'pago' e o acesso é liberado.
--
-- Notas de segurança:
--   * O bucket é privado e NÃO tem políticas para anon/authenticated:
--     o upload só acontece com URL assinada criada no servidor
--     (service role) e a leitura só com URL assinada de leitura.
--   * Nenhum cliente altera o estado da venda directamente; a
--     aprovação é feita por server function após verificação de papel.
--   * O crédito da carteira continua a ser feito pelo trigger
--     existente sales_update_wallet, apenas na transição
--     pendente → pago (portanto uma dupla aprovação não duplica saldo).
-- ============================================================

-- 1) Colunas do comprovativo na venda -------------------------------------
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS receipt_kind text,
  ADD COLUMN IF NOT EXISTS receipt_status text NOT NULL DEFAULT 'sem_comprovativo',
  ADD COLUMN IF NOT EXISTS receipt_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS receipt_note text;

ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_receipt_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_receipt_status_check
  CHECK (receipt_status IN ('sem_comprovativo', 'enviado', 'aprovado', 'rejeitado'));

CREATE INDEX IF NOT EXISTS idx_sales_receipt_status
  ON public.sales (receipt_status, created_at DESC);

-- 2) Bucket privado de comprovativos --------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3) Integridade do pedido: a venda só pode ser criada para o produto certo.
--    Fecha o buraco da política "Anyone can create pending sale", que aceita
--    qualquer producer_id / valores arbitrários.
CREATE OR REPLACE FUNCTION public.sales_check_product_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT producer_id INTO v_owner FROM public.products WHERE id = NEW.product_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Produto inexistente';
  END IF;
  IF NEW.producer_id IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'O produtor da venda não corresponde ao produto';
  END IF;
  IF NEW.gross_cents IS NULL OR NEW.gross_cents <= 0 THEN
    RAISE EXCEPTION 'Valor de venda inválido';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_check_product_owner_trg ON public.sales;
CREATE TRIGGER sales_check_product_owner_trg
  BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.sales_check_product_owner();

-- 2) Premium do Quiz Funnel -----------------------------
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

-- 3) Dados do Quiz Funnel ------------------------------
-- ============================================================
-- Quiz Funnel — Passo 2: estrutura de dados
--
-- * quizzes: guarda o quiz inteiro como JSON (etapas, opções, regras,
--   pontuação e tema) + estado rascunho/publicado.
-- * quiz_sessions / quiz_events: uma sessão por visitante, com eventos de
--   resposta, avanço e abandono (base do dashboard e da taxa de abandono).
-- * quiz_leads: nome + WhatsApp capturados, sempre legíveis pelo dono.
--
-- Escrita: apenas via servidor (service role). Leitura: cada vendedor só
-- vê os seus quizzes, sessões e leads; a administração vê tudo.
-- ============================================================

-- 1) Quizzes -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Quiz sem título',
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado')),
  visits_count integer NOT NULL DEFAULT 0,
  starts_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quizzes_producer_idx ON public.quizzes (producer_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quizzes do produtor" ON public.quizzes;
CREATE POLICY "Quizzes do produtor" ON public.quizzes
  FOR ALL TO authenticated
  USING (auth.uid() = producer_id)
  WITH CHECK (auth.uid() = producer_id);

DROP POLICY IF EXISTS "Admins veem todos os quizzes" ON public.quizzes;
CREATE POLICY "Admins veem todos os quizzes" ON public.quizzes
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Sem política de INSERT: a criação passa pela server function, que valida
-- o plano Premium no servidor.

DROP TRIGGER IF EXISTS quizzes_touch ON public.quizzes;
CREATE TRIGGER quizzes_touch BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Sessões -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id text,
  status text NOT NULL DEFAULT 'em_curso' CHECK (status IN ('em_curso','concluida','abandonada')),
  current_step_id text,
  utm_source text,
  utm_medium text,
  score integer NOT NULL DEFAULT 0,
  tags text[] NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_sessions_quiz_idx ON public.quiz_sessions (quiz_id, started_at DESC);
CREATE INDEX IF NOT EXISTS quiz_sessions_producer_idx ON public.quiz_sessions (producer_id, started_at DESC);

GRANT SELECT, UPDATE ON public.quiz_sessions TO authenticated;
GRANT ALL ON public.quiz_sessions TO service_role;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sessões do produtor" ON public.quiz_sessions;
CREATE POLICY "Sessões do produtor" ON public.quiz_sessions
  FOR SELECT TO authenticated USING (auth.uid() = producer_id OR public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS quiz_sessions_touch ON public.quiz_sessions;
CREATE TRIGGER quiz_sessions_touch BEFORE UPDATE ON public.quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) Eventos -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id text,
  type text NOT NULL CHECK (type IN ('visualizacao','resposta','avanco','abandono','lead','oferta')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_events_session_idx ON public.quiz_events (session_id, created_at);
CREATE INDEX IF NOT EXISTS quiz_events_quiz_idx ON public.quiz_events (quiz_id, type, created_at DESC);

GRANT SELECT ON public.quiz_events TO authenticated;
GRANT ALL ON public.quiz_events TO service_role;
ALTER TABLE public.quiz_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eventos do produtor" ON public.quiz_events;
CREATE POLICY "Eventos do produtor" ON public.quiz_events
  FOR SELECT TO authenticated USING (auth.uid() = producer_id OR public.has_role(auth.uid(), 'admin'));

-- 4) Leads -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quiz_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.quiz_sessions(id) ON DELETE SET NULL,
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  whatsapp text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  score integer NOT NULL DEFAULT 0,
  source_step_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_leads_quiz_idx ON public.quiz_leads (quiz_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quiz_leads_producer_idx ON public.quiz_leads (producer_id, created_at DESC);

GRANT SELECT ON public.quiz_leads TO authenticated;
GRANT ALL ON public.quiz_leads TO service_role;
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leads do produtor" ON public.quiz_leads;
CREATE POLICY "Leads do produtor" ON public.quiz_leads
  FOR SELECT TO authenticated USING (auth.uid() = producer_id OR public.has_role(auth.uid(), 'admin'));
-- INSERT/UPDATE/DELETE apenas por service role (server function).
