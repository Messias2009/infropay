-- Add TikTok Pixel / Events API credentials and server-side purchase idempotency.
ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS tiktok_pixel_id text,
  ADD COLUMN IF NOT EXISTS tiktok_events_api_token text;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS tracking_purchase_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS sales_tracking_purchase_pending_idx
  ON public.sales(status, tracking_purchase_sent_at)
  WHERE status = 'pago' AND tracking_purchase_sent_at IS NULL;
