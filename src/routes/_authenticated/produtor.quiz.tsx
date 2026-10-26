import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Clock, Loader2, Lock, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ReferenceGeneration } from "@/components/payments/ReferenceGeneration";
import { ReceiptUpload } from "@/components/payments/ReceiptUpload";
import {
  PLAN_PRICES,
  createPlanOrder,
  createPlanReceiptUpload,
  getMyPlan,
  getPlanOrder,
  startFreeTrial,
  submitPlanReceipt,
} from "@/lib/plans.functions";
import { PAYPAY_REFERENCE } from "@/lib/payments.config";

export const Route = createFileRoute("/_authenticated/produtor/quiz")({
  head: () => ({
    meta: [{ title: "Quiz Funnel — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: ProdutorQuiz,
});

const TOKEN_KEY = (plano: string) => `ip_plan_order_${plano}`;

function ProdutorQuiz() {
  const planFn = useServerFn(getMyPlan);
  const queryClient = useQueryClient();
  const {
    data: plan,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["plan"],
    queryFn: () => planFn(),
    refetchInterval: 60_000,
  });

  if (isLoading && !plan) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" /> A verificar o seu plano…
      </div>
    );
  }

  if (plan?.setup_required) {
    return (
      <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-gold/40 bg-gold/5 p-6 text-sm space-y-2">
          <div className="font-semibold text-gold">Configuração pendente</div>
          <p className="text-muted-foreground">
            A tabela de subscrições ainda não existe na base de dados. Execute a migração{" "}
            <span className="font-mono text-xs">
              supabase/migrations/20261026000002_quiz_funnel_premium.sql
            </span>{" "}
            no SQL Editor do Supabase e recarregue esta página.
          </p>
        </div>
      </div>
    );
  }

  if (plan?.premium) {
    return (
      <PremiumActive
        plan={plan}
        onChanged={() => {
          queryClient.invalidateQueries({ queryKey: ["plan"] });
          refetch();
        }}
      />
    );
  }

  return (
    <UpgradeScreen
      onActivated={() => queryClient.invalidateQueries({ queryKey: ["plan"] })}
      trialUsed={!!plan?.trial_used}
    />
  );
}

function PremiumActive({ plan, onChanged }: { plan: any; onChanged: () => void }) {
  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold">
          <Sparkles className="h-3.5 w-3.5" /> Quiz Funnel · Premium
        </div>
        <h1 className="font-display text-2xl md:text-4xl font-bold mt-3">
          O seu plano está activo
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O editor de quizzes fica disponível na próxima etapa. Enquanto isso, o seu acesso está
          garantido.
        </p>
      </div>

      <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Plano actual
            </div>
            <div className="font-display text-2xl font-bold mt-1">{plan.plano_label}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {plan.data_fim && (
                <>
                  Válido até{" "}
                  <span className="text-foreground font-medium">
                    {new Date(plan.data_fim).toLocaleString("pt-PT")}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold text-gradient-gold tabular-nums">
              {plan.dias_restantes}
            </div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              dias restantes
            </div>
          </div>
        </div>

        {plan.dias_restantes <= 1 && (
          <div className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs flex gap-2">
            <Clock className="h-4 w-4 text-warning shrink-0" />
            <span>
              O seu plano expira em menos de 24 horas. Renove para manter o Quiz Funnel activo — os
              quizzes guardados ficam sempre no seu painel.
            </span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">
          A seguir no Quiz Funnel
        </div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {[
            "Editor de etapas com lógica condicional e templates prontos",
            "Página pública mobile-first com captura de leads",
            "Analytics de visitas, conclusão, leads e conversão",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-success mt-0.5 shrink-0" /> {t}
            </li>
          ))}
        </ul>
        <Button variant="outline" className="mt-5" onClick={onChanged}>
          <Loader2 className="h-4 w-4 mr-2" /> Actualizar estado do plano
        </Button>
      </div>
    </div>
  );
}

function UpgradeScreen({
  onActivated,
  trialUsed,
}: {
  onActivated: () => void;
  trialUsed: boolean;
}) {
  const trialFn = useServerFn(startFreeTrial);
  const orderFn = useServerFn(createPlanOrder);
  const orderStateFn = useServerFn(getPlanOrder);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<null | "trial" | string>(null);
  const [order, setOrder] = useState<{
    token: string;
    plano: "7d" | "30d";
    plano_label: string;
    amount_label: string;
  } | null>(null);

  // Recupera um pedido de pagamento que ficou por concluir (ex.: após refresh).
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const plano of ["30d", "7d"] as const) {
        const token = window.localStorage.getItem(TOKEN_KEY(plano));
        if (!token) continue;
        try {
          const state = await orderStateFn({ data: { token } });
          if (!alive) return;
          if (state && state.status === "pendente") {
            setOrder({
              token,
              plano,
              plano_label: state.plano_label ?? "",
              amount_label: PLAN_PRICES[plano].price_label,
            });
            return;
          }
          window.localStorage.removeItem(TOKEN_KEY(plano));
        } catch {
          window.localStorage.removeItem(TOKEN_KEY(plano));
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function choose(plano: "7d" | "30d") {
    setBusy(plano);
    try {
      const r = await orderFn({ data: { plano } });
      window.localStorage.setItem(TOKEN_KEY(plano), r.token);
      setOrder({
        token: r.token,
        plano,
        plano_label: r.plano_label,
        amount_label: r.amount_label,
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function trial() {
    setBusy("trial");
    try {
      await trialFn();
      toast.success("Teste grátis de 1 dia activado!");
      onActivated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (order) {
    return (
      <PlanPayment
        order={order}
        onDone={() => {
          window.localStorage.removeItem(TOKEN_KEY(order.plano));
          onActivated();
        }}
        onBack={() => {
          window.localStorage.removeItem(TOKEN_KEY(order.plano));
          setOrder(null);
        }}
        orderStateFn={orderStateFn}
        onChanged={() => queryClient.invalidateQueries({ queryKey: ["plan"] })}
      />
    );
  }

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-7">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold">
          <Lock className="h-3.5 w-3.5" /> Recurso Premium
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-3">Quiz Funnel</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Transforme cada pergunta numa oportunidade de venda: quizzes interativos que terminam na
          oferta do seu produto, com captura de leads e checkout da InfroPay.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(["7d", "30d"] as const).map((key) => {
          const plan = PLAN_PRICES[key];
          const destaque = key === "30d";
          return (
            <div
              key={key}
              className={`relative rounded-2xl border p-6 flex flex-col ${destaque ? "border-gold/50 bg-gradient-to-br from-gold/10 via-card to-card shadow-gold/10 shadow-lg" : "border-border bg-card"}`}
            >
              {destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background">
                  Mais escolhido
                </span>
              )}
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {plan.label}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-gradient-gold tabular-nums">
                  {plan.price_label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Pagamento único por referência · {plan.days} dias de acesso
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground flex-1">
                {[
                  "Crie quizzes ilimitados e publique-os",
                  "Captura de leads com WhatsApp",
                  "Analytics e exportação em CSV",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-5 w-full ${destaque ? "gradient-brand text-primary-foreground shadow-glow" : "border-gold/40 hover:bg-gold/10 text-foreground"}`}
                variant={destaque ? "default" : "outline"}
                disabled={busy !== null}
                onClick={() => choose(key)}
              >
                {busy === key ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                Escolher {plan.short}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card/70 p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/30 grid place-items-center text-primary-glow shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="font-semibold text-sm">Teste grátis: 1 dia de Premium</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Activa uma única vez por conta e dá acesso completo ao Quiz Funnel.
          </p>
        </div>
        <Button
          onClick={trial}
          disabled={busy !== null || trialUsed}
          variant={trialUsed ? "outline" : "default"}
          className={
            trialUsed ? "opacity-70" : "gradient-brand text-primary-foreground shadow-glow"
          }
        >
          {busy === "trial" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4 mr-2" />
          )}
          {trialUsed ? "Teste grátis já utilizado" : "Testar 1 dia grátis"}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        Pagamento pelos métodos da InfroPay · verificação de comprovativo pela administração
      </div>
    </div>
  );
}

function PlanPayment({
  order,
  onDone,
  onBack,
  orderStateFn,
  onChanged,
}: {
  order: { token: string; plano: "7d" | "30d"; plano_label: string; amount_label: string };
  onDone: () => void;
  onBack: () => void;
  orderStateFn: (args: { data: { token: string } }) => Promise<any>;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: state } = useQuery({
    queryKey: ["plan-order", order.token],
    queryFn: () => orderStateFn({ data: { token: order.token } }),
    refetchInterval: 15_000,
  });

  const paid = state?.status === "pago";

  useEffect(() => {
    if (paid) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-10 max-w-2xl mx-auto space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground transition"
      >
        ← Voltar aos planos
      </button>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Plano escolhido
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="font-display text-xl font-bold">{order.plano_label}</div>
          <div className="font-mono font-bold text-gradient-gold tabular-nums">
            {order.amount_label}
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-secondary/60 border border-border p-3 text-xs text-muted-foreground">
          {state?.receipt_status === "enviado"
            ? "Comprovativo recebido — a aguardar verificação da administração."
            : "Pague a Entidade/Referência abaixo e envie o comprovativo para activar o plano."}
        </div>
      </div>

      <ReferenceGeneration
        reference={PAYPAY_REFERENCE}
        amountLabel={`${order.amount_label} · ${order.plano_label}`}
      />

      <ReceiptUpload
        token={order.token}
        receiptStatus={state?.receipt_status ?? "sem_comprovativo"}
        receiptKind={state?.receipt_kind}
        receiptNote={state?.receipt_note}
        orderStatus={state?.status === "pago" ? "pago" : "pendente"}
        uploadFn={createPlanReceiptUpload}
        submitFn={submitPlanReceipt}
        onSubmitted={() => {
          queryClient.invalidateQueries({ queryKey: ["plan-order", order.token] });
          onChanged();
        }}
      />

      <p className="text-[11px] text-muted-foreground text-center">
        Assim que a administração aprovar o comprovativo, o plano é activado automaticamente nesta
        página.
      </p>
    </div>
  );
}
