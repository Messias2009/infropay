import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, Lock, Flame, Rocket, Crown, Star, Medal } from "lucide-react";
import { getMyAchievements } from "@/lib/profile.functions";
import { LEVELS, levelFor } from "@/lib/legends.functions";
import { kz } from "@/components/finance/FeeBanner";

export const Route = createFileRoute("/_authenticated/produtor/conquistas")({
  head: () => ({
    meta: [{ title: "Conquistas — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

function Page() {
  const fn = useServerFn(getMyAchievements);
  const { data } = useQuery({ queryKey: ["me", "achievements"], queryFn: () => fn() });
  const revenue = data?.revenue_cents ?? 0;
  const current = levelFor(revenue);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Prémios</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Conquistas & Placas</h1>
        <p className="text-sm text-muted-foreground mt-2">
          A cada meta de faturamento desbloqueias uma nova placa oficial InfroPay.
        </p>
      </div>

      <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Nível atual
        </div>
        <div className="mt-2 flex items-end gap-3">
          <div className="font-display text-4xl font-bold" style={{ color: current.color }}>
            {current.name}
          </div>
          <div className="text-sm text-muted-foreground pb-1.5">
            — {kz(revenue)} faturados · {data?.sales_count ?? 0} vendas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {LEVELS.map((l) => {
          const unlocked = revenue >= l.min_cents;
          return (
            <div
              key={l.key}
              className={`relative rounded-2xl border p-5 overflow-hidden ${unlocked ? "badge-shine" : "opacity-45"}`}
              style={{ borderColor: l.color + "50" }}
            >
              <div
                className={`absolute inset-0 opacity-25 ${unlocked ? "animate-bg-pan" : ""}`}
                style={{ background: l.gradient, backgroundSize: "200% 200%" }}
              />
              <div className="relative">
                <div
                  className={`h-14 w-14 rounded-2xl grid place-items-center mb-3 ${unlocked ? "animate-floaty" : ""}`}
                  style={{
                    background: l.gradient,
                    boxShadow: unlocked ? `0 8px 30px -8px ${l.color}` : "none",
                  }}
                >
                  {unlocked ? (
                    <Trophy className="h-7 w-7 text-white drop-shadow" />
                  ) : (
                    <Lock className="h-6 w-6 text-white/80" />
                  )}
                </div>
                <div className="font-display text-lg font-bold" style={{ color: l.color }}>
                  {l.name}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Meta: {kz(l.min_cents)}
                </div>
                <div
                  className="text-[10px] mt-2 font-semibold"
                  style={{
                    color: unlocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {unlocked ? "DESBLOQUEADO" : "Bloqueado"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold">Selos especiais</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Reconhecimentos extra pelo teu desempenho na plataforma.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-5">
          {SEALS.map((sl) => {
            const unlocked = sl.check({ revenue, sales: data?.sales_count ?? 0 });
            const Icon = sl.icon;
            return (
              <div
                key={sl.key}
                className={`relative rounded-2xl border p-4 text-center overflow-hidden ${unlocked ? "badge-shine" : "opacity-40"}`}
                style={{ borderColor: sl.color + "55" }}
              >
                <div
                  className={`h-12 w-12 mx-auto rounded-full grid place-items-center mb-3 ${unlocked ? "animate-floaty" : ""}`}
                  style={{
                    background: sl.gradient,
                    boxShadow: unlocked ? `0 8px 24px -8px ${sl.color}` : "none",
                  }}
                >
                  {unlocked ? (
                    <Icon className="h-6 w-6 text-white drop-shadow" />
                  ) : (
                    <Lock className="h-5 w-5 text-white/80" />
                  )}
                </div>
                <div
                  className="font-semibold text-sm"
                  style={{ color: unlocked ? sl.color : undefined }}
                >
                  {sl.name}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-snug">{sl.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type SealCtx = { revenue: number; sales: number };

const SEALS = [
  {
    key: "first",
    name: "Primeira venda",
    desc: "A tua primeira venda paga",
    icon: Star,
    color: "#F9A825",
    gradient: "linear-gradient(135deg,#B8860B,#FFD700)",
    check: (c: SealCtx) => c.sales >= 1,
  },
  {
    key: "ten",
    name: "10 vendas",
    desc: "10 vendas concluídas",
    icon: Medal,
    color: "#4FC3F7",
    gradient: "linear-gradient(135deg,#0277BD,#4FC3F7)",
    check: (c: SealCtx) => c.sales >= 10,
  },
  {
    key: "hundred",
    name: "100 vendas",
    desc: "100 vendas concluídas",
    icon: Flame,
    color: "#FF7043",
    gradient: "linear-gradient(135deg,#BF360C,#FF8A65)",
    check: (c: SealCtx) => c.sales >= 100,
  },
  {
    key: "million",
    name: "Milionário",
    desc: "1M Kz faturados",
    icon: Crown,
    color: "#00BCD4",
    gradient: "linear-gradient(135deg,#006064,#4DD0E1)",
    check: (c: SealCtx) => c.revenue >= 100_000_000,
  },
  {
    key: "top",
    name: "Top vendedor",
    desc: "5M Kz faturados",
    icon: Trophy,
    color: "#AB47BC",
    gradient: "linear-gradient(135deg,#6A1B9A,#CE93D8)",
    check: (c: SealCtx) => c.revenue >= 500_000_000,
  },
  {
    key: "rocket",
    name: "Escala",
    desc: "500 vendas concluídas",
    icon: Rocket,
    color: "#66BB6A",
    gradient: "linear-gradient(135deg,#1B5E20,#81C784)",
    check: (c: SealCtx) => c.sales >= 500,
  },
] as const;
