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
