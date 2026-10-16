import React from "react";
import { toast } from "sonner";
import { Trophy, Sparkles, X, ChevronRight, Award } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type Level } from "@/lib/legends.functions";
import { playTrophyFanfare } from "@/lib/audio-chimes";

interface PlaqueUnlockToastProps {
  level: Level;
  toastId: string | number;
}

export const PlaqueUnlockToast: React.FC<PlaqueUnlockToastProps> = ({ level, toastId }) => {
  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-card via-[#111827] to-card p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
      style={{
        borderColor: level.color,
        boxShadow: `0 10px 35px -5px ${level.color}40, 0 0 15px ${level.color}20`,
      }}
    >
      {/* Glow corner ambient */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl opacity-30"
        style={{ backgroundColor: level.color }}
      />

      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3.5">
        {/* Trophy Plaque Thumbnail with Glow */}
        <div className="relative shrink-0">
          <div
            className="relative h-18 w-18 overflow-hidden rounded-xl border border-white/20 bg-black/60 shadow-md group"
            style={{ borderColor: level.color }}
          >
            <img
              src={level.image}
              alt={level.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-1 right-1 rounded-full bg-black/70 p-1 text-gold">
              <Trophy className="h-3 w-3" style={{ color: level.color }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pr-6 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold">
            <Sparkles className="h-3 w-3 text-gold animate-spin-slow" />
            <span>Nova Placa Desbloqueada!</span>
          </div>

          <h4 className="mt-0.5 font-display text-base font-bold text-foreground truncate">
            {level.name}
          </h4>

          <p className="mt-1 text-xs text-muted-foreground leading-snug">
            Parabéns! Atingiste a meta de{" "}
            <span className="font-semibold text-foreground">{level.goal_label}</span> faturados no
            InfroPay.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Link
              to="/produtor/conquistas"
              onClick={() => toast.dismiss(toastId)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 shadow-sm"
              style={{ backgroundColor: level.color }}
            >
              <Award className="h-3.5 w-3.5" />
              Ver no Hall de Conquistas
              <ChevronRight className="h-3 w-3" />
            </Link>

            <button
              type="button"
              onClick={() => toast.dismiss(toastId)}
              className="rounded-lg border border-border/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition"
            >
              Mais tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Dispara o toast especial comemorativo de nova placa desbloqueada
 * acompanhado de fanfarra sonora e notificação do sistema
 */
export function showPlaqueUnlockToast(level: Level, playSound = true) {
  if (playSound) {
    playTrophyFanfare();
  }

  // Toast rico no ecrã
  toast.custom((id) => <PlaqueUnlockToast level={level} toastId={id} />, {
    duration: 10000,
    position: "top-right",
  });

  // Também envia notificação de sistema / service worker se disponível
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_SALE_NOTIFICATION",
          title: `🏆 Desbloqueaste a ${level.name}!`,
          body: `Parabéns! Meta de ${level.goal_label} alcançada no InfroPay.`,
          image: level.image,
          url: "/produtor/conquistas",
        });
      } else {
        new Notification(`🏆 Desbloqueaste a ${level.name}!`, {
          body: `Meta de ${level.goal_label} alcançada no InfroPay. Solicita o envio da tua placa oficial!`,
          icon: "/pwa-192x192.png",
        });
      }
    } catch {
      // Ignora falhas silenciosamente
    }
  }
}
