
-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.sale_status AS ENUM ('pendente','pago','reembolsado','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM ('multicaixa_express','referencia','transferencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.withdrawal_status AS ENUM ('em_analise','aprovado','pago','recusado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ SALES ============
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  gross_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  net_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'AOA',
  payment_method public.payment_method NOT NULL,
  payment_ref text,
  status public.sale_status NOT NULL DEFAULT 'pendente',
  release_at timestamptz,
  released boolean NOT NULL DEFAULT false,
  access_token text NOT NULL DEFAULT encode(gen_random_bytes(18),'hex'),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sales_producer_idx ON public.sales(producer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sales_product_idx ON public.sales(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS sales_access_token_uidx ON public.sales(access_token);

GRANT SELECT, INSERT, UPDATE ON public.sales TO authenticated;
GRANT SELECT, INSERT ON public.sales TO anon;
GRANT ALL ON public.sales TO service_role;

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Producers see own sales" ON public.sales
  FOR SELECT USING (auth.uid() = producer_id OR auth.uid() = buyer_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update sales" ON public.sales
  FOR UPDATE USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can create pending sale" ON public.sales
  FOR INSERT WITH CHECK (status = 'pendente');

CREATE TRIGGER sales_touch BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ WALLETS ============
CREATE TABLE IF NOT EXISTS public.wallets (
  producer_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_cents bigint NOT NULL DEFAULT 0,
  pending_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AOA',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Producer sees own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = producer_id OR public.has_role(auth.uid(),'admin'));

-- ============ BANK ACCOUNTS ============
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  holder_name text NOT NULL,
  bank_name text NOT NULL,
  iban text NOT NULL,
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bank_accounts_producer_idx ON public.bank_accounts(producer_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Producer manages own banks" ON public.bank_accounts
  FOR ALL USING (auth.uid() = producer_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = producer_id);
CREATE TRIGGER bank_accounts_touch BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ WITHDRAWALS ============
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  gross_cents bigint NOT NULL,
  fee_cents bigint NOT NULL,
  net_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'AOA',
  status public.withdrawal_status NOT NULL DEFAULT 'em_analise',
  rejection_reason text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS withdrawals_producer_idx ON public.withdrawals(producer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS withdrawals_status_idx ON public.withdrawals(status);
GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Producer sees own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = producer_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Producer creates own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = producer_id AND status = 'em_analise');
CREATE POLICY "Admins update withdrawals" ON public.withdrawals
  FOR UPDATE USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER withdrawals_touch BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ FUNCTIONS / TRIGGERS ============

-- Compute fee 2% and net on sale insert
CREATE OR REPLACE FUNCTION public.sales_compute_fee()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.platform_fee_cents IS NULL OR NEW.platform_fee_cents = 0 THEN
    NEW.platform_fee_cents := round(NEW.gross_cents * 0.02);
  END IF;
  NEW.net_cents := NEW.gross_cents - NEW.platform_fee_cents;
  IF NEW.release_at IS NULL THEN
    NEW.release_at := now() + interval '7 days';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sales_compute_fee_biu
  BEFORE INSERT OR UPDATE OF gross_cents ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.sales_compute_fee();

-- Ensure wallet row
CREATE OR REPLACE FUNCTION public.ensure_wallet(_uid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.wallets(producer_id) VALUES (_uid) ON CONFLICT DO NOTHING;
$$;

-- Update wallet when sale becomes/leaves paid
CREATE OR REPLACE FUNCTION public.sales_update_wallet()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.ensure_wallet(NEW.producer_id);
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'pago' THEN
      UPDATE public.wallets SET pending_cents = pending_cents + NEW.net_cents, updated_at = now()
        WHERE producer_id = NEW.producer_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.status <> 'pago' AND NEW.status = 'pago' THEN
      UPDATE public.wallets SET pending_cents = pending_cents + NEW.net_cents, updated_at = now()
        WHERE producer_id = NEW.producer_id;
      IF NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
    ELSIF OLD.status = 'pago' AND NEW.status IN ('reembolsado','cancelado') THEN
      IF OLD.released THEN
        UPDATE public.wallets SET available_cents = available_cents - OLD.net_cents, updated_at = now()
          WHERE producer_id = OLD.producer_id;
      ELSE
        UPDATE public.wallets SET pending_cents = pending_cents - OLD.net_cents, updated_at = now()
          WHERE producer_id = OLD.producer_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sales_wallet_aiu
  AFTER INSERT OR UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.sales_update_wallet();

-- Release matured sales (call periodically or on read)
CREATE OR REPLACE FUNCTION public.release_matured_sales()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n integer := 0;
BEGIN
  FOR r IN SELECT id, producer_id, net_cents FROM public.sales
    WHERE status = 'pago' AND released = false AND release_at <= now()
  LOOP
    UPDATE public.sales SET released = true WHERE id = r.id;
    PERFORM public.ensure_wallet(r.producer_id);
    UPDATE public.wallets
      SET pending_cents = pending_cents - r.net_cents,
          available_cents = available_cents + r.net_cents,
          updated_at = now()
      WHERE producer_id = r.producer_id;
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;

-- Withdrawal validations
CREATE OR REPLACE FUNCTION public.validate_withdrawal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE avail bigint;
BEGIN
  IF NEW.gross_cents < 500000 THEN
    RAISE EXCEPTION 'Valor mínimo de saque é 5.000 Kz';
  END IF;
  NEW.fee_cents := round(NEW.gross_cents * 0.08);
  NEW.net_cents := NEW.gross_cents - NEW.fee_cents;
  PERFORM public.ensure_wallet(NEW.producer_id);
  SELECT available_cents INTO avail FROM public.wallets WHERE producer_id = NEW.producer_id;
  IF NEW.gross_cents > COALESCE(avail,0) THEN
    RAISE EXCEPTION 'Saldo disponível insuficiente';
  END IF;
  UPDATE public.wallets
    SET available_cents = available_cents - NEW.gross_cents, updated_at = now()
    WHERE producer_id = NEW.producer_id;
  RETURN NEW;
END $$;
CREATE TRIGGER withdrawals_validate_bi
  BEFORE INSERT ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal();

-- On reject/paid handling
CREATE OR REPLACE FUNCTION public.withdrawal_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    IF NEW.status = 'recusado' AND OLD.status IN ('em_analise','aprovado') THEN
      UPDATE public.wallets SET available_cents = available_cents + OLD.gross_cents, updated_at = now()
        WHERE producer_id = OLD.producer_id;
    END IF;
    IF NEW.status = 'pago' THEN
      NEW.processed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER withdrawals_status_bu
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.withdrawal_status_change();
