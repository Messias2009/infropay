import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMyProducts } from "@/lib/products.functions";

export const Route = createFileRoute("/_authenticated/produtor/produtos")({
  component: MeusProdutos,
});

function fmt(cents: number, currency: string) {
  try { return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents/100); }
  catch { return `${currency} ${(cents/100).toFixed(2)}`; }
}

function MeusProdutos() {
  const fn = useServerFn(listMyProducts);
  const { data: products } = useQuery({ queryKey: ["producer", "products"], queryFn: () => fn() });

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold font-semibold">Catálogo</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Os meus produtos</h1>
        </div>
        <Link to="/produtor/novo"><Button className="gradient-brand text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1" />Novo produto</Button></Link>
      </div>

      {!products || products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
          <Package className="h-12 w-12 text-gold mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold">Sem produtos ainda</h3>
          <Link to="/produtor/novo" className="inline-block mt-4"><Button className="gradient-brand text-primary-foreground">Criar primeiro produto</Button></Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <Link key={p.id} to="/produto/$slug" params={{ slug: p.slug }} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/60 hover:shadow-glow transition">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-gold/10">
                {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${p.status === "publicado" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                  <span className="text-xs text-muted-foreground">{p.sales_count} vendas</span>
                </div>
                <h3 className="font-semibold mt-2 line-clamp-2">{p.title}</h3>
                <div className="mt-3 font-bold text-gradient-gold">{fmt(p.price_cents, p.currency)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
