-- Enforce coupon limits atomically when a sale becomes paid.
CREATE OR REPLACE FUNCTION public.increment_coupon_usage_on_paid_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  was_paid boolean := false;
  coupon_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    was_paid := OLD.status = 'pago';
  END IF;

  IF NEW.status = 'pago'
     AND NOT was_paid
     AND NEW.coupon_code IS NOT NULL
     AND NEW.coupon_code <> '' THEN
    UPDATE public.coupons
    SET uses_count = COALESCE(uses_count, 0) + 1,
        updated_at = now()
    WHERE producer_id = NEW.producer_id
      AND code = upper(NEW.coupon_code)
      AND (max_uses IS NULL OR COALESCE(uses_count, 0) < max_uses)
    RETURNING id INTO coupon_id;

    IF coupon_id IS NULL THEN
      RAISE EXCEPTION 'Cupão inválido ou limite de utilizações atingido.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
