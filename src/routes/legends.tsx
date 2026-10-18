import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Trophy, Crown, TrendingUp, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { listLegends, LEVELS } from "@/lib/legends.functions";
import bannerLegends from "@/assets/banner-legends.jpg";

const q = queryOptions({ queryKey: ["legends"], queryFn: () => listLegends() });

export const Route = createFileRoute("/legends")({
  head: () => ({
    meta: [
      { title: "InfroPay Legends — Ranking de produtores" },
      {
        name: "description",
        content:
          "Conheça os produtores que transformam conhecimento em renda na InfroPay. Ranking público, níveis de Bronze a Infinito.",
      },
      { property: "og:title", content: "InfroPay Legends" },
      {
        property: "og:description",
        content: "Ranking público dos maiores produtores digitais de Angola.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(q);
  },
  component: Legends,
});

function fmt(c: number) {
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 0,
    }).format(c / 100);
  } catch {
    return `${(c / 100).toFixed(0)} Kz`;
  }
}

function Legends() {
  const { data: legends } = useSuspenseQuery(q);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden border-b border-border/60">
        <img
          src={bannerLegends}
          alt=""
          width={1600}
          height={900}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium">
            <Trophy className="h-3.5 w-3.5 text-gold" /> Hall da fama
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight">
            InfroPay <span className="text-gradient-gold">Legends</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Os produtores que transformaram conhecimento em renda de verdade. Ranking público
            baseado em vendas reais.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="text-xs font-semibold uppercase tracking-widest text-gold">
          Sistema de níveis
        </div>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold">10 níveis · Do Bronze ao Infinito</h2>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {LEVELS.map((l) => (
            <div key={l.key} className="rounded-xl border border-border/60 bg-card/50 p-4">
              <div
                className="h-10 w-10 rounded-lg grid place-items-center mb-3"
                style={{ background: l.gradient }}
              >
                <Crown className="h-5 w-5 text-white/90" />
              </div>
              <div className="font-semibold text-sm">{l.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {l.min_cents === 0 ? "Início" : `Desde ${fmt(l.min_cents)}`}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="text-xs font-semibold uppercase tracking-widest text-gold">Top 100</div>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold">Produtores em destaque</h2>

        {legends.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <Trophy className="h-10 w-10 text-gold mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold">O primeiro lugar ainda está vago</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Publique o seu produto e faça história.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-3">
            {legends.map((r, i) => (
              <div
                key={r.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 transition sm:flex sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-lg grid place-items-center shrink-0 font-bold text-sm ${i < 3 ? "gradient-gold text-gold-foreground shadow-gold" : "bg-secondary"}`}
                  >
                    #{i + 1}
                  </div>
                  <div className="h-11 w-11 rounded-full bg-secondary overflow-hidden shrink-0">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-5 w-5 m-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <TrendingUp className="h-3 w-3" /> {r.sales_count} vendas
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-sm">{fmt(r.total_revenue_cents)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      faturamento
                    </div>
                  </div>
                  <div
                    className="rounded-full px-3 py-1 text-xs font-bold text-white/95 shadow"
                    style={{ background: r.level.gradient }}
                  >
                    {r.level.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
