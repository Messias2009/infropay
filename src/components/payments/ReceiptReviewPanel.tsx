import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getReceiptUrl, listReceiptsForReview, reviewReceipt } from "@/lib/receipt.functions";
import {
  PLAN_PRICES,
  getPlanOrderReceiptUrl,
  listPlanOrdersForReview,
  reviewPlanOrder,
} from "@/lib/plans.functions";

type ReviewItem = {
  id: string;
  created_at: string;
  gross_cents: number;
  currency: string;
  status: string;
  payment_ref: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  receipt_kind: string | null;
  receipt_status: string;
  receipt_submitted_at: string | null;
  receipt_note: string | null;
  receipt_reviewed_at: string | null;
  product: { title: string; slug: string; cover_url: string | null } | null;
};

type PlanOrder = {
  id: string;
  created_at: string;
  amount_cents: number;
  currency: string;
  status: string;
  plano: string;
  payment_ref: string | null;
  receipt_kind: string | null;
  receipt_status: string;
  receipt_submitted_at: string | null;
  receipt_note: string | null;
  receipt_reviewed_at: string | null;
  user_id: string;
};

function fmt(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  enviado: { label: "A aguardar verificação", className: "bg-gold/15 text-gold border-gold/40" },
  aprovado: { label: "Aprovado", className: "bg-success/15 text-success border-success/40" },
  rejeitado: {
    label: "Recusado",
    className: "bg-destructive/15 text-destructive border-destructive/40",
  },
  sem_comprovativo: {
    label: "Sem comprovativo",
    className: "bg-muted text-muted-foreground border-border",
  },
};

/**
 * Fila de verificação de comprovativos partilhada pelo painel do admin
 * (/adm/pedidos) e pelo painel do produtor (/produtor/pedidos).
 * O servidor devolve apenas os pedidos que o utilizador tem permissão para ver.
 */
export function ReceiptReviewPanel() {
  const listFn = useServerFn(listReceiptsForReview);
  const reviewFn = useServerFn(reviewReceipt);
  const urlFn = useServerFn(getReceiptUrl);
  const planListFn = useServerFn(listPlanOrdersForReview);
  const planReviewFn = useServerFn(reviewPlanOrder);
  const planUrlFn = useServerFn(getPlanOrderReceiptUrl);
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ id: string; url: string; kind: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["receipt-review"],
    queryFn: () => listFn(),
    refetchInterval: 30_000,
  });

  // Fila de comprovativos de planos Premium — só o admin recebe esta lista.
  const { data: planData } = useQuery({
    queryKey: ["plan-order-review"],
    queryFn: () => planListFn(),
    enabled: !!data?.admin,
    refetchInterval: 30_000,
  });
  const planItems = (planData?.items ?? []) as unknown as PlanOrder[];
  const planPending = planItems.filter((p) => p.receipt_status === "enviado");

  const items = (data?.items ?? []) as unknown as ReviewItem[];
  const pending = items.filter((i) => i.receipt_status === "enviado");
  const rest = items.filter((i) => i.receipt_status !== "enviado");

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["receipt-review"] });
    queryClient.invalidateQueries({ queryKey: ["plan-order-review"] });
  }

  async function open(saleId: string, kind: string) {
    try {
      const r = await urlFn({ data: { sale_id: saleId } });
      setPreview({ id: saleId, url: r.url, kind: kind || "imagem" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function decide(saleId: string, action: "approve" | "reject") {
    setBusyId(saleId);
    try {
      const r = await reviewFn({ data: { sale_id: saleId, action } });
      toast.success(
        r.approved ? "Pagamento aprovado — acesso liberado." : "Comprovativo recusado.",
      );
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function openPlan(orderId: string, kind: string) {
    try {
      const r = await planUrlFn({ data: { order_id: orderId } });
      setPreview({ id: orderId, url: r.url, kind: kind || r.kind || "imagem" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function decidePlan(orderId: string, action: "approve" | "reject") {
    setBusyId(orderId);
    try {
      const r = await planReviewFn({ data: { order_id: orderId, action } });
      toast.success(
        r.approved ? "Plano activado — subscrição criada." : "Comprovativo de plano recusado.",
      );
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading && !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" /> A carregar pedidos…
      </div>
    );
  }

  if (data?.setup_required) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6 text-sm space-y-2">
        <div className="font-semibold text-gold">Configuração pendente</div>
        <p className="text-muted-foreground">
          As colunas de comprovativo ainda não existem na base de dados. Execute a migração{" "}
          <span className="font-mono text-xs">
            supabase/migrations/20261026000001_payment_receipts.sql
          </span>{" "}
          no SQL Editor do Supabase e recarregue esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-gold">
            A aguardar verificação ({pending.length})
          </h2>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            Não há comprovativos por verificar.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => {
              const badge = STATUS_BADGE[s.receipt_status] ?? STATUS_BADGE.sem_comprovativo;
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-secondary shrink-0 border border-border">
                      {s.product?.cover_url && (
                        <img
                          src={s.product.cover_url}
                          alt=""
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm line-clamp-1">
                        {s.product?.title ?? "Produto"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {s.buyer_name ?? "Comprador"} · {s.buyer_email ?? "—"} ·{" "}
                        {s.buyer_phone ?? "—"}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Enviado em{" "}
                        {s.receipt_submitted_at
                          ? new Date(s.receipt_submitted_at).toLocaleString("pt-PT")
                          : "—"}
                        {s.payment_ref ? ` · Ref. ${s.payment_ref}` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-gradient-gold tabular-nums">
                        {fmt(s.gross_cents, s.currency)}
                      </div>
                      <span
                        className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => open(s.id, s.receipt_kind ?? "imagem")}
                    >
                      {s.receipt_kind === "pdf" ? (
                        <FileText className="h-4 w-4 mr-1" />
                      ) : (
                        <ImageIcon className="h-4 w-4 mr-1" />
                      )}
                      Ver comprovativo
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={busyId === s.id}
                      onClick={() => decide(s.id, "reject")}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Recusar
                    </Button>
                    <Button
                      size="sm"
                      className="gradient-brand text-primary-foreground"
                      disabled={busyId === s.id}
                      onClick={() => decide(s.id, "approve")}
                    >
                      {busyId === s.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                      )}
                      Aprovar pagamento
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {planPending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-gold">
              Planos Premium ({planPending.length})
            </h2>
          </div>
          <div className="space-y-3">
            {planPending.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-gold/40 bg-gold/5 p-4 sm:p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">
                      {PLAN_PRICES[p.plano as keyof typeof PLAN_PRICES]?.label ?? p.plano}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Enviado em{" "}
                      {p.receipt_submitted_at
                        ? new Date(p.receipt_submitted_at).toLocaleString("pt-PT")
                        : "—"}
                      {p.payment_ref ? ` · Ref. ${p.payment_ref}` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-gradient-gold tabular-nums">
                      {fmt(p.amount_cents, p.currency)}
                    </div>
                    <span className="mt-1 inline-block rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                      {STATUS_BADGE.enviado.label}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPlan(p.id, p.receipt_kind ?? "imagem")}
                  >
                    {p.receipt_kind === "pdf" ? (
                      <FileText className="h-4 w-4 mr-1" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-1" />
                    )}
                    Ver comprovativo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={busyId === p.id}
                    onClick={() => decidePlan(p.id, "reject")}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Recusar
                  </Button>
                  <Button
                    size="sm"
                    className="gradient-brand text-primary-foreground"
                    disabled={busyId === p.id}
                    onClick={() => decidePlan(p.id, "approve")}
                  >
                    {busyId === p.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Aprovar e activar plano
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Histórico recente
          </h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border/70">
            {rest.map((s) => {
              const badge = STATUS_BADGE[s.receipt_status] ?? STATUS_BADGE.sem_comprovativo;
              return (
                <div key={s.id} className="p-3.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{s.product?.title ?? "—"}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {s.buyer_name ?? "Comprador"} ·{" "}
                      {s.receipt_reviewed_at
                        ? `verificado em ${new Date(s.receipt_reviewed_at).toLocaleString("pt-PT")}`
                        : "—"}
                      {s.receipt_note ? ` · ${s.receipt_note}` : ""}
                    </div>
                  </div>
                  <div className="font-mono text-xs tabular-nums text-muted-foreground">
                    {fmt(s.gross_cents, s.currency)}
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  {s.status === "pago" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => open(s.id, s.receipt_kind ?? "imagem")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-full max-w-3xl max-h-full rounded-2xl border border-border bg-card p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Comprovativo</div>
              <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            {preview.kind === "pdf" ? (
              <iframe
                src={preview.url}
                title="Comprovativo PDF"
                className="w-full h-[70vh] rounded-xl border border-border bg-white"
              />
            ) : (
              <img
                src={preview.url}
                alt="Comprovativo"
                className="w-full max-h-[70vh] object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
