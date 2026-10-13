import { useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  compact?: boolean;
}

export function PWAInstallButton({
  variant = "outline",
  className = "",
  compact = false,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone app, do not display
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <Button
        variant={variant}
        size="sm"
        onClick={install}
        className={`inline-flex items-center gap-1.5 border-gold/40 text-gold hover:bg-gold/10 hover:border-gold whitespace-nowrap text-xs font-semibold ${className}`}
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        {compact ? "App" : "Instalar App"}
      </Button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <Button
          variant={variant}
          size="sm"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 border-gold/40 text-gold hover:bg-gold/10 hover:border-gold whitespace-nowrap text-xs font-semibold ${className}`}
        >
          <Smartphone className="h-3.5 w-3.5 shrink-0" />
          {compact ? "App" : "Instalar App"}
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-foreground">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl gradient-brand grid place-items-center text-primary-foreground font-bold">
                  IP
                </div>
                <div>
                  <h3 className="font-display font-bold text-base">Instalar InfroPay no iPhone</h3>
                  <p className="text-xs text-muted-foreground">Aceda direto do seu ecrã inicial</p>
                </div>
              </div>
              <ol className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-gold">1.</span>
                  <span>
                    No Safari, toque no botão <strong>Partilhar</strong> (ícone de quadrado com seta
                    para cima).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-gold">2.</span>
                  <span>
                    Role para baixo e selecione <strong>Adicionar ao Ecrã Principal</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-gold">3.</span>
                  <span>
                    Toque em <strong>Adicionar</strong> no canto superior direito.
                  </span>
                </li>
              </ol>
              <Button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full gradient-brand text-primary-foreground text-xs font-semibold h-10"
              >
                Entendido
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
