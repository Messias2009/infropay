import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllProductsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/adm/produtos")({
  component: TodosProdutos,
});

function fmt(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

const BADGE: Record<string, string> = {
  publicado: "bg-success/15 text-success",
  em_analise: "bg-gold/15 text-gold",
  rascunho: "bg-muted text-muted-foreground",
  pausado: "bg-warning/15 text-warning",
};

function TodosProdutos() {
  const fn = useServerFn(listAllProductsAdmin);
  const { data } = useQuery({ queryKey: ["admin", "all-products"], queryFn: () => fn() });

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="text-xs uppercase tracking-widest text-gold font-semibold">Administração</div>
      <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Todos os produtos</h1>

      <div className="mt-8 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_120px] gap-4 px-5 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
          <div>Produto</div>
          <div>Estado</div>
          <div>Preço</div>
          <div>Vendas</div>
        </div>
        {(data ?? []).map((p: any) => (
          <Link
            key={p.id}
            to="/produto/$slug"
            params={{ slug: p.slug }}
            className="grid grid-cols-[1fr_120px_120px_120px] gap-4 px-5 py-3 border-b border-border last:border-0 items-center hover:bg-accent/30"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-gold/10 overflow-hidden shrink-0">
                {p.cover_url && (
                  <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{p.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.producer?.full_name ?? "—"}
                </div>
              </div>
            </div>
            <div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${BADGE[p.status] ?? BADGE.rascunho}`}
              >
                {p.status}
              </span>
            </div>
            <div className="text-sm">{fmt(p.price_cents, p.currency)}</div>
            <div className="text-sm">{p.sales_count}</div>
          </Link>
        ))}
        {(!data || data.length === 0) && (
          <div className="p-10 text-center text-muted-foreground">Sem produtos.</div>
        )}
      </div>
    </div>
  );
}
