import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Rocket, Trophy, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a InfroPay — A plataforma para produtores digitais em Angola" },
      {
        name: "description",
        content:
          "A InfroPay é a plataforma premium de infoprodutos criada para o mercado angolano. Conheça a nossa missão, valores e visão.",
      },
      { property: "og:title", content: "Sobre a InfroPay" },
      { property: "og:description", content: "Transformando conhecimento em renda em Angola." },
    ],
    links: [{ rel: "canonical", href: "/sobre" }],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <SiteLayout>
      {/* HERO COM GRADIENTE LIMPO E TEXTO FLUIDO */}
      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/20 blur-[120px] rounded-full" />
          <div className="absolute top-1/3 -right-24 w-[350px] h-[350px] bg-gold/15 blur-[100px] rounded-full" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.55_0.19_255_/_0.15)_0%,_transparent_70%)]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20 md:py-28 text-center">
          <div className="inline-block rounded-full glass px-4 py-1.5 text-xs font-semibold text-gold border border-gold/30">
            Sobre a InfroPay
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            A infraestrutura do <span className="text-gradient-gold">conhecimento</span> em Angola
          </h1>
          <p className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A InfroPay nasceu para dar a cada produtor angolano as ferramentas completas que os
            maiores líderes globais usam — com pagamentos em Kwanza, sem complicação técnica e com a
            menor taxa do mercado nacional.
          </p>
        </div>
      </section>

      {/* MISSÃO, VALORES, VISÃO */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-20 grid md:grid-cols-3 gap-6">
        {[
          {
            i: Rocket,
            t: "Missão",
            d: "Democratizar a criação e venda de infoprodutos em Angola e no mundo lusófono através de tecnologia ágil, segura e verdadeiramente acessível para todos.",
          },
          {
            i: ShieldCheck,
            t: "Valores",
            d: "Transparência total, segurança rigorosa nas transações financeiras, liberação ultrarrápida do saldo e compromisso absoluto com o talento e os produtores nacionais.",
          },
          {
            i: Trophy,
            t: "Visão",
            d: "Consolidar a InfroPay como o principal ecossistema de monetização de conhecimento, cursos e conteúdos digitais em Angola e na África lusófona.",
          },
        ].map(({ i: Icon, t, d }) => (
          <div
            key={t}
            className="rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col justify-between shadow-sm hover:border-gold/30 transition"
          >
            <div>
              <div className="h-12 w-12 rounded-xl gradient-brand grid place-items-center mb-5 text-primary-foreground shadow-glow">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">{t}</h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* POR QUE EXISTIMOS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-card via-card/90 to-primary/10 p-8 sm:p-12 md:p-14 shadow-lg">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gold">
                Por que existimos
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-foreground">
                Feita por angolanos, para impulsionar o seu negócio digital.
              </h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                Reunimos checkout otimizado com pagamentos instantâneos em Kwanza. Cobramos apenas{" "}
                <strong className="text-gold font-bold">2% por venda</strong> e{" "}
                <strong className="text-gold font-bold">8% por saque</strong>, com liberação a
                partir de 1 hora e suporte ágil e humanizado em português.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <Button
                    size="lg"
                    className="gradient-brand text-primary-foreground shadow-glow font-semibold h-11 px-6"
                  >
                    Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
                <Link to="/contactos">
                  <Button size="lg" variant="outline" className="font-semibold h-11 px-6">
                    Falar connosco
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Stat n="2%" l="Por venda" />
              <Stat n="8%" l="Por saque" />
              <Stat n="1h" l="Liberação mínima" />
              <Stat n="24/7" l="Suporte ativo" />
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-5 text-center shadow-sm">
      <div className="text-3xl sm:text-4xl font-bold text-gradient-gold whitespace-nowrap tabular-nums">
        {n}
      </div>
      <div className="text-xs text-muted-foreground mt-1.5 font-medium">{l}</div>
    </div>
  );
}
