import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  TrendingUp,
  Wallet,
  Clock,
  ArrowUpRight,
  Package,
  DollarSign,
  Receipt,
  Award,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { getMyFinanceOverview, getMyWallet } from "@/lib/finance.functions";
import { FeeBanner, kz } from "@/components/finance/FeeBanner";
import { PushSalesNotificationBanner } from "@/components/notifications/PushSalesNotificationBanner";
import { usePlaqueWatcher } from "@/hooks/usePlaqueWatcher";

export const Route = createFileRoute("/_authenticated/produtor/")({
  component: Dashboard,
});

function Dashboard() {
  const overviewFn = useServerFn(getMyFinanceOverview);
  const walletFn = useServerFn(getMyWallet);
  const { data: o } = useQuery({ queryKey: ["producer", "overview"], queryFn: () => overviewFn() });
  const { data: w } = useQuery({ queryKey: ["producer", "wallet"], queryFn: () => walletFn() });

  // Monitora e celebra desbloqueio de novas placas com base no faturamento total
  usePlaqueWatcher(o?.total_revenue_cents);

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-5 md:space-y-8">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] items-start">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold font-semibold">
            Dashboard financeiro
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-bold mt-2">A sua operação hoje</h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe faturamento, comissões, saldo e crescimento em tempo real.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/produtor/saques">
            <Button variant="outline">
              <Wallet className="h-4 w-4 mr-1" />
              Saques
            </Button>
          </Link>
          <Link to="/produtor/novo">
            <Button className="gradient-brand text-primary-foreground shadow-glow">
              <Plus className="h-4 w-4 mr-1" />
              Novo produto
            </Button>
          </Link>
        </div>
      </div>

      {/* BANNER DE NOTIFICAÇÕES PUSH MESMO COM NAVEGADOR FECHADO */}
      <PushSalesNotificationBanner variant="card" />

      {/* CARD SIMPLES: PULSEIRA DE PRIMEIRA VENDA */}
      <div className="rounded-2xl border border-gold/40 bg-card/90 p-4 sm:p-5 shadow-card">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
          <div className="shrink-0 w-32 sm:w-40 aspect-[4/3] rounded-xl overflow-hidden border border-gold/40 bg-card shadow-md">
            <img
              src="/src/assets/images/infropay_wristband_first_sale_1792134398670.jpg"
              alt="Pulseira Primeira Venda InfroPay"
              width={320}
              height={240}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Pulseira da Primeira Venda
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              Faça a sua primeira venda e receba a pulseira de primeira venda da InfroPay.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <Link to="/produtor/conquistas">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gold/40 text-gold hover:bg-gold/10 text-xs"
                >
                  Ver Conquistas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <WalletCard
          tone="brand"
          icon={Wallet}
          label="Saldo disponível"
          value={kz(w?.available_cents ?? 0)}
          hint="Pronto para saque"
        />
        <WalletCard
          tone="gold"
          icon={Clock}
          label="Saldo bloqueado"
          value={kz(w?.pending_cents ?? 0)}
          hint="Liberação em no mínimo 1h"
        />
        <WalletCard
          tone="muted"
          icon={Receipt}
          label="Comissões pagas"
          value={kz(o?.totalFees ?? 0)}
          hint="2% por venda"
        />
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={DollarSign}
          label="Hoje"
          value={kz(o?.today.gross ?? 0)}
          sub={`${o?.today.count ?? 0} vendas`}
        />
        <Kpi
          icon={TrendingUp}
          label="Últimos 7 dias"
          value={kz(o?.week.gross ?? 0)}
          sub={`${o?.week.count ?? 0} vendas`}
        />
        <Kpi
          icon={TrendingUp}
          label="Este mês"
          value={kz(o?.month.gross ?? 0)}
          sub={`${o?.month.count ?? 0} vendas`}
        />
        <Kpi
          icon={Package}
          label="Ticket médio"
          value={kz(o?.avgTicket ?? 0)}
          sub={`${o?.salesCount ?? 0} totais`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="min-w-0 lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                Faturamento — últimos 14 dias
              </div>
              <div className="font-display text-xl font-semibold mt-1">Evolução das vendas</div>
            </div>
          </div>
          <div className="min-w-0 h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={o?.series ?? []}>
                <defs>
                  <linearGradient id="gGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} width={40} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                  formatter={(v: any) => new Intl.NumberFormat("pt-AO").format(v) + " Kz"}
                />
                <Area
                  type="monotone"
                  dataKey="gross"
                  stroke="var(--color-primary)"
                  fill="url(#gGross)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="var(--color-gold)"
                  fill="url(#gNet)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Volume diário
          </div>
          <div className="font-display text-xl font-semibold mt-1">Nº de vendas</div>
          <div className="min-w-0 h-48 sm:h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={o?.series ?? []}>
                <CartesianGrid stroke="var(--color-border)" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <FeeBanner />

      {/* Top produtos */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Melhor desempenho
            </div>
            <h2 className="font-display font-semibold text-lg">Top produtos (privado)</h2>
          </div>
          <Link
            to="/produtor/produtos"
            className="text-sm text-primary-glow hover:underline inline-flex items-center"
          >
            Ver todos <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
        {!o?.topProducts?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Ainda sem vendas concluídas. Divulgue os seus produtos para começar.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {o.topProducts.map((p: any, i: number) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="w-8 text-center font-display font-bold text-gold">{i + 1}</div>
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-gold/10 shrink-0">
                  {p.cover_url && (
                    <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{p.count} vendas</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-semibold">{kz(p.net)}</div>
                  <div className="text-[10px] text-muted-foreground">líquido</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductMetrics />
    </div>
  );
}

function ProductMetrics() {
  const metricsFn = useServerFn(getMyProductMetrics);
  const { data: rows } = useQuery({
    queryKey: ["producer", "product-metrics"],
    queryFn: () => metricsFn(),
  });

  if (!rows?.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Desempenho por produto
        </div>
        <h2 className="font-display font-semibold text-lg">Métricas detalhadas</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Produto</th>
              <th className="px-4 py-3 text-right font-medium">Views</th>
              <th className="px-4 py-3 text-right font-medium">Cliques</th>
              <th className="px-4 py-3 text-right font-medium">Conversão</th>
              <th className="px-4 py-3 text-right font-medium">Vendas</th>
              <th className="px-4 py-3 text-right font-medium">Receita</th>
              <th className="px-4 py-3 text-right font-medium">Afiliados</th>
              <th className="px-4 py-3 text-right font-medium">Com. paga</th>
              <th className="px-4 py-3 text-right font-medium">Com. pendente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/20">
                <td className="px-4 py-3">
                  <Link
                    to="/produtor/editar/$id"
                    params={{ id: r.id }}
                    className="flex items-center gap-3 min-w-0 hover:text-primary-glow"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-gold/10">
                      {r.cover_url && (
                        <img
                          src={r.cover_url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <span className="max-w-52 truncate font-medium">{r.title}</span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">{r.views}</td>
                <td className="px-4 py-3 text-right">{r.clicks}</td>
                <td className="px-4 py-3 text-right">{r.conversion.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right font-semibold">{r.sales}</td>
                <td className="px-4 py-3 text-right">{kz(r.revenue)}</td>
                <td className="px-4 py-3 text-right">{r.activeAffiliates}</td>
                <td className="px-4 py-3 text-right">{kz(r.commissionPaid)}</td>
                <td className="px-4 py-3 text-right text-gold">{kz(r.commissionPending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="mt-3 text-lg sm:text-2xl break-words font-bold font-display">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function WalletCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  hint: string;
  tone: "brand" | "gold" | "muted";
}) {
  const tones = {
    brand: "border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card",
    gold: "border-gold/40 bg-gradient-to-br from-gold/15 via-card to-card",
    muted: "border-border bg-card",
  } as const;
  return (
    <div className={`min-w-0 rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon
          className={`h-5 w-5 ${tone === "brand" ? "text-primary-glow" : tone === "gold" ? "text-gold" : "text-muted-foreground"}`}
        />
      </div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
