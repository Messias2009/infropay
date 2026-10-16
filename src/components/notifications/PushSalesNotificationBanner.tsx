import React, { useState } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  ShieldCheck,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface Props {
  variant?: "banner" | "card" | "compact";
}

export const PushSalesNotificationBanner: React.FC<Props> = ({ variant = "card" }) => {
  const {
    permission,
    isSubscribing,
    soundEnabled,
    toggleSound,
    requestPermission,
    scheduleTestNotification,
  } = usePushNotifications();

  const [testCountdown, setTestCountdown] = useState<number | null>(null);

  const handleTest = () => {
    scheduleTestNotification(5);
    setTestCountdown(5);
    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-2 rounded-lg ${permission === "granted" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}
          >
            <Bell className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              Notificações Push
              {permission === "granted" ? (
                <span className="text-[10px] text-emerald-400 font-medium">(Ativas)</span>
              ) : (
                <span className="text-[10px] text-amber-400 font-medium">(Inativas)</span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              Alertas mesmo com navegador fechado
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {permission !== "granted" ? (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 border-gold/40 text-gold hover:bg-gold/10"
              onClick={requestPermission}
              disabled={isSubscribing}
            >
              Ativar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
              onClick={handleTest}
              disabled={testCountdown !== null}
            >
              {testCountdown !== null ? `${testCountdown}s...` : "Testar"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-[#111827]/80 to-card p-5 sm:p-6 shadow-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 p-3 rounded-xl border ${
              permission === "granted"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-glow"
                : "border-gold/30 bg-gold/10 text-gold"
            }`}
          >
            <Bell className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-lg font-bold text-foreground">
                Notificação de Vendas Push
              </h3>
              {permission === "granted" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativo no Navegador & Sistema
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <AlertCircle className="h-3 w-3" />
                  Permissão Pendente
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              Receba alertas no ecrã e com som de caixa registadora a cada venda aprovada,{" "}
              <strong className="text-foreground font-semibold">
                mesmo com o navegador fechado ou minimizado
              </strong>
              .
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-center">
          {/* Sound Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-background/50">
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-gold" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="sound-toggle" className="text-xs cursor-pointer select-none">
              Som Ka-ching
            </Label>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={toggleSound}
              className="data-[state=checked]:bg-gold"
            />
          </div>

          {permission !== "granted" ? (
            <Button
              onClick={requestPermission}
              disabled={isSubscribing}
              className="gradient-brand text-primary-foreground shadow-glow font-semibold text-xs sm:text-sm h-10 px-4"
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              {isSubscribing ? "A ativar..." : "Ativar Notificações"}
            </Button>
          ) : (
            <Button
              onClick={handleTest}
              disabled={testCountdown !== null}
              variant="outline"
              className="border-gold/40 text-gold hover:bg-gold/10 font-medium text-xs sm:text-sm h-10 px-4"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {testCountdown !== null
                ? `Minimiza o ecrã (${testCountdown}s)`
                : "Testar Notificação Push"}
            </Button>
          )}
        </div>
      </div>

      {testCountdown !== null && (
        <div className="mt-4 p-3 rounded-xl border border-primary/40 bg-primary/10 text-xs text-primary-foreground flex items-center gap-2 animate-in fade-in">
          <Sparkles className="h-4 w-4 text-gold animate-spin-slow shrink-0" />
          <span>
            <strong>Teste em andamento:</strong> podes minimizar a janela ou alternar de aba agora.
            A notificação push será disparada em {testCountdown} segundos com vibração e alerta no
            teu sistema!
          </span>
        </div>
      )}
    </div>
  );
};
