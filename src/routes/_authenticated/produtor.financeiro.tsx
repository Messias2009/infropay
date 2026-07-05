import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wallet, TrendingUp, ArrowUpRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyFinanceOverview, getMyWallet, listMyTransactions } from "@/lib/finance.functions";
import { FeeBanner, kz } from "@/components/finance/FeeBanner";

export const Route = createFileRoute("/_authenticated/produtor/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — InfroPay" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const methodLabel: Record<string,string> = {
  multicaixa_express: "Multicaixa Express",
  referencia: "Referência",
  transferencia: "Transferência",
};

function Page() {
  const walletFn = useServerFn(getMyWallet);
  const txFn = useServerFn(listMyTransactions);
  const ovFn = useServerFn(getMyFinanceOverview);
  const { data: w } = useQuery({ queryKey: ["producer","wallet"], queryFn: () => walletFn() });
  const { data: tx } = useQuery({ queryKey: ["producer","tx"], queryFn: () => txFn() });
  const { data: ov } = useQuery({ queryKey: ["producer","overview"], queryFn: () => ovFn() });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Financeiro</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Carteira & Transações</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/15 via-card to-card p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Faturamento total</div>
            <TrendingUp className="h-5 w-5 text-gold" />
          </div>
          <div className="font-display text-3xl font-bold mt-3 text-gradient-gold">{kz(ov?.totalGross ?? 0)}</div>
          <div className="mt-2 text-xs text-muted-foreground">{ov?.salesCount ?? 0} vendas pagas · Líquido {kz(ov?.totalNet ?? 0)}</div>
        </div>
        <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Disponível para saque</div>
            <Wallet className="h-5 w-5 text-primary-glow" />
          </div>
          <div className="font-display text-3xl font-bold mt-3">{kz(w?.available_cents ?? 0)}</div>
          <Link to="/produtor/saques" className="inline-block mt-4"><Button size="sm" className="gradient-brand text-primary-foreground shadow-glow">Solicitar saque <ArrowUpRight className="h-4 w-4 ml-1" /></Button></Link>
        </div>
        <div className="rounded-2xl border border-success/40 bg-gradient-to-br from-success/15 via-card to-card p-6">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Liberação imediata</div>
            <Zap className="h-5 w-5 text-success" />
          </div>
          <div className="font-display text-3xl font-bold mt-3">0h</div>
          <div className="mt-2 text-xs text-muted-foreground">Assim que a venda é paga, o valor líquido entra direto no saldo disponível.</div>
        </div>
      </div>

      <FeeBanner />

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">Histórico de transações</h2>
        </div>
        {!tx?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Sem transações registadas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Produto</th>
                  <th className="px-6 py-3">Comprador</th>
                  <th className="px-6 py-3">Método</th>
                  <th className="px-6 py-3 text-right">Bruto</th>
                  <th className="px-6 py-3 text-right">Taxa</th>
                  <th className="px-6 py-3 text-right">Líquido</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tx.map((t: any) => (
                  <tr key={t.id}>
                    <td className="px-6 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-AO")}</td>
                    <td className="px-6 py-3 font-medium truncate max-w-[200px]">{t.product?.title ?? "—"}</td>
                    <td className="px-6 py-3 text-muted-foreground">{t.buyer_name ?? t.buyer_email ?? "—"}</td>
                    <td className="px-6 py-3 text-xs">{methodLabel[t.payment_method] ?? t.payment_method}</td>
                    <td className="px-6 py-3 text-right font-mono">{kz(t.gross_cents)}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground text-xs">-{kz(t.platform_fee_cents)}</td>
                    <td className="px-6 py-3 text-right font-mono font-semibold">{kz(t.net_cents)}</td>
                    <td className="px-6 py-3"><StatusPill status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string,string> = {
    pago: "bg-success/15 text-success",
    pendente: "bg-warning/15 text-warning",
    reembolsado: "bg-destructive/15 text-destructive",
    cancelado: "bg-muted text-muted-foreground",
  };
  return <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>{status}</span>;
}
