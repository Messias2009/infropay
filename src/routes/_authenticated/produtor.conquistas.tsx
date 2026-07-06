import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy, Lock } from "lucide-react";
import { getMyAchievements } from "@/lib/profile.functions";
import { LEVELS, levelFor } from "@/lib/legends.functions";
import { kz } from "@/components/finance/FeeBanner";

export const Route = createFileRoute("/_authenticated/produtor/conquistas")({
  head: () => ({ meta: [{ title: "Conquistas — InfroPay" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const fn = useServerFn(getMyAchievements);
  const { data } = useQuery({ queryKey: ["me","achievements"], queryFn: () => fn() });
  const revenue = data?.revenue_cents ?? 0;
  const current = levelFor(revenue);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Prémios</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Conquistas & Placas</h1>
        <p className="text-sm text-muted-foreground mt-2">A cada meta de faturamento desbloqueias uma nova placa oficial InfroPay.</p>
      </div>

      <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Nível atual</div>
        <div className="mt-2 flex items-end gap-3">
          <div className="font-display text-4xl font-bold" style={{ color: current.color }}>{current.name}</div>
          <div className="text-sm text-muted-foreground pb-1.5">— {kz(revenue)} faturados · {data?.sales_count ?? 0} vendas</div>
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
                  style={{ background: l.gradient, boxShadow: unlocked ? `0 8px 30px -8px ${l.color}` : "none" }}
                >
                  {unlocked ? <Trophy className="h-7 w-7 text-white drop-shadow" /> : <Lock className="h-6 w-6 text-white/80" />}
                </div>
                <div className="font-display text-lg font-bold" style={{ color: l.color }}>{l.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Meta: {kz(l.min_cents)}</div>
                <div className="text-[10px] mt-2 font-semibold" style={{ color: unlocked ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}>
                  {unlocked ? "DESBLOQUEADO" : "Bloqueado"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
