
-- 1) Bootstrap admin para deivlyflex@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('a54b9528-e3a2-45f8-9267-7d24767c3dcb', 'admin')
ON CONFLICT DO NOTHING;

-- 2) Liberação instantânea de vendas: release_at = now() e move direto para available
CREATE OR REPLACE FUNCTION public.sales_compute_fee()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.platform_fee_cents IS NULL OR NEW.platform_fee_cents = 0 THEN
    NEW.platform_fee_cents := round(NEW.gross_cents * 0.02);
  END IF;
  NEW.net_cents := NEW.gross_cents - NEW.platform_fee_cents;
  IF NEW.release_at IS NULL THEN
    NEW.release_at := now();
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sales_update_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_wallet(NEW.producer_id);
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'pago' THEN
      UPDATE public.wallets SET available_cents = available_cents + NEW.net_cents, updated_at = now()
        WHERE producer_id = NEW.producer_id;
      NEW.released := true;
      IF NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.status <> 'pago' AND NEW.status = 'pago' THEN
      UPDATE public.wallets SET available_cents = available_cents + NEW.net_cents, updated_at = now()
        WHERE producer_id = NEW.producer_id;
      NEW.released := true;
      IF NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
    ELSIF OLD.status = 'pago' AND NEW.status IN ('reembolsado','cancelado') THEN
      UPDATE public.wallets SET available_cents = available_cents - OLD.net_cents, updated_at = now()
        WHERE producer_id = OLD.producer_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- 3) Perfil enriquecido: bio, display_name, cover_url (avatar_url já existe)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram TEXT,
  ADD COLUMN IF NOT EXISTS social_website TEXT;

-- 4) Integrações globais por utilizador
CREATE TABLE IF NOT EXISTS public.user_integrations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_pixel_id TEXT,
  meta_capi_token TEXT,
  google_ads_id TEXT,
  google_ads_label TEXT,
  ga_measurement_id TEXT,
  utmify_token TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;
GRANT ALL ON public.user_integrations TO service_role;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own integrations" ON public.user_integrations;
CREATE POLICY "own integrations" ON public.user_integrations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5) Overrides de tracking por produto
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS ga_measurement_id TEXT,
  ADD COLUMN IF NOT EXISTS google_ads_label TEXT,
  ADD COLUMN IF NOT EXISTS utmify_token TEXT;

-- 6) Webhook events (idempotência)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- (sem policies: apenas service_role acede)

-- 7) Stripe session id em sales (para reconciliar)
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS provider TEXT;
