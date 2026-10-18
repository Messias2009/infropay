import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, Lock, Flame, Rocket, Crown, Star, Medal, Award, Sparkles } from "lucide-react";
import { getMyAchievements } from "@/lib/profile.functions";
import { LEVELS, levelFor } from "@/lib/legends.functions";
import { kz } from "@/components/finance/FeeBanner";
import { usePlaqueWatcher } from "@/hooks/usePlaqueWatcher";

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

  // Monitora e celebra quando novas placas forem desbloqueadas
  usePlaqueWatcher(revenue);

  // Cálculo de progresso para a próxima placa
  const currentIdx = LEVELS.findIndex((l) => l.key === current.key);
  const nextLevel = LEVELS[currentIdx + 1];
  let pctRemaining = 0;
  let remainingCents = 0;
  let pctAchieved = 100;
  if (nextLevel) {
    const span = nextLevel.min_cents - (current.min_cents || 0);
    const currentProgress = Math.max(0, revenue - (current.min_cents || 0));
    pctAchieved = Math.min(99, Math.max(1, Math.round((currentProgress / span) * 100)));
    pctRemaining = 100 - pctAchieved;
    remainingCents = Math.max(0, nextLevel.min_cents - revenue);
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Prémios</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Conquistas & Placas</h1>
        <p className="text-sm text-muted-foreground mt-2">
          A cada meta de faturamento desbloqueias uma nova placa oficial InfroPay.
        </p>
      </div>

      {/* Nível atual & Acompanhamento de Faturamento */}
      <div
        className="rounded-2xl border p-6 relative overflow-hidden bg-gradient-to-br from-card via-[#111827]/90 to-card shadow-card"
        style={{ borderColor: current.color + "60" }}
      >
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: current.color }}
        />

        <div className="relative">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Nível atual de faturamento
          </div>

          <div className="mt-2 flex items-baseline gap-3 flex-wrap">
            <div
              className="font-display text-3xl sm:text-4xl font-bold"
              style={{ color: current.color }}
            >
              {current.name}
            </div>
            <div className="text-sm text-muted-foreground">
              — <strong className="text-foreground">{kz(revenue)}</strong> faturados ·{" "}
              {data?.sales_count ?? 0} vendas concluídas
            </div>
          </div>

          {nextLevel ? (
            <div className="mt-5 space-y-2 max-w-2xl">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">
                  Próxima meta: <strong className="text-foreground">{nextLevel.name}</strong> (
                  {nextLevel.goal_label})
                </span>
                <span className="text-gold font-semibold">
                  Faltam {pctRemaining}% ({kz(remainingCents)})
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="h-2.5 w-full rounded-full bg-black/40 border border-white/10 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-glow"
                  style={{
                    width: `${pctAchieved}%`,
                    background: `linear-gradient(90deg, ${current.color}, ${nextLevel.color})`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span>{pctAchieved}% concluído</span>
                <span>Meta: {nextLevel.goal_label}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400 font-semibold max-w-md">
              👑 Parabéns! Alcançaste o patamar máximo de produtor InfroPay (Black Elite)!
            </div>
          )}
        </div>
      </div>

      {/* CARD: PULSEIRA OFICIAL DE BORRACHA AZUL */}
      <div className="rounded-2xl border border-blue-500/40 bg-card/90 p-5 shadow-card">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="shrink-0 w-36 sm:w-44 aspect-[4/3] rounded-xl overflow-hidden border border-blue-500/40 bg-black/50 shadow-md">
            <img
              src="/src/assets/images/infropay_blue_rubber_wristband_1792339247732.jpg"
              alt="Pulseira de Borracha Azul InfroPay"
              width={400}
              height={300}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Pulseira da Primeira Venda
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              {data && data.sales_count > 0 ? (
                <span className="text-emerald-400 font-medium">
                  Parabéns! Já realizaste {data.sales_count} venda(s) na plataforma. Fale com o
                  nosso suporte oficial para receber a tua pulseira de borracha de silicone azul
                  InfroPay.
                </span>
              ) : (
                <span>
                  Faça a sua primeira venda e receba a pulseira de borracha de silicone azul com a
                  marca oficial da InfroPay.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
          Metas de Faturamento
        </div>
        <h2 className="font-display text-2xl font-bold">5 Níveis de Placas Oficiais</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Placas físicas exclusivas de reconhecimento entregues diretamente aos produtores InfroPay.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {LEVELS.map((l) => {
          const unlocked = revenue >= l.min_cents;
          return (
            <div
              key={l.key}
              className={`group relative rounded-2xl border p-4 overflow-hidden transition-all bg-card/60 flex flex-col justify-between ${unlocked ? "badge-shine shadow-lg" : "opacity-75"}`}
              style={{ borderColor: l.color + (unlocked ? "80" : "30") }}
            >
              <div>
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-border/40 bg-black/40 mb-3 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={l.image}
                    alt={l.name}
                    width={400}
                    height={400}
                    loading="lazy"
                    className={`w-full h-full object-cover ${unlocked ? "" : "grayscale-[30%]"}`}
                  />
                </div>
                <div className="relative text-center">
                  <div className="font-display text-sm font-bold" style={{ color: l.color }}>
                    {l.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    Meta: {l.goal_label}
                  </div>
                  <div
                    className="text-[10px] mt-2 font-semibold uppercase tracking-wider"
                    style={{
                      color: unlocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {unlocked ? "Conquistado" : "Bloqueado"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-card via-[#1c1917]/50 to-card p-5 shadow-card flex flex-col sm:flex-row items-center gap-5">
          <div className="shrink-0 w-28 sm:w-36 aspect-square rounded-2xl overflow-hidden border border-gold/40 bg-black/60 shadow-lg shadow-gold/10 p-1">
            <img
              src="/src/assets/images/infropay_special_seals_badge_1792339262403.jpg"
              alt="Selo Especial Oficial InfroPay"
              width={400}
              height={400}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold">
              Emblemas de Mérito
            </div>
            <h2 className="font-display text-2xl font-bold">Selos especiais</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Reconhecimentos extra pelo teu volume e consistência na plataforma. Colecione cada
              selo à medida que avança na jornada do produtor.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
