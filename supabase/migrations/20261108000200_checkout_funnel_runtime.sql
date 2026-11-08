-- Runtime support for checkout order bumps and post-purchase upsell/downsell.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS parent_sale_id uuid
  REFERENCES public.sales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sales_parent_sale_id_idx
  ON public.sales(parent_sale_id)
  WHERE parent_sale_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sales_parent_offer_kind_unique
  ON public.sales(parent_sale_id, origin)
  WHERE parent_sale_id IS NOT NULL AND origin IN ('upsell', 'downsell');

CREATE TABLE IF NOT EXISTS public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  offer_id uuid REFERENCES public.product_offers(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('order_bump')),
  title_snapshot text NOT NULL,
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sale_id, product_id, kind)
);

CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items(sale_id);
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage_on_paid_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  was_paid boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    was_paid := OLD.status = 'pago';
  END IF;

  IF NEW.status = 'pago'
     AND NOT was_paid
     AND NEW.coupon_code IS NOT NULL
     AND NEW.coupon_code <> '' THEN
    UPDATE public.coupons
    SET uses_count = uses_count + 1,
        updated_at = now()
    WHERE producer_id = NEW.producer_id
      AND code = upper(NEW.coupon_code);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_coupon_usage_aiu ON public.sales;
CREATE TRIGGER sales_coupon_usage_aiu
AFTER INSERT OR UPDATE OF status ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.increment_coupon_usage_on_paid_sale();

REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage_on_paid_sale() FROM PUBLIC, anon, authenticated;
