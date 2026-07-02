import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Package, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listMyProducts, submitProductForApproval } from "@/lib/products.functions";

export const Route = createFileRoute("/_authenticated/produtor/produtos")({
  component: MeusProdutos,
});

function fmt(cents: number, currency: string) {
  try { return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents/100); }
  catch { return `${currency} ${(cents/100).toFixed(2)}`; }
}

const BADGE: Record<string, string> = {
  publicado: "bg-success/15 text-success",
  em_analise: "bg-gold/15 text-gold",
  rascunho: "bg-muted text-muted-foreground",
  pausado: "bg-warning/15 text-warning",
};
const LABEL: Record<string, string> = {
  publicado: "Publicado", em_analise: "Em análise", rascunho: "Rascunho", pausado: "Pausado",
};

function MeusProdutos() {
  const fn = useServerFn(listMyProducts);
  const submitFn = useServerFn(submitProductForApproval);
  const { data: products, refetch } = useQuery({ queryKey: ["producer", "products"], queryFn: () => fn() });

  async function submitOne(id: string) {
    try { await submitFn({ data: { id } }); toast.success("Enviado para aprovação"); refetch(); }
    catch (e) { toast.error((e as Error).message); }
  }

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
            <div key={p.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/60 hover:shadow-glow transition group">
              <Link to="/produtor/editar/$id" params={{ id: p.id }} className="block">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-gold/10 relative">
                  {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${BADGE[p.status] ?? BADGE.rascunho}`}>{LABEL[p.status] ?? p.status}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold line-clamp-2">{p.title}</h3>
                  {p.rejection_reason && <p className="text-xs text-destructive mt-1">Rejeitado: {p.rejection_reason}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div className="font-bold text-gradient-gold">{fmt(p.price_cents, p.currency)}</div>
                    <div className="text-xs text-muted-foreground">{p.sales_count} vendas</div>
                  </div>
                </div>
              </Link>
              <div className="px-4 pb-4 flex gap-2">
                <Link to="/produtor/editar/$id" params={{ id: p.id }} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full"><Pencil className="h-3.5 w-3.5 mr-1" />Editar</Button>
                </Link>
                {(p.status === "rascunho" || p.status === "pausado") && (
                  <Button size="sm" onClick={() => submitOne(p.id)} className="gradient-brand text-primary-foreground">
                    <Send className="h-3.5 w-3.5 mr-1" />Publicar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
