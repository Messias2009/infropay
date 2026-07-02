import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Zap, TrendingUp, Star, GraduationCap, BookOpen, LayoutTemplate, Users, Code2, Package, Video, Headphones, Smartphone, Plug, Wrench, Repeat } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { listCategories, listPublishedProducts } from "@/lib/catalog.functions";
import heroBg from "@/assets/hero-banner.jpg";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap, BookOpen, LayoutTemplate, Users, Code2, Package, Video, Headphones, Smartphone, Plug, Wrench, Repeat, Sparkles,
};

const categoriesQuery = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const popularQuery = queryOptions({ queryKey: ["products", "popular"], queryFn: () => listPublishedProducts({ data: { limit: 8 } }) });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InfroPay — Transformando conhecimento em renda" },
      { name: "description", content: "Marketplace premium para vender e comprar cursos, ebooks, templates, mentorias e softwares. Checkout de alta conversão e ferramentas completas para produtores." },
      { property: "og:title", content: "InfroPay — Transformando conhecimento em renda" },
      { property: "og:description", content: "A plataforma para produtores digitais sérios." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(popularQuery),
    ]);
  },
  component: Home,
});

function Home() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: products } = useSuspenseQuery(popularQuery);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img src={heroBg} alt="" width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_60%)] opacity-20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-28 md:pt-32 md:pb-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Novo · Checkout one-page com PIX, Multicaixa e Cartão
            </div>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Transformando<br />
              <span className="text-gradient-gold">conhecimento</span><br />
              em renda.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              A plataforma premium para vender infoprodutos com a conversão das maiores do mercado — sem complicação técnica.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/loja">
                <Button size="lg" className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90 h-12 px-6">
                  Comprar agora
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" variant="outline" className="h-12 px-6 border-gold/40 hover:bg-gold/10 hover:border-gold">
                  Tornar-se produtor
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              <Stat value="10k+" label="Produtores" />
              <Stat value="0%" label="Setup" />
              <Stat value="24/7" label="Suporte" />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Feature icon={ShieldCheck} title="Compra protegida" desc="Garantia em todas as ordens" />
          <Feature icon={Zap} title="Entrega instantânea" desc="Download liberado após pagamento" />
          <Feature icon={TrendingUp} title="Alta conversão" desc="Checkout otimizado" />
          <Feature icon={Star} title="Curadoria premium" desc="Produtos verificados" />
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">Categorias</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Explore por formato</h2>
          </div>
          <Link to="/loja" className="hidden sm:inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            Ver tudo <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((c) => {
            const Icon = ICONS[c.icon ?? "Sparkles"] ?? Sparkles;
            return (
              <Link
                key={c.id}
                to="/loja"
                search={{ cat: c.slug }}
                className="group rounded-xl border border-border/60 bg-card/60 p-4 hover:border-primary/60 hover:bg-card hover:shadow-glow transition-all"
              >
                <div className="h-10 w-10 rounded-lg gradient-brand grid place-items-center mb-3 group-hover:scale-110 transition">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="font-semibold text-sm">{c.name}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* PRODUTOS POPULARES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">Em destaque</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Produtos populares</h2>
          </div>
          <Link to="/loja" className="hidden sm:inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            Ver loja <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <Sparkles className="h-10 w-10 text-gold mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold">Seja o primeiro produtor</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Ainda não há produtos publicados. Crie a sua conta e seja pioneiro na InfroPay.
            </p>
            <Link to="/auth" search={{ mode: "signup" }} className="inline-block mt-6">
              <Button className="gradient-brand text-primary-foreground shadow-glow">Começar agora</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p as any} />
            ))}
          </div>
        )}
      </section>

      {/* CTA PRODUTOR */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-card via-card to-primary/10 p-10 md:p-16">
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full gradient-brand opacity-30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full gradient-gold opacity-20 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">Para produtores</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold leading-tight">
              Venda mais com a <span className="text-gradient-gold">infraestrutura certa</span>.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Painel completo, checkout de alta conversão, área de membros, afiliados, integrações e pixels — tudo numa só plataforma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="gradient-brand text-primary-foreground shadow-glow h-12 px-6">
                  Criar conta de produtor
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/loja">
                <Button size="lg" variant="outline" className="h-12 px-6">
                  Ver a loja
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-bold text-gradient-gold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
        <Icon className="h-5 w-5 text-primary-glow" />
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}
