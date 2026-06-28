import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Package, TrendingUp, Eye, DollarSign, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMyProducts, getMyProducerStats } from "@/lib/products.functions";

export const Route = createFileRoute("/_authenticated/produtor/")({
  component: Dashboard,
});

function Dashboard() {
  const statsFn = useServerFn(getMyProducerStats);
  const productsFn = useServerFn(listMyProducts);
  const { data: stats } = useQuery({ queryKey: ["producer", "stats"], queryFn: () => statsFn() });
  const { data: products } = useQuery({ queryKey: ["producer", "products"], queryFn: () => productsFn() });

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold font-semibold">Dashboard</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Bem-vindo ao painel</h1>
          <p className="mt-2 text-muted-foreground">Gira os seus produtos e acompanhe as suas vendas.</p>
        </div>
        <Link to="/produtor/novo"><Button className="gradient-brand text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1" />Novo produto</Button></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Package} label="Produtos" value={stats?.total ?? 0} hint={`${stats?.published ?? 0} publicados`} />
        <StatCard icon={TrendingUp} label="Vendas totais" value={stats?.totalSales ?? 0} />
        <StatCard icon={Eye} label="Visualizações" value={stats?.totalViews ?? 0} />
        <StatCard icon={DollarSign} label="Rascunhos" value={stats?.drafts ?? 0} />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">Os meus produtos</h2>
          <Link to="/produtor/novo" className="text-sm text-primary-glow hover:underline inline-flex items-center">Adicionar <ArrowRight className="h-3 w-3 ml-1" /></Link>
        </div>
        {!products || products.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center mx-auto"><Package className="h-7 w-7 text-primary-glow" /></div>
            <h3 className="font-display text-xl font-semibold mt-4">Ainda sem produtos</h3>
            <p className="text-sm text-muted-foreground mt-1">Crie o seu primeiro produto e comece a vender.</p>
            <Link to="/produtor/novo" className="inline-block mt-6"><Button className="gradient-brand text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1" />Criar produto</Button></Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {products.map((p) => (
              <Link key={p.id} to="/produto/$slug" params={{ slug: p.slug }} className="flex items-center gap-4 p-4 hover:bg-accent/30 transition">
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-gold/10 shrink-0">
                  {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{(p.category as any)?.name ?? "Sem categoria"} · {p.sales_count} vendas</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === "publicado" ? "bg-success/15 text-success" : p.status === "rascunho" ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning"}`}>
                  {p.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{className?:string}>; label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="mt-3 text-3xl font-bold font-display">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
