DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS allow_affiliates BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 30;

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, affiliate_id)
);
GRANT SELECT, INSERT, UPDATE ON public.affiliate_links TO authenticated;
GRANT SELECT ON public.affiliate_links TO anon;
GRANT ALL ON public.affiliate_links TO service_role;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliate links are readable" ON public.affiliate_links;
CREATE POLICY "Affiliate links are readable" ON public.affiliate_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users create own affiliate links" ON public.affiliate_links;
CREATE POLICY "Users create own affiliate links" ON public.affiliate_links
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = affiliate_id);

DROP POLICY IF EXISTS "Users update own affiliate links" ON public.affiliate_links;
CREATE POLICY "Users update own affiliate links" ON public.affiliate_links
  FOR UPDATE TO authenticated USING (auth.uid() = affiliate_id);

DROP TRIGGER IF EXISTS trg_affiliate_links_updated ON public.affiliate_links;
CREATE TRIGGER trg_affiliate_links_updated BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_code TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_commission_cents INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sales_affiliate ON public.sales(affiliate_id);

CREATE OR REPLACE FUNCTION public.sales_compute_fee()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.platform_fee_cents IS NULL OR NEW.platform_fee_cents = 0 THEN
    NEW.platform_fee_cents := round(NEW.gross_cents * 0.02);
  END IF;
  IF NEW.affiliate_id IS NULL THEN
    NEW.affiliate_commission_cents := 0;
  END IF;
  NEW.net_cents := NEW.gross_cents - NEW.platform_fee_cents - COALESCE(NEW.affiliate_commission_cents, 0);
  IF NEW.release_at IS NULL THEN
    NEW.release_at := now();
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sales_update_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_wallet(NEW.producer_id);
  IF NEW.affiliate_id IS NOT NULL THEN
    PERFORM public.ensure_wallet(NEW.affiliate_id);
  END IF;

  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'pago' THEN
      UPDATE public.wallets SET available_cents = available_cents + NEW.net_cents, updated_at = now()
        WHERE producer_id = NEW.producer_id;
      IF NEW.affiliate_id IS NOT NULL AND COALESCE(NEW.affiliate_commission_cents,0) > 0 THEN
        UPDATE public.wallets SET available_cents = available_cents + NEW.affiliate_commission_cents, updated_at = now()
          WHERE producer_id = NEW.affiliate_id;
      END IF;
      NEW.released := true;
      IF NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.status <> 'pago' AND NEW.status = 'pago' THEN
      UPDATE public.wallets SET available_cents = available_cents + NEW.net_cents, updated_at = now()
        WHERE producer_id = NEW.producer_id;
      IF NEW.affiliate_id IS NOT NULL AND COALESCE(NEW.affiliate_commission_cents,0) > 0 THEN
        UPDATE public.wallets SET available_cents = available_cents + NEW.affiliate_commission_cents, updated_at = now()
          WHERE producer_id = NEW.affiliate_id;
      END IF;
      NEW.released := true;
      IF NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
    ELSIF OLD.status = 'pago' AND NEW.status IN ('reembolsado','cancelado') THEN
      UPDATE public.wallets SET available_cents = available_cents - OLD.net_cents, updated_at = now()
        WHERE producer_id = OLD.producer_id;
      IF OLD.affiliate_id IS NOT NULL AND COALESCE(OLD.affiliate_commission_cents,0) > 0 THEN
        UPDATE public.wallets SET available_cents = available_cents - OLD.affiliate_commission_cents, updated_at = now()
          WHERE producer_id = OLD.affiliate_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.register_affiliate_click(_code TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.affiliate_links SET clicks = clicks + 1, updated_at = now() WHERE code = _code;
END $$;
GRANT EXECUTE ON FUNCTION public.register_affiliate_click(TEXT) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Producers see own sales" ON public.sales;
CREATE POLICY "Producers see own sales" ON public.sales
  FOR SELECT USING (
    auth.uid() = producer_id
    OR auth.uid() = buyer_user_id
    OR auth.uid() = affiliate_id
    OR public.has_role(auth.uid(), 'admin')
  );