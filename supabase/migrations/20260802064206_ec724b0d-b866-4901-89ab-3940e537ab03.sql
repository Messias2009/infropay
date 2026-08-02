-- ============ 1. PRODUTOS AVANÇADOS ============
DO $$ BEGIN
  CREATE TYPE public.delivery_kind AS ENUM ('digital','fisico','apk','assinatura','membros','externo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_interval AS ENUM ('mensal','trimestral','semestral','anual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.offer_kind AS ENUM ('order_bump','upsell','downsell');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.discount_kind AS ENUM ('percentagem','valor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS delivery_kind public.delivery_kind NOT NULL DEFAULT 'digital',
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS requires_shipping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_fee_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight_grams integer,
  ADD COLUMN IF NOT EXISTS app_version text,
  ADD COLUMN IF NOT EXISTS app_package text,
  ADD COLUMN IF NOT EXISTS app_requirements text,
  ADD COLUMN IF NOT EXISTS is_subscription boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_interval public.billing_interval,
  ADD COLUMN IF NOT EXISTS subscription_price_cents bigint,
  ADD COLUMN IF NOT EXISTS trial_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_members_area boolean NOT NULL DEFAULT false;

-- ============ 2. FUNIL: OFERTAS ============
CREATE TABLE IF NOT EXISTS public.product_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  offer_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  kind public.offer_kind NOT NULL DEFAULT 'order_bump',
  headline text,
  description text,
  offer_price_cents bigint NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_offers_not_self CHECK (product_id <> offer_product_id)
);

GRANT SELECT ON public.product_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_offers TO authenticated;
GRANT ALL ON public.product_offers TO service_role;
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offers_public_read" ON public.product_offers FOR SELECT TO anon, authenticated
  USING (active = true AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = 'publicado'));
CREATE POLICY "offers_owner_all" ON public.product_offers FOR ALL TO authenticated
  USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "offers_admin_all" ON public.product_offers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER product_offers_touch BEFORE UPDATE ON public.product_offers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ 3. FUNIL: CUPÕES ============
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_kind public.discount_kind NOT NULL DEFAULT 'percentagem',
  discount_value integer NOT NULL,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_code_unique UNIQUE (producer_id, code)
);

GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_public_read_active" ON public.coupons FOR SELECT TO anon, authenticated
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "coupons_owner_all" ON public.coupons FOR ALL TO authenticated
  USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "coupons_admin_all" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER coupons_touch BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_cents bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'principal';

-- ============ 4. ÁREA DE MEMBROS ============
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_public_read" ON public.course_modules FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status = 'publicado'));
CREATE POLICY "modules_owner_all" ON public.course_modules FOR ALL TO authenticated
  USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "modules_admin_all" ON public.course_modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER course_modules_touch BEFORE UPDATE ON public.course_modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  attachment_url text,
  duration_minutes integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_public_read" ON public.course_lessons FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.course_modules m
    JOIN public.products p ON p.id = m.product_id
    WHERE m.id = module_id AND p.status = 'publicado'
  ));
CREATE POLICY "lessons_owner_all" ON public.course_lessons FOR ALL TO authenticated
  USING (auth.uid() = producer_id) WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "lessons_admin_all" ON public.course_lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER course_lessons_touch BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL,
  progress_percent integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  certificate_issued boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_unique UNIQUE (user_id, product_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_own" ON public.enrollments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "enrollments_producer_read" ON public.enrollments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.producer_id = auth.uid()));
CREATE POLICY "enrollments_admin_all" ON public.enrollments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER enrollments_touch BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  seconds_watched integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_unique UNIQUE (user_id, lesson_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lesson_progress_own" ON public.lesson_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lesson_progress_producer_read" ON public.lesson_progress FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_lessons l WHERE l.id = lesson_id AND l.producer_id = auth.uid()));
CREATE POLICY "lesson_progress_admin_all" ON public.lesson_progress FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER lesson_progress_touch BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_offers_product ON public.product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_modules_product ON public.course_modules(product_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);