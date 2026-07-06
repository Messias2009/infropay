-- 1) Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id) WHERE read = false;

-- 2) Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

-- 3) Helper for formatting Kz
CREATE OR REPLACE FUNCTION public.fmt_kz(_cents bigint)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT to_char((_cents / 100.0)::numeric, 'FM999G999G999G990D00') || ' Kz'
$$;

-- 4) Trigger: notify producer on paid sale
CREATE OR REPLACE FUNCTION public.notify_sale_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_product text;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'pago')
     OR (TG_OP = 'UPDATE' AND NEW.status = 'pago' AND OLD.status IS DISTINCT FROM 'pago') THEN
    SELECT title INTO v_product FROM public.products WHERE id = NEW.product_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.producer_id,
      'sale',
      '🎉 Venda aprovada!',
      'Recebeu uma nova venda de ' || public.fmt_kz(NEW.gross_cents) ||
        COALESCE(' — ' || v_product, ''),
      '/produtor/financeiro',
      jsonb_build_object('sale_id', NEW.id, 'gross_cents', NEW.gross_cents, 'net_cents', NEW.net_cents, 'product_id', NEW.product_id)
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_sale_paid ON public.sales;
CREATE TRIGGER trg_notify_sale_paid
  AFTER INSERT OR UPDATE OF status ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.notify_sale_paid();

-- 5) Trigger: notify producer on withdrawal status change
CREATE OR REPLACE FUNCTION public.notify_withdrawal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_body text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'aprovado' THEN
      v_title := '✅ Saque aprovado';
      v_body := 'O seu saque de ' || public.fmt_kz(NEW.gross_cents) || ' foi aprovado e será processado.';
    ELSIF NEW.status = 'pago' THEN
      v_title := '💸 Saque pago';
      v_body := 'O seu saque de ' || public.fmt_kz(NEW.gross_cents) || ' foi transferido com sucesso.';
    ELSIF NEW.status = 'recusado' THEN
      v_title := '⚠️ Saque recusado';
      v_body := 'O seu saque de ' || public.fmt_kz(NEW.gross_cents) || ' foi recusado. Motivo: ' || COALESCE(NEW.rejection_reason, 'não indicado');
    ELSE
      RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, link, metadata)
    VALUES (
      NEW.producer_id,
      'withdrawal',
      v_title,
      v_body,
      '/produtor/saques',
      jsonb_build_object('withdrawal_id', NEW.id, 'gross_cents', NEW.gross_cents, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_withdrawal_status ON public.withdrawals;
CREATE TRIGGER trg_notify_withdrawal_status
  AFTER UPDATE OF status ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.notify_withdrawal_status();