import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Palette, Package, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMyProducts } from "@/lib/products.functions";
import { productLinks } from "@/lib/product-links";

export const Route = createFileRoute("/_authenticated/produtor/checkout/")({
  head: () => ({
    meta: [
      { title: "Checkout personalizado — InfroPay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutHub,
});

const THEME_LABEL: Record<string, string> = {
  azul: "Azul InfroPay",
  dourado: "Dourado Imperial",
  verde: "Verde",
};

function CheckoutHub() {
  const fn = useServerFn(listMyProducts);
  const { data: products, isLoading } = useQuery({
    queryKey: ["producer", "products"],
    queryFn: () => fn(),
  });

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 md:p-10 max-w-5xl mx-auto space-y-5">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">
          Checkout personalizado
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-2">
          O checkout com a sua marca
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha um produto para colocar o seu logótipo, banner, nome da marca e cor do botão.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-card/60 animate-pulse" />
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
          <Package className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Ainda não tem produtos. Crie um para personalizar o checkout.
          </p>
          <Button asChild className="gradient-brand text-primary-foreground">
            <Link to="/produtor/novo">
              <Plus className="h-4 w-4 mr-1" /> Novo produto
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((p: any) => {
            const customized = Boolean(
              p.checkout_brand_name || p.checkout_logo_url || p.checkout_banner_url,
            );
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 sm:p-4"
              >
                <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-muted">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {customized ? "Personalizado" : "Padrão InfroPay"} ·{" "}
                    {THEME_LABEL[p.checkout_theme ?? "azul"] ?? "Azul InfroPay"}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {p.slug && (
                    <Button asChild size="icon" variant="outline" aria-label="Ver checkout">
                      <a href={productLinks(p.slug).checkout} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button asChild size="sm" className="gradient-brand text-primary-foreground">
                    <Link to="/produtor/checkout/$id" params={{ id: p.id }}>
                      <Palette className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Personalizar</span>
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
