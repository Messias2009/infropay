import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Check, Clock, Eye, FileText, Loader2, Lock, Plus, Rocket, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createQuiz, deleteQuiz, listMyQuizzes } from "@/lib/quizzes.functions";
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
  const listFn = useServerFn(listMyQuizzes);
  const createFn = useServerFn(createQuiz);
  const deleteFn = useServerFn(deleteQuiz);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-quizzes"],
    queryFn: () => listFn(),
  });

  async function create() {
    if (!title.trim()) {
      toast.error("Dê um nome ao seu quiz");
      return;
    }
    setCreating(true);
    try {
      const quiz = await createFn({ data: { title: title.trim() } });
      toast.success("Quiz criado com sucesso");
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
      window.location.href = `/produtor/quiz/editor/${quiz.id}`;
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Tem a certeza que deseja eliminar este quiz?")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Quiz eliminado");
      queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const items = data?.items ?? [];

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Quiz Funnel · Premium
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-bold mt-3">
            Os seus quizzes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie, edite e publique quizzes interativos para gerar vendas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/quiz/preview">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" /> Pré-visualizar renderizador
            </Button>
          </Link>
          <Button variant="outline" onClick={onChanged}>
            <Loader2 className="h-4 w-4 mr-2" /> Actualizar plano
          </Button>
        </div>
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
              O seu plano expira em menos de 24 horas. Renove para manter o Quiz Funnel activo.
            </span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Criar novo quiz</div>
            <p className="text-sm text-muted-foreground">
              Comece com um nome e personalize com o editor completo.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do quiz (ex.: Vendas de Curso)"
              className="sm:w-80"
            />
            <Button onClick={create} disabled={creating} className="gradient-brand text-primary-foreground">
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar quiz
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Meus quizzes</div>
            <p className="text-sm text-muted-foreground">
              {items.length === 0 ? "Ainda não criou nenhum quiz" : `${items.length} quiz(es) criado(s)`}
            </p>
          </div>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" /> A carregar quizzes…
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Crie o seu primeiro quiz para começar a vender com o Quiz Funnel.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map((quiz: any) => (
              <div key={quiz.id} className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold truncate">{quiz.title}</div>
                    <span
                      className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        quiz.status === "publicado"
                          ? "border-success/40 text-success bg-success/10"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {quiz.status === "publicado" ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {quiz.visits} visitas
                    </div>
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5" /> {quiz.leads} leads
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {quiz.steps} etapas
                    </div>
                    <div>
                      Conversão: {(quiz.conversion * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/produtor/quiz/editor/${quiz.id}`}>
                    <Button size="sm">Editar quiz</Button>
                  </Link>
                  <Link to="/quiz/preview">
                    <Button size="sm" variant="outline">
                      Pré-visualizar
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => remove(quiz.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
