import wristbandImg from "@/assets/images/infropay_wristband_first_sale_1792134398670.jpg";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Trophy,
  Lock,
  Flame,
  Rocket,
  Crown,
  Star,
  Medal,
  Award,
  Sparkles,
  Bell,
} from "lucide-react";
import { getMyAchievements } from "@/lib/profile.functions";
import { LEVELS, levelFor } from "@/lib/legends.functions";
import { kz } from "@/components/finance/FeeBanner";
import { showPlaqueUnlockToast } from "@/components/notifications/PlaqueUnlockToast";
import { usePlaqueWatcher } from "@/hooks/usePlaqueWatcher";
import { PushSalesNotificationBanner } from "@/components/notifications/PushSalesNotificationBanner";

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

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Prémios</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Conquistas & Placas</h1>
        <p className="text-sm text-muted-foreground mt-2">
          A cada meta de faturamento desbloqueias uma nova placa oficial InfroPay.
        </p>
      </div>

      {/* BANNER DE NOTIFICAÇÕES PUSH MESMO COM NAVEGADOR FECHADO */}
      <PushSalesNotificationBanner variant="card" />

      <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Nível atual
        </div>
        <div className="mt-2 flex items-end gap-3 flex-wrap justify-between">
          <div>
            <div className="font-display text-4xl font-bold" style={{ color: current.color }}>
              {current.name}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              — {kz(revenue)} faturados · {data?.sales_count ?? 0} vendas
            </div>
          </div>

          <button
            type="button"
            onClick={() => showPlaqueUnlockToast(current)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 text-xs font-semibold transition shadow-sm"
          >
            <Trophy className="h-4 w-4" />
            Testar Notificação da Minha Placa
          </button>
        </div>
      </div>

      {/* CARD SIMPLES: PULSEIRA PRIMEIRA VENDA */}
      <div className="rounded-2xl border border-gold/40 bg-card/90 p-5 shadow-card">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="shrink-0 w-36 sm:w-44 aspect-[4/3] rounded-xl overflow-hidden border border-gold/40 bg-card shadow-md">
            <img
              src={wristbandImg}
              alt="Pulseira Primeira Venda"
              width={400}
              height={300}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Pulseira da Primeira Venda
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              {data && data.sales_count > 0 ? (
                <span className="text-emerald-400 font-medium">
                  Parabéns! Já realizou {data.sales_count} venda(s) na plataforma. Fale com o nosso
                  suporte para receber a sua pulseira de primeira venda.
                </span>
              ) : (
                <span>
                  Faça a sua primeira venda e receba a pulseira de primeira venda da InfroPay.
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
                    className="text-[10px] mt-1.5 font-semibold uppercase tracking-wider"
                    style={{
                      color: unlocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {unlocked ? "Conquistado" : "Bloqueado"}
                  </div>
                </div>
              </div>

              {/* Botão de demonstração / celebração da placa com troféu */}
              <button
                type="button"
                onClick={() => showPlaqueUnlockToast(l)}
                className={`mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition border ${
                  unlocked
                    ? "bg-gold/15 hover:bg-gold/25 text-gold border-gold/40 shadow-sm"
                    : "bg-white/5 hover:bg-white/10 text-muted-foreground border-border/40"
                }`}
              >
                <Trophy className="h-3 w-3" style={{ color: l.color }} />
                {unlocked ? "Ver Notificação" : "Prévia Notificação"}
              </button>
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
