
-- 1) Extend product_status enum with 'em_analise' (analysis/pending review)
ALTER TYPE public.product_status ADD VALUE IF NOT EXISTS 'em_analise';

-- 2) Add rejection reason column
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3) Storage policies for product-media bucket
-- Path convention: {user_id}/{product_id-or-uuid}/{filename}
DROP POLICY IF EXISTS "product-media owner read" ON storage.objects;
DROP POLICY IF EXISTS "product-media owner insert" ON storage.objects;
DROP POLICY IF EXISTS "product-media owner update" ON storage.objects;
DROP POLICY IF EXISTS "product-media owner delete" ON storage.objects;
DROP POLICY IF EXISTS "product-media admin read" ON storage.objects;

CREATE POLICY "product-media owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "product-media owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "product-media owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "product-media owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "product-media admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

-- 4) Allow admins to update any product (status/rejection)
DROP POLICY IF EXISTS "Admins can update any product" ON public.products;
CREATE POLICY "Admins can update any product" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
