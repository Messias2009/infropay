import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useEffect } from "react";
import { ShoppingBag, ShieldCheck, Zap, Star, ArrowLeft, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/lib/catalog.functions";
import { getProductTracking } from "@/lib/tracking.functions";
import { registerAffiliateClick } from "@/lib/affiliate.functions";
import { saveRef } from "@/lib/affiliate-ref";
import { TrackingScripts } from "@/components/TrackingScripts";
import { useQuery } from "@tanstack/react-query";

const opt = (slug: string) => queryOptions({
  queryKey: ["product", slug],
  queryFn: () => getProductBySlug({ data: { slug } }),
});

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(opt(params.slug));
    if (!data) throw notFound();
  },
  head: ({ loaderData: _l, params }) => ({
    meta: [
      { title: `${params.slug} — InfroPay` },
      { name: "description", content: "Detalhes do produto na InfroPay." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm text-destructive">{(error as Error).message}</div>,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Produto não encontrado</h1>
        <p className="mt-2 text-muted-foreground">O produto que procura não está disponível.</p>
        <Link to="/loja" className="inline-block mt-6"><Button>Voltar à loja</Button></Link>
      </div>
    </SiteLayout>
  ),
  component: Produto,
});

function fmt(cents: number, currency: string) {
  try { return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100); }
  catch { return `${currency} ${(cents/100).toFixed(2)}`; }
}

function Produto() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(opt(slug));
  const { data: tracking } = useQuery({
    queryKey: ["tracking", "product", slug],
    queryFn: () => getProductTracking({ data: { slug } }),
    staleTime: 5 * 60_000,
  });
  if (!p) return null;
  const hasPromo = p.promo_price_cents && p.promo_price_cents < p.price_cents;

  return (
    <SiteLayout>
      <TrackingScripts
        config={tracking}
        event={{ type: "ViewContent", id: p.id, name: p.title, value: (p.promo_price_cents && p.promo_price_cents < p.price_cents ? p.promo_price_cents : p.price_cents) / 100, currency: p.currency }}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Link to="/loja" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar à loja
        </Link>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          <div>
            <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/20 to-gold/10">
              {p.cover_url ? (
                <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center text-muted-foreground/40">
                  <ShoppingBag className="h-16 w-16" />
                </div>
              )}
            </div>

            <div className="mt-8">
              {p.category && (
                <div className="inline-block rounded-full glass px-3 py-1 text-xs font-medium mb-3">{(p.category as any).name}</div>
              )}
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{p.title}</h1>
              {p.short_description && (
                <p className="mt-4 text-lg text-muted-foreground">{p.short_description}</p>
              )}

              {p.description && (
                <div className="mt-10 prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90">
                  {p.description}
                </div>
              )}

              <div className="mt-12 grid sm:grid-cols-3 gap-4">
                <Benefit icon={ShieldCheck} title="Garantia" desc={`${p.guarantee_days ?? 7} dias`} />
                <Benefit icon={Zap} title="Acesso" desc="Entrega imediata" />
                <Benefit icon={Users} title="Vendas" desc={`${p.sales_count} vendidos`} />
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              {hasPromo ? (
                <>
                  <div className="text-sm text-muted-foreground line-through">{fmt(p.price_cents, p.currency)}</div>
                  <div className="text-4xl font-bold text-gradient-gold">{fmt(p.promo_price_cents!, p.currency)}</div>
                </>
              ) : (
                <div className="text-4xl font-bold">{fmt(p.price_cents, p.currency)}</div>
              )}

              <Link to="/checkout/$slug" params={{ slug }} className="mt-6 block">
                <Button size="lg" className="w-full gradient-brand text-primary-foreground shadow-glow h-12 text-base">
                  Comprar agora
                </Button>
              </Link>

              <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Compra protegida</li>
                <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-gold" /> Download imediato após pagamento</li>
                <li className="flex items-center gap-2"><Star className="h-4 w-4 text-gold" /> {(p.rating ?? 0).toFixed(1)} ({p.reviews_count ?? 0} avaliações)</li>
              </ul>

              {p.producer && (
                <div className="mt-6 pt-6 border-t border-border flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center overflow-hidden">
                    {(p.producer as any).avatar_url ? <img src={(p.producer as any).avatar_url} className="h-full w-full object-cover" /> : <Users className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="text-sm">
                    <div className="text-xs text-muted-foreground">Produtor</div>
                    <div className="font-semibold">{(p.producer as any).full_name ?? (p.producer as any).username ?? "Anónimo"}</div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Benefit({ icon: Icon, title, desc }: { icon: React.ComponentType<{className?:string}>; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <Icon className="h-5 w-5 text-gold" />
      <div className="mt-2 font-semibold text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}
