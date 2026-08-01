import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Zap, TrendingUp, Users, Trophy, Rocket, Play, CheckCircle2, Quote, Crown, Award, Gem } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { TrustMarquee } from "@/components/site/TrustMarquee";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { listPublishedProducts } from "@/lib/catalog.functions";
import heroBg from "@/assets/hero-premium.jpg";
import bannerGanhe from "@/assets/banner-ganhe.jpg";
import bannerProdutores from "@/assets/banner-produtores.jpg";
import bannerLegends from "@/assets/banner-legends.jpg";
import dashboardImg from "@/assets/dashboard-preview.jpg";

const popularQuery = queryOptions({ queryKey: ["products", "popular"], queryFn: () => listPublishedProducts({ data: { limit: 8 } }) });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InfroPay — Transformando conhecimento em renda em Angola" },
      { name: "description", content: "A plataforma premium de infoprodutos em Angola. Cursos, ebooks, templates e mentorias com checkout Multicaixa. Comissão de 2%, saque em Kz, entrega imediata." },
      { property: "og:title", content: "InfroPay — Transformando conhecimento em renda" },
      { property: "og:description", content: "A plataforma premium para produtores digitais angolanos." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(popularQuery);
  },
  component: Home,
});

function Home() {
  const { data: products } = useSuspenseQuery(popularQuery);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <img src={heroBg} alt="" width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)_0%,_transparent_60%)] opacity-25" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-24 md:pt-28 md:pb-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground animate-fade-in">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Feito em Angola · Pagamento em Kwanza
            </div>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] animate-fade-in">
              Transformando<br />
              <span className="text-gradient-gold">conhecimento</span><br />
              em renda.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              A plataforma premium para vender infoprodutos em Angola. Checkout Multicaixa, saque em Kz e a menor comissão do mercado.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/loja">
                <Button size="lg" className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90 h-12 px-6">
                  Explorar loja <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" variant="outline" className="h-12 px-6 border-gold/40 hover:bg-gold/10 hover:border-gold">
                  <Rocket className="mr-2 h-4 w-4" /> Tornar-se produtor
                </Button>
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg">
              <Stat value="2%" label="Comissão por venda" />
              <Stat value="8%" label="Taxa de saque" />
              <Stat value="1h" label="Liberação em no mínimo 1 hora após aprovação" />
            </div>

          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW — animated */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 -mt-8 md:-mt-16">
        <div className="relative rounded-3xl border border-primary/25 overflow-hidden bg-card animate-fade-in">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full gradient-brand opacity-30 blur-3xl animate-glow-pulse" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full gradient-gold opacity-20 blur-3xl animate-floaty" />
          </div>
          <div className="relative p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              <div className="ml-3 text-[11px] text-muted-foreground truncate">app.infropay.com / dashboard</div>
            </div>
            <img
              src={dashboardImg}
              alt="Prévia do painel financeiro InfroPay"
              width={1600}
              height={1024}
              loading="lazy"
              className="w-full h-auto rounded-xl object-cover animate-floaty"
              style={{ animationDuration: "6s" }}
            />
          </div>
        </div>

        {/* PLATFORM LIVE STATS — animated numbers */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {[
            { icon: TrendingUp, label: "Faturado na plataforma", value: 128_540_000, prefix: "", suffix: " Kz", accent: "text-gold", ring: "border-gold/30" },
            { icon: Users,      label: "Produtores ativos",      value: 1284,        prefix: "+", suffix: "",    accent: "text-primary-glow", ring: "border-primary/30" },
            { icon: ShieldCheck,label: "Vendas processadas",     value: 8720,        prefix: "+", suffix: "",    accent: "text-success",  ring: "border-success/30" },
            { icon: Zap,        label: "Liberação mínima",       value: 1,           prefix: "", suffix: " h",   accent: "text-gold", ring: "border-gold/30" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`relative rounded-2xl border ${s.ring} bg-card/70 backdrop-blur p-4 md:p-5 overflow-hidden`}>
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full gradient-brand opacity-10 blur-2xl animate-glow-pulse" />
                <div className="relative flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl grid place-items-center bg-card border ${s.ring}`}>
                    <Icon className={`h-5 w-5 ${s.accent}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">{s.label}</div>
                    <div className={`font-display font-bold text-xl md:text-2xl ${s.accent}`}>
                      <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* PLACAS / TIER PREVIEW — animated badges */}
        <div className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">Conquistas InfroPay</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">
              Ganhe <span className="text-shimmer">placas oficiais</span> a cada meta
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">Do Bronze ao Infinito — 10 níveis desbloqueáveis por faturamento.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Prata",    goal: "100k Kz",  Icon: Award,  grad: "linear-gradient(135deg,#7C7C7C,#E8E8E8)", color: "#C0C0C0" },
              { name: "Ouro",     goal: "500k Kz",  Icon: Trophy, grad: "linear-gradient(135deg,#B8860B,#FFD700)", color: "#F9A825" },
              { name: "Diamante", goal: "5M Kz",    Icon: Gem,    grad: "linear-gradient(135deg,#4FC3F7,#B9F2FF)", color: "#B9F2FF" },
              { name: "Lenda",    goal: "50M Kz",   Icon: Crown,  grad: "linear-gradient(135deg,#006064,#4DD0E1)", color: "#00BCD4" },
            ].map((b, i) => {
              const Icon = b.Icon;
              return (
                <div
                  key={b.name}
                  className="badge-shine relative rounded-2xl border p-5 overflow-hidden"
                  style={{ borderColor: b.color + "60", animationDelay: `${i * 0.2}s` }}
                >
                  <div className="absolute inset-0 opacity-25 animate-bg-pan" style={{ background: b.grad, backgroundSize: "200% 200%" }} />
                  <div className="relative flex flex-col items-center text-center">
                    <div
                      className="h-16 w-16 rounded-2xl grid place-items-center mb-3 animate-floaty"
                      style={{ background: b.grad, boxShadow: `0 8px 30px -8px ${b.color}` }}
                    >
                      <Icon className="h-8 w-8 text-white drop-shadow" />
                    </div>
                    <div className="font-display text-lg font-bold" style={{ color: b.color }}>{b.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Meta: {b.goal}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Link to="/legends" className="inline-flex items-center gap-1 text-sm text-gold hover:opacity-80">
              Ver todas as placas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>


      {/* TRUST STRIP — carrossel infinito */}
      <TrustMarquee />


      {/* BANNER — GANHE ONLINE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-20">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 min-h-[280px] md:min-h-[340px]">
          <img src={bannerGanhe} alt="" width={1600} height={900} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
          <div className="relative p-8 md:p-14 max-w-xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">Ganhe online</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold leading-tight">
              O seu <span className="text-gradient-gold">primeiro Kz</span><br />pode ser hoje.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Publique o seu curso, ebook ou template em minutos e comece a vender.
            </p>
            <Link to="/auth" search={{ mode: "signup" }} className="mt-6 inline-block">
              <Button size="lg" className="gradient-brand text-primary-foreground shadow-glow">
                Criar conta grátis <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* PRODUTOS POPULARES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">Em destaque</div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Produtos populares</h2>
          </div>
          <Link to="/loja" className="hidden sm:inline-flex items-center text-sm text-muted-foreground hover:text-foreground shrink-0">
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
            {products.map((p) => <ProductCard key={p.slug} product={p as any} />)}
          </div>
        )}
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">Como funciona</div>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">3 passos para começar a vender</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Crie a sua conta", d: "Cadastro grátis em menos de 60 segundos.", i: Users },
            { n: "02", t: "Publique o produto", d: "Upload de capa, ficheiro e preço. Curadoria em 24h.", i: Play },
            { n: "03", t: "Receba em Kz", d: "Saque via IBAN a partir de 5.000 Kz.", i: TrendingUp },
          ].map((s) => {
            const Icon = s.i;
            return (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6 overflow-hidden">
                <div className="absolute -top-4 -right-4 text-8xl font-display font-black text-primary/5 select-none">{s.n}</div>
                <div className="relative">
                  <div className="h-11 w-11 rounded-lg gradient-brand grid place-items-center mb-4">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="text-xs font-bold text-gold">PASSO {s.n}</div>
                  <div className="mt-1 font-display text-xl font-bold">{s.t}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BANNER — LEGENDS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <Link to="/legends" className="group relative block overflow-hidden rounded-3xl border border-gold/30 min-h-[260px]">
          <img src={bannerLegends} alt="" width={1600} height={900} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:scale-105 transition duration-700" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="relative p-8 md:p-14 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium">
              <Trophy className="h-3.5 w-3.5 text-gold" /> Novo
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
              InfroPay <span className="text-gradient-gold">Legends</span>
            </h2>
            <p className="mt-3 text-muted-foreground">Ranking público dos maiores produtores. 10 níveis do Bronze ao Infinito.</p>
            <div className="mt-6 inline-flex items-center text-sm text-gold group-hover:translate-x-1 transition">
              Ver ranking <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* TESTEMUNHOS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">Testemunhos</div>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">Produtores que confiam</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "Kiala M.", r: "Autor de ebooks", t: "Vendi mais em 2 meses na InfroPay do que num ano a tentar sozinho." },
            { n: "Beatriz T.", r: "Mentora de finanças", t: "O checkout Multicaixa mudou tudo. Conversão triplicou." },
            { n: "Nuno C.", r: "Criador de cursos", t: "Suporte rápido, taxas justas, painel completo. Recomendo." },
          ].map((x) => (
            <div key={x.n} className="rounded-2xl border border-border bg-card p-6">
              <Quote className="h-6 w-6 text-gold" />
              <p className="mt-3 text-foreground/90">"{x.t}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-brand grid place-items-center font-bold text-primary-foreground">{x.n[0]}</div>
                <div>
                  <div className="font-semibold text-sm">{x.n}</div>
                  <div className="text-xs text-muted-foreground">{x.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA PRODUTOR FINAL */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 min-h-[380px]">
          <img src={bannerProdutores} alt="" width={1600} height={900} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/85 to-primary/20" />
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full gradient-brand opacity-25 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full gradient-gold opacity-15 blur-3xl" />
          <div className="relative p-10 md:p-16 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">Para produtores</div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold leading-tight">
              Venda mais com a <span className="text-gradient-gold">infraestrutura certa</span>.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Painel completo, checkout de alta conversão, área de produtor, financeiro e saques — tudo numa só plataforma.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Comissão de 2% por venda","Saque a partir de 5.000 Kz","Multicaixa Express + Referência + Transferência","Suporte em português 24/7"].map((x) => (
                <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success shrink-0" /> {x}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="gradient-brand text-primary-foreground shadow-glow h-12 px-6">
                  Criar conta de produtor <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/loja"><Button size="lg" variant="outline" className="h-12 px-6">Ver a loja</Button></Link>
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
