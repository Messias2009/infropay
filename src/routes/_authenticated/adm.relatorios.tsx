import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Download, TrendingUp, Percent, Banknote, Wallet, Clock, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlatformReport, exportCsv } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/adm/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Admin InfroPay" },
      { name: "description", content: "Faturamento, comissões e desempenho global da plataforma." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function kz(cents: number) {
  return new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(cents / 100) + " Kz";
}

function Page() {
  const reportFn = useServerFn(getPlatformReport);
  const csvFn = useServerFn(exportCsv);
  const { data, isLoading } = useQuery({ queryKey: ["adm", "report"], queryFn: () => reportFn() });

  async function download(kind: "pedidos" | "produtores" | "produtos") {
    try {
      const csv = await csvFn({ data: { kind } });
      const blob = new Blob([csv as string], { type: "text/csv;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `infropay-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isLoading || !data)
    return <div className="p-10 text-sm text-muted-foreground">A carregar relatórios...</div>;
  const t = data.totals;

  const cards = [
    { icon: TrendingUp, label: "Faturamento total", value: kz(t.gross_cents), accent: "text-gold" },
    {
      icon: Percent,
      label: "Comissões retidas (2%)",
      value: kz(t.commissions_cents),
      accent: "text-primary-glow",
    },
    {
      icon: Handshake,
      label: "Comissões de afiliados",
      value: kz(t.affiliate_commissions_cents),
      accent: "text-gold",
    },
    {
      icon: Banknote,
      label: "Taxas de saque (8%)",
      value: kz(t.withdrawal_fees_cents),
      accent: "text-success",
    },
    { icon: Wallet, label: "Já sacado", value: kz(t.withdrawn_cents), accent: "text-foreground" },
    {
      icon: Clock,
      label: "Saques pendentes",
      value: kz(t.pending_withdrawals_cents),
      accent: "text-warning",
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold font-semibold">
            Administração
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t.sales_count} vendas pagas · {t.products_count} produtos · {t.users_count}{" "}
            utilizadores
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["pedidos", "produtores", "produtos"] as const).map((k) => (
            <Button key={k} variant="outline" size="sm" onClick={() => download(k)}>
              <Download className="h-4 w-4 mr-1" /> {k}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5">
              <Icon className={`h-5 w-5 ${c.accent}`} />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">
                {c.label}
              </div>
              <div className={`font-display text-xl font-bold mt-1 ${c.accent}`}>{c.value}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-semibold mb-4">Vendas — últimos 30 dias</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.series}>
              <defs>
                <linearGradient id="admRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => String(v).slice(5)}
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${Math.round(Number(v) / 100000)}k`}
                stroke="var(--color-muted-foreground)"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: any, n: any) =>
                  n === "total" ? [kz(Number(v)), "Faturamento"] : [v, "Vendas"]
                }
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-gold)"
                fill="url(#admRev)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Top 5 produtores</div>
          <ol className="space-y-3">
            {data.top_producers.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="h-6 w-6 rounded-lg bg-gold/15 text-gold grid place-items-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="font-medium shrink-0">{kz(p.revenue_cents)}</span>
              </li>
            ))}
            {!data.top_producers.length && (
              <li className="text-sm text-muted-foreground">Sem dados ainda.</li>
            )}
          </ol>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold mb-4">Top 5 produtos</div>
          <ol className="space-y-3">
            {data.top_products.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="h-6 w-6 rounded-lg bg-primary/15 text-primary-glow grid place-items-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="truncate">{p.title}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="font-medium">{kz(p.revenue_cents)}</span>
                  <span className="block text-[11px] text-muted-foreground">{p.sales} vendas</span>
                </span>
              </li>
            ))}
            {!data.top_products.length && (
              <li className="text-sm text-muted-foreground">Sem dados ainda.</li>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
