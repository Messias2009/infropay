import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Rocket, Users, Trophy, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import banner from "@/assets/banner-produtores.jpg";

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
      <section className="relative overflow-hidden border-b border-border/60">
        <img
          src={banner}
          alt=""
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-24 text-center">
          <div className="inline-block rounded-full glass px-3 py-1.5 text-xs font-medium text-gold">
            Sobre nós
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
            A infraestrutura do <span className="text-gradient-gold">conhecimento</span> em Angola.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            A InfroPay nasceu para dar a cada produtor angolano as mesmas ferramentas que os líderes
            globais usam — sem complicação técnica e com custo justo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid md:grid-cols-3 gap-6">
        {[
          {
            i: Rocket,
            t: "Missão",
            d: "Democratizar a venda de infoprodutos em África lusófona com tecnologia de ponta.",
          },
          {
            i: ShieldCheck,
            t: "Valores",
            d: "Transparência, curadoria, segurança e obsessão pelo produtor.",
          },
          {
            i: Trophy,
            t: "Visão",
            d: "Ser a maior plataforma de conhecimento digital em Angola até 2030.",
          },
        ].map(({ i: Icon, t, d }) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-6">
            <div className="h-11 w-11 rounded-lg gradient-brand grid place-items-center mb-4">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="font-display text-xl font-bold">{t}</div>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-card via-card to-primary/10 p-10 md:p-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gold">
                Por que existimos
              </div>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold">
                Feita por angolanos, para o mundo lusófono.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Aceitamos{" "}
                <strong className="text-foreground">
                  Multicaixa Express, Referência e Transferência
                </strong>
                , cobramos apenas <strong className="text-gold">2% por venda</strong> e{" "}
                <strong className="text-gold">8% por saque</strong> — sem taxas escondidas.
              </p>
              <div className="mt-6 flex gap-3">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <Button className="gradient-brand text-primary-foreground shadow-glow">
                    Começar agora <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/contactos">
                  <Button variant="outline">Falar connosco</Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Stat n="2%" l="Por venda" />
              <Stat n="8%" l="Por saque" />
              <Stat n="1h" l="Liberação mínima" />
              <Stat n="24/7" l="Suporte" />
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 text-center">
      <div className="text-3xl font-bold text-gradient-gold">{n}</div>
      <div className="text-xs text-muted-foreground mt-1">{l}</div>
    </div>
  );
}
