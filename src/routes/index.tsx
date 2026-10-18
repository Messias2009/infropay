import { useState, useEffect } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Users,
  Trophy,
  Rocket,
  Play,
  CheckCircle2,
  Quote,
  Crown,
  Award,
  Gem,
  Percent,
  ArrowDownToLine,
  Clock,
  Store,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { TrustMarquee } from "@/components/site/TrustMarquee";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { WristbandModal } from "@/components/marketing/WristbandModal";
import bannerGanhe from "@/assets/banner-ganhe.jpg";
import bannerProdutores from "@/assets/banner-produtores.jpg";
import bannerLegends from "@/assets/banner-legends.jpg";
import dashboardImg from "@/assets/dashboard-preview.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InfroPay — Transformando conhecimento em renda em Angola" },
      {
        name: "description",
        content:
          "A plataforma premium de infoprodutos em Angola. Cursos, ebooks, templates e mentorias com checkout Multicaixa. Comissão de 2%, saque em Kz, entrega imediata.",
      },
      { property: "og:title", content: "InfroPay — Transformando conhecimento em renda" },
      {
        property: "og:description",
        content: "A plataforma premium para produtores digitais angolanos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const { user, loading } = useAuth();
  const [showWristbandModal, setShowWristbandModal] = useState(false);

  useEffect(() => {
    // Show wristband popup once per session if not dismissed
    if (typeof window === "undefined") return;
    const dismissed = window.sessionStorage.getItem("infropay_wristband_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowWristbandModal(true);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseWristband = () => {
    setShowWristbandModal(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("infropay_wristband_dismissed", "true");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        A preparar a InfroPay…
      </div>
    );
  if (user) return <Navigate to="/produtor" replace />;

  return (
    <SiteLayout>
      {/* HERO — Fundo com gradiente escuro premium de alta legibilidade (sem letras) */}
      <section className="relative overflow-hidden bg-background">
        {/* Glows de ambientação sem interferir na leitura */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-primary/20 blur-[130px] rounded-full" />
          <div className="absolute top-1/4 -right-28 w-[400px] h-[400px] bg-gold/15 blur-[110px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[300px] bg-primary/15 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.55_0.19_255_/_0.15)_0%,_transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground animate-fade-in border border-border/80">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>InfroPay · Pagamento instantâneo em Kwanza</span>
            </div>
            <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] animate-fade-in">
              Transformando
              <br />
              <span className="text-gradient-gold">conhecimento</span>
              <br />
              em renda.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Venda cursos, ebooks e mentorias com checkout Multicaixa de alta conversão, dinheiro
              liberado em 1 hora e apenas 2% de comissão — a menor taxa de Angola.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/loja">
                <Button
                  size="lg"
                  className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90 h-12 px-7 font-semibold"
                >
                  <Store className="mr-2 h-4 w-4" /> Comprar na loja
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 border-gold/40 hover:bg-gold/10 hover:border-gold font-semibold"
                >
                  <Rocket className="mr-2 h-4 w-4 text-gold" /> Começar a vender grátis
                </Button>
              </Link>
            </div>

            {/* BANNER DE TAXAS EM DESTAQUE */}
            <div className="mt-12 rounded-2xl border border-gold/30 bg-card/85 backdrop-blur-md p-4 sm:p-5 shadow-gold/10 shadow-lg">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
                <div className="flex items-center gap-3.5 sm:px-2">
                  <div className="h-10 w-10 rounded-xl grid place-items-center bg-gold/10 border border-gold/30 text-gold shrink-0">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-xl sm:text-2xl font-bold text-gradient-gold whitespace-nowrap">
                      2% por venda
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      A menor comissão de Angola
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-4">
                  <div className="h-10 w-10 rounded-xl grid place-items-center bg-primary/10 border border-primary/30 text-primary-glow shrink-0">
                    <ArrowDownToLine className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-xl sm:text-2xl font-bold text-foreground whitespace-nowrap">
                      8% por saque
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Transparência sem taxas ocultas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-4">
                  <div className="h-10 w-10 rounded-xl grid place-items-center bg-success/10 border border-success/30 text-success shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-xl sm:text-2xl font-bold text-success whitespace-nowrap">
                      Saque em 1 hora
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      Liberação rápida após aprovação
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 -mt-6 md:-mt-12">
        <div className="relative rounded-3xl border border-primary/25 overflow-hidden bg-card animate-fade-in shadow-card">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full gradient-brand opacity-30 blur-3xl animate-glow-pulse" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full gradient-gold opacity-20 blur-3xl animate-floaty" />
          </div>
          <div className="relative p-4 md:p-6">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              <div className="ml-3 text-[11px] text-muted-foreground truncate font-mono">
                app.infropay.com / dashboard
              </div>
            </div>
            <img
              src={dashboardImg}
              alt="Painel real do produtor InfroPay com receita e saldo em Kwanza"
              width={1600}
              height={1024}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-auto rounded-xl object-cover animate-floaty shadow-2xl"
              style={{ animationDuration: "6s" }}
            />
          </div>
        </div>

        {/* ESTATÍSTICAS DA PLATAFORMA — SEM QUEBRAS */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {[
            {
              icon: TrendingUp,
              label: "Faturado na plataforma",
              value: 128_540_000,
              prefix: "",
              suffix: " Kz",
              accent: "text-gold",
              ring: "border-gold/30",
            },
            {
              icon: Users,
              label: "Produtores ativos",
              value: 1284,
              prefix: "+",
              suffix: "",
              accent: "text-primary-glow",
              ring: "border-primary/30",
            },
            {
              icon: ShieldCheck,
              label: "Vendas processadas",
              value: 8720,
              prefix: "+",
              suffix: "",
              accent: "text-success",
              ring: "border-success/30",
            },
            {
              icon: Zap,
              label: "Liberação mínima",
              value: 1,
              prefix: "",
              suffix: " h",
              accent: "text-gold",
              ring: "border-gold/30",
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`relative rounded-2xl border ${s.ring} bg-card/75 backdrop-blur p-4 md:p-5 overflow-hidden`}
              >
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full gradient-brand opacity-10 blur-2xl animate-glow-pulse" />
                <div className="relative flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl grid place-items-center bg-card border ${s.ring} shrink-0`}
                  >
                    <Icon className={`h-5 w-5 ${s.accent}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                      {s.label}
                    </div>
                    <div
                      className={`font-display font-bold text-base sm:text-lg lg:text-xl xl:text-2xl whitespace-nowrap overflow-hidden ${s.accent}`}
                    >
                      <CountUp to={s.value} prefix={s.prefix} suffix={s.suffix} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* PLACAS / CONQUISTAS */}
        <div className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">
              Conquistas InfroPay
            </div>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">
              Ganhe <span className="text-shimmer">reconhecimento físico</span> desde a primeira
              venda
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Da pulseira colecionável oficial às placas comemorativas por faturamento: a InfroPay
              celebra cada passo da sua jornada.
            </p>
          </div>

          {/* BOTÃO PARA VISUALIZAR A PULSEIRA OFICIAL */}
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={() => setShowWristbandModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/40 bg-gold/5 hover:bg-gold/10 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-xs"
            >
              <Trophy className="w-4 h-4 text-gold" />
              <span>Ver Prémio Oficial da 1ª Venda: Pulseira Colecionável</span>
            </button>
          </div>

          {/* 5 NÍVEIS OFICIAIS DE PREMIAÇÃO DAS PLACAS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              {
                name: "Placa de Prata",
                goal: "100k Kz",
                img: "/src/assets/images/infropay_plaque_silver_100k_1792134414511.jpg",
                color: "#C0C0C0",
              },
              {
                name: "Placa de Ouro",
                goal: "500k Kz",
                img: "/src/assets/images/infropay_plaque_gold_500k_1792134428623.jpg",
                color: "#F9A825",
              },
              {
                name: "Placa de Platina",
                goal: "1M Kz",
                img: "/src/assets/images/infropay_plaque_platinum_1m_1792134441626.jpg",
                color: "#E5E4E2",
              },
              {
                name: "Placa de Diamante",
                goal: "5M Kz",
                img: "/src/assets/images/infropay_plaque_diamond_5m_1792134454131.jpg",
                color: "#4FC3F7",
              },
              {
                name: "Placa Black Elite",
                goal: "10M Kz",
                img: "/src/assets/images/infropay_plaque_black_10m_1792134467200.jpg",
                color: "#D4AF37",
              },
            ].map((b) => (
              <div
                key={b.name}
                className="group rounded-2xl border border-border/70 bg-card/60 hover:bg-card/90 transition-all p-3.5 flex flex-col items-center text-center shadow-card"
                style={{ borderColor: b.color + "40" }}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-border/40 bg-black/40 mb-3 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={b.img}
                    alt={b.name}
                    width={400}
                    height={400}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="font-display text-sm font-bold tracking-tight"
                  style={{ color: b.color }}
                >
                  {b.name}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 font-medium tabular-nums">
                  Meta: {b.goal}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              to="/legends"
              className="inline-flex items-center gap-1 text-sm text-gold hover:opacity-80 font-medium"
            >
              Ver todas as placas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <TrustMarquee />

      {/* BANNER — GANHE ONLINE */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-20">
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 min-h-[280px] md:min-h-[340px]">
          <img
            src={bannerGanhe}
            alt=""
            width={1600}
            height={900}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/20" />
          <div className="relative p-8 md:p-14 max-w-xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">
              Ganhe online
            </div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold leading-tight">
              O seu <span className="text-gradient-gold">primeiro Kz</span>
              <br />
              pode entrar hoje.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Publique o seu curso, ebook ou template em minutos. Sem mensalidade, sem burocracia —
              paga apenas quando vende.
            </p>
            <Link to="/auth" search={{ mode: "signup" }} className="mt-6 inline-block">
              <Button size="lg" className="gradient-brand text-primary-foreground shadow-glow">
                Criar conta grátis <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CONVITE PARA A LOJA OFICIAL (PRODUTOS VISÍVEIS SOMENTE AO CLICAR EM VER LOJA) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="relative rounded-3xl border border-border bg-gradient-to-br from-card via-card/90 to-primary/10 p-8 sm:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 text-gold px-3 py-1 text-xs font-semibold mb-4 border border-gold/20">
              <Store className="h-3.5 w-3.5" /> Vitrine Oficial
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Explore os melhores infoprodutos de Angola
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Cursos práticos, livros digitais, templates prontos e mentorias exclusivas. Aceda à
              loja completa para filtrar por categorias e comprar com Multicaixa Express.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/loja">
                <Button
                  size="lg"
                  className="gradient-brand text-primary-foreground shadow-glow px-6 font-semibold"
                >
                  <Store className="mr-2 h-4 w-4" /> Ver Loja Completa
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" variant="outline" className="px-6 font-semibold">
                  Publicar o meu infoproduto
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">
            Como funciona
          </div>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">
            Da ideia à primeira venda em 3 passos
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              n: "01",
              t: "Crie a sua conta grátis",
              d: "Menos de 60 segundos. Sem cartão, sem mensalidade.",
              i: Users,
            },
            {
              n: "02",
              t: "Publique o seu produto",
              d: "Capa, ficheiro e preço. Escolha se quer exibir na loja pública ou vender por link direto.",
              i: Play,
            },
            {
              n: "03",
              t: "Receba em Kwanza",
              d: "Saldo liberado em 1 hora e saque por IBAN a partir de 5.000 Kz.",
              i: TrendingUp,
            },
          ].map((s) => {
            const Icon = s.i;
            return (
              <div
                key={s.n}
                className="relative rounded-2xl border border-border bg-card p-6 overflow-hidden"
              >
                <div className="absolute -top-4 -right-4 text-8xl font-display font-black text-primary/5 select-none">
                  {s.n}
                </div>
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
        <Link
          to="/legends"
          className="group relative block overflow-hidden rounded-3xl border border-gold/30 min-h-[260px]"
        >
          <img
            src={bannerLegends}
            alt=""
            width={1600}
            height={900}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-70 group-hover:scale-105 transition duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
          <div className="relative p-8 md:p-14 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium">
              <Trophy className="h-3.5 w-3.5 text-gold" /> Novo
            </div>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
              InfroPay <span className="text-gradient-gold">Legends</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              O ranking dos produtores que mais faturam em Angola. Suba de nível, ganhe placa
              oficial e prove o seu resultado.
            </p>
            <div className="mt-6 inline-flex items-center text-sm text-gold group-hover:translate-x-1 transition font-medium">
              Ver ranking <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* TESTEMUNHOS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">
            Testemunhos
          </div>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold">Quem já vende com a InfroPay</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              n: "Kiala M.",
              r: "Autor de ebooks",
              t: "Vendi mais em 2 meses na InfroPay do que num ano a tentar sozinho.",
            },
            {
              n: "Beatriz T.",
              r: "Mentora de finanças",
              t: "O checkout Multicaixa mudou tudo. Conversão triplicou.",
            },
            {
              n: "Nuno C.",
              r: "Criador de cursos",
              t: "Suporte rápido, taxas justas, painel completo. Recomendo.",
            },
          ].map((x) => (
            <div key={x.n} className="rounded-2xl border border-border bg-card p-6">
              <Quote className="h-6 w-6 text-gold" />
              <p className="mt-3 text-foreground/90">"{x.t}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-brand grid place-items-center font-bold text-primary-foreground">
                  {x.n[0]}
                </div>
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
          <img
            src={bannerProdutores}
            alt=""
            width={1600}
            height={900}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/85 to-primary/20" />
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full gradient-brand opacity-25 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full gradient-gold opacity-15 blur-3xl" />
          <div className="relative p-10 md:p-16 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">
              Para produtores
            </div>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold leading-tight">
              Pare de perder vendas por{" "}
              <span className="text-gradient-gold">falta de estrutura</span>.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Checkout de alta conversão, área de membros, pixels integrados, financeiro e saques em
              Kz. Tudo pronto — só falta o seu produto.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {[
                "Apenas 2% por venda — sem mensalidade",
                "Saldo liberado em 1 hora após aprovação",
                "Multicaixa Express, Referência e Transferência",
                "Suporte em português, feito em Angola",
              ].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> {x}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button
                  size="lg"
                  className="gradient-brand text-primary-foreground shadow-glow h-12 px-6 font-semibold"
                >
                  Criar conta de produtor <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/loja">
                <Button size="lg" variant="outline" className="h-12 px-6 font-semibold">
                  Ver a loja
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <WristbandModal
        isOpen={showWristbandModal}
        onClose={handleCloseWristband}
        wristbandImage="/src/assets/images/infropay_blue_rubber_wristband_1792339247732.jpg"
      />
    </SiteLayout>
  );
}
