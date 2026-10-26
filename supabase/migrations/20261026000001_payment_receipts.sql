-- ============================================================
-- Comprovativos de pagamento por referência (PayPay / EMIS)
--
-- Fluxo: o comprador paga por Entidade + Referência, envia o
-- comprovativo (imagem ou PDF), o admin ou o produtor do produto
-- verifica e aprova → a venda passa a 'pago' e o acesso é liberado.
--
-- Notas de segurança:
--   * O bucket é privado e NÃO tem políticas para anon/authenticated:
--     o upload só acontece com URL assinada criada no servidor
--     (service role) e a leitura só com URL assinada de leitura.
--   * Nenhum cliente altera o estado da venda directamente; a
--     aprovação é feita por server function após verificação de papel.
--   * O crédito da carteira continua a ser feito pelo trigger
--     existente sales_update_wallet, apenas na transição
--     pendente → pago (portanto uma dupla aprovação não duplica saldo).
-- ============================================================

-- 1) Colunas do comprovativo na venda -------------------------------------
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS receipt_kind text,
  ADD COLUMN IF NOT EXISTS receipt_status text NOT NULL DEFAULT 'sem_comprovativo',
  ADD COLUMN IF NOT EXISTS receipt_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS receipt_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS receipt_note text;

ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_receipt_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_receipt_status_check
  CHECK (receipt_status IN ('sem_comprovativo', 'enviado', 'aprovado', 'rejeitado'));

CREATE INDEX IF NOT EXISTS idx_sales_receipt_status
  ON public.sales (receipt_status, created_at DESC);

-- 2) Bucket privado de comprovativos --------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3) Integridade do pedido: a venda só pode ser criada para o produto certo.
--    Fecha o buraco da política "Anyone can create pending sale", que aceita
--    qualquer producer_id / valores arbitrários.
CREATE OR REPLACE FUNCTION public.sales_check_product_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT producer_id INTO v_owner FROM public.products WHERE id = NEW.product_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Produto inexistente';
  END IF;
  IF NEW.producer_id IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'O produtor da venda não corresponde ao produto';
  END IF;
  IF NEW.gross_cents IS NULL OR NEW.gross_cents <= 0 THEN
    RAISE EXCEPTION 'Valor de venda inválido';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sales_check_product_owner_trg ON public.sales;
CREATE TRIGGER sales_check_product_owner_trg
  BEFORE INSERT ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.sales_check_product_owner();
