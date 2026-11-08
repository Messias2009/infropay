-- Persist Google click IDs and UTM campaign fields on the order for attribution.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS tracking_gclid text,
  ADD COLUMN IF NOT EXISTS tracking_gbraid text,
  ADD COLUMN IF NOT EXISTS tracking_wbraid text,
  ADD COLUMN IF NOT EXISTS tracking_utm_source text,
  ADD COLUMN IF NOT EXISTS tracking_utm_medium text,
  ADD COLUMN IF NOT EXISTS tracking_utm_campaign text,
  ADD COLUMN IF NOT EXISTS tracking_utm_content text,
  ADD COLUMN IF NOT EXISTS tracking_utm_term text;
