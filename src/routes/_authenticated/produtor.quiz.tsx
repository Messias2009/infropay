import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  Check,
  Clock,
  Copy,
  Eye,
  FileText,
  Filter,
  Loader2,
  Lock,
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { createQuiz, deleteQuiz, duplicateQuiz, listMyQuizzes, setQuizStatus } from "@/lib/quizzes.functions";
import { PAYPAY_REFERENCE } from "@/lib/payments.config";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/produtor/quiz")({
  head: () => ({
    meta: [{ title: "Quizzes — InfroPay" }, { name: "robots", content: "noindex" }],
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
  const duplicateFn = useServerFn(duplicateQuiz);
  const setStatusFn = useServerFn(setQuizStatus);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

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
    if (!confirm("Tem a certeza que deseja eliminar este quiz? Esta ação não pode ser revertida.")) return;
    try {
      await deleteFn({ data: { id } });
      toast.success("Quiz eliminado");
      queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function duplicate(id: string) {
    try {
      const quiz = await duplicateFn({ data: { id } });
      toast.success("Quiz duplicado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
      window.location.href = `/produtor/quiz/editor/${quiz.id}`;
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "publicado" ? "rascunho" : "publicado";
    try {
      await setStatusFn({ data: { id, status: newStatus } });
      toast.success(newStatus === "publicado" ? "Quiz publicado" : "Quiz voltou a rascunho");
      queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const items = data?.items ?? [];
  
  const filteredItems = items.filter((quiz: any) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "publicados") return matchesSearch && quiz.status === "publicado";
    if (activeTab === "rascunhos") return matchesSearch && quiz.status === "rascunho";
    return matchesSearch;
  });

  const stats = {
    total: items.length,
    publicados: items.filter((q: any) => q.status === "publicado").length,
    rascunhos: items.filter((q: any) => q.status === "rascunho").length,
    totalViews: items.reduce((sum: number, q: any) => sum + (q.visits || 0), 0),
    totalLeads: items.reduce((sum: number, q: any) => sum + (q.leads || 0), 0),
    totalConversions: items.reduce((sum: number, q: any) => sum + Math.floor((q.visits || 0) * (q.conversion || 0)), 0),
  };

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Quiz Funnel · Premium
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-bold mt-3">Gestão de Quizzes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie, personalize e analise quizzes interativos para gerar vendas e captar leads.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={async () => {
              if (!title.trim()) {
                document.getElementById("quiz-create-title")?.scrollIntoView({ behavior: "smooth", block: "center" });
                document.getElementById("quiz-create-title")?.focus();
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
            }}
            disabled={creating}
            className="gradient-brand text-primary-foreground shadow-glow"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Criar novo Quiz
          </Button>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-4 space-y-3">
          <div>
            <h2 className="font-semibold">Criar novo quiz</h2>
            <p className="text-sm text-muted-foreground">Dê um nome ao quiz para abrir o editor e adicionar etapas, imagens, vídeos e ofertas.</p>
          </div>
          <form className="flex flex-col sm:flex-row gap-2" onSubmit={(event) => { event.preventDefault(); void create(); }}>
            <Input id="quiz-create-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome do quiz" maxLength={120} className="min-w-0 flex-1" />
            <Button type="submit" disabled={creating} className="gradient-brand text-primary-foreground">
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Criar quiz
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Publicados</p>
                <p className="text-2xl font-bold text-success">{stats.publicados}</p>
              </div>
              <Rocket className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rascunhos</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.rascunhos}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Visualizações</p>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Leads</p>
                <p className="text-2xl font-bold text-gold">{stats.totalLeads}</p>
              </div>
              <Users className="h-8 w-8 text-gold/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversões</p>
                <p className="text-2xl font-bold text-success">{stats.totalConversions}</p>
              </div>
              <Zap className="h-8 w-8 text-success/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quizzes List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Meus Quizzes</CardTitle>
              <CardDescription>
                Gerencie todos os seus quizzes desde este painel
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="todos">Todos ({items.length})</TabsTrigger>
              <TabsTrigger value="publicados">Publicados ({stats.publicados})</TabsTrigger>
              <TabsTrigger value="rascunhos">Rascunhos ({stats.rascunhos})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" /> A carregar quizzes…
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-10 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Nenhum quiz encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchTerm ? "Tente ajustar a sua pesquisa" : "Crie o seu primeiro quiz para começar"}
                    </p>
                  </div>
                  {!searchTerm && (
                    <Button
                      onClick={async () => {
                        try {
                          const quiz = await createFn({ data: { title: "Meu Primeiro Quiz" } });
                          toast.success("Quiz criado com sucesso");
                          queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
                          window.location.href = `/produtor/quiz/editor/${quiz.id}`;
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                      className="gradient-brand text-primary-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro quiz
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((quiz: any) => (
                    <div
                      key={quiz.id}
                      className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Link
                            to="/produtor/quiz/editor/$quizId"
                            params={{ quizId: quiz.id }}
                            className="font-semibold hover:text-primary transition-colors truncate"
                          >
                            {quiz.title}
                          </Link>
                          <Badge variant={quiz.status === "publicado" ? "default" : "secondary"}>
                            {quiz.status === "publicado" ? "Publicado" : "Rascunho"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {quiz.visits || 0} visualizações
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {quiz.leads || 0} leads
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3.5 w-3.5" />
                            {((quiz.conversion || 0) * 100).toFixed(1)}% conversão
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" />
                            {quiz.steps || 0} etapas
                          </div>
                          <div>
                            Actualizado {formatDistanceToNow(new Date(quiz.updated_at), { addSuffix: true, locale: ptBR })}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to="/produtor/quiz/editor/$quizId" params={{ quizId: quiz.id }}>
                          <Button size="sm" variant="outline">
                            Editar
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => duplicate(quiz.id)}>
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Duplicar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (quiz.status !== "publicado" && (!quiz.steps || quiz.steps < 1)) {
                              toast.info("Adicione uma etapa antes de publicar. A abrir o editor.");
                              window.location.href = `/produtor/quiz/editor/${quiz.id}`;
                              return;
                            }
                            void toggleStatus(quiz.id, quiz.status);
                          }}
                        >
                          {quiz.status === "publicado" ? "Despublicar" : "Publicar"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(quiz.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Keep existing UpgradeScreen and PlanPayment components (they're long but needed)
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
