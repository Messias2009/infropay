-- Persist ad click and browser identifiers so approved purchases are sent
-- server-side even if the buyer closes the confirmation page.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS tracking_fbp text,
  ADD COLUMN IF NOT EXISTS tracking_fbc text,
  ADD COLUMN IF NOT EXISTS tracking_ttp text,
  ADD COLUMN IF NOT EXISTS tracking_ttclid text,
  ADD COLUMN IF NOT EXISTS tracking_user_agent text,
  ADD COLUMN IF NOT EXISTS tracking_page_url text,
  ADD COLUMN IF NOT EXISTS tracking_referrer text;
