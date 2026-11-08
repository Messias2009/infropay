-- Fix wallet double-crediting and make withdrawal balance checks concurrency-safe.
-- Paid sales are credited directly to available balance, matching the July 5 accounting model.
-- This trigger is BEFORE so released/paid_at changes are persisted on the sale row.

CREATE OR REPLACE FUNCTION public.sales_update_wallet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  PERFORM public.ensure_wallet(NEW.producer_id);

  IF NEW.affiliate_id IS NOT NULL THEN
    PERFORM public.ensure_wallet(NEW.affiliate_id);
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pago' THEN
      UPDATE public.wallets
      SET available_cents = available_cents + NEW.net_cents,
          updated_at = now()
      WHERE producer_id = NEW.producer_id;

      IF NEW.affiliate_id IS NOT NULL
         AND COALESCE(NEW.affiliate_commission_cents, 0) > 0 THEN
        UPDATE public.wallets
        SET available_cents = available_cents + NEW.affiliate_commission_cents,
            updated_at = now()
        WHERE producer_id = NEW.affiliate_id;
      END IF;

      NEW.released := true;
      NEW.paid_at := COALESCE(NEW.paid_at, now());
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status <> 'pago' AND NEW.status = 'pago' THEN
      UPDATE public.wallets
      SET available_cents = available_cents + NEW.net_cents,
          updated_at = now()
      WHERE producer_id = NEW.producer_id;

      IF NEW.affiliate_id IS NOT NULL
         AND COALESCE(NEW.affiliate_commission_cents, 0) > 0 THEN
        UPDATE public.wallets
        SET available_cents = available_cents + NEW.affiliate_commission_cents,
            updated_at = now()
        WHERE producer_id = NEW.affiliate_id;
      END IF;

      NEW.released := true;
      NEW.paid_at := COALESCE(NEW.paid_at, now());

    ELSIF OLD.status = 'pago' AND NEW.status IN ('reembolsado', 'cancelado') THEN
      IF OLD.released THEN
        UPDATE public.wallets
        SET available_cents = available_cents - OLD.net_cents,
            updated_at = now()
        WHERE producer_id = OLD.producer_id;
      ELSE
        UPDATE public.wallets
        SET pending_cents = pending_cents - OLD.net_cents,
            updated_at = now()
        WHERE producer_id = OLD.producer_id;
      END IF;

      IF OLD.affiliate_id IS NOT NULL
         AND COALESCE(OLD.affiliate_commission_cents, 0) > 0 THEN
        UPDATE public.wallets
        SET available_cents = available_cents - OLD.affiliate_commission_cents,
            updated_at = now()
        WHERE producer_id = OLD.affiliate_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_wallet_aiu ON public.sales;
DROP TRIGGER IF EXISTS sales_wallet_biu ON public.sales;
CREATE TRIGGER sales_wallet_biu
BEFORE INSERT OR UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.sales_update_wallet();

-- Legacy pending sales are only released when their pending balance actually covers them.
-- Row locks prevent concurrent wallet reads from releasing the same sale twice.
CREATE OR REPLACE FUNCTION public.release_matured_sales()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  r record;
  v_pending bigint;
  v_sale_id uuid;
  n integer := 0;
BEGIN
  FOR r IN
    SELECT id, producer_id, net_cents
    FROM public.sales
    WHERE status = 'pago'
      AND released = false
      AND release_at <= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.ensure_wallet(r.producer_id);

    SELECT pending_cents
    INTO v_pending
    FROM public.wallets
    WHERE producer_id = r.producer_id
    FOR UPDATE;

    IF COALESCE(v_pending, 0) >= r.net_cents THEN
      UPDATE public.sales
      SET released = true
      WHERE id = r.id
        AND status = 'pago'
        AND released = false
      RETURNING id INTO v_sale_id;

      IF FOUND THEN
        UPDATE public.wallets
        SET pending_cents = pending_cents - r.net_cents,
            available_cents = available_cents + r.net_cents,
            updated_at = now()
        WHERE producer_id = r.producer_id;
        n := n + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN n;
END;
$$;

-- Lock the wallet row before checking and reserving a withdrawal to prevent
-- two simultaneous requests from spending the same available balance.
CREATE OR REPLACE FUNCTION public.validate_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  avail bigint;
BEGIN
  IF NEW.gross_cents < 500000 THEN
    RAISE EXCEPTION 'Valor mínimo de saque é 5.000 Kz';
  END IF;

  NEW.fee_cents := round(NEW.gross_cents * 0.08);
  NEW.net_cents := NEW.gross_cents - NEW.fee_cents;

  PERFORM public.ensure_wallet(NEW.producer_id);

  SELECT available_cents
  INTO avail
  FROM public.wallets
  WHERE producer_id = NEW.producer_id
  FOR UPDATE;

  IF NEW.gross_cents > COALESCE(avail, 0) THEN
    RAISE EXCEPTION 'Saldo disponível insuficiente';
  END IF;

  UPDATE public.wallets
  SET available_cents = available_cents - NEW.gross_cents,
      updated_at = now()
  WHERE producer_id = NEW.producer_id;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sales_update_wallet() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_withdrawal() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_matured_sales() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_matured_sales() TO authenticated;
