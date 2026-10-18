import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  wristbandImage?: string;
};

export function WristbandModal({
  isOpen,
  onClose,
  wristbandImage = "/src/assets/images/infropay_blue_rubber_wristband_1792339247732.jpg",
}: Props) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wristband-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl border border-gold/40 bg-card p-5 sm:p-6 shadow-2xl overflow-hidden scale-in-95 duration-200">
        {/* Close Button X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar publicidade"
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-background/90 hover:bg-muted border border-border flex items-center justify-center text-foreground hover:text-foreground/80 transition-colors shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Wristband Image */}
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-gold/30 bg-black/40 shadow-inner mb-4">
          <img
            src={wristbandImage}
            alt="Pulseira oficial de primeira venda InfroPay"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Basic Clean Text without icons */}
        <div className="text-center space-y-2">
          <h3
            id="wristband-modal-title"
            className="text-xl font-bold tracking-tight text-foreground"
          >
            Pulseira da Primeira Venda
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Faça a sua primeira venda e receba a pulseira de primeira venda da InfroPay.
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-5 space-y-2">
          <Link to="/auth" search={{ mode: "signup" }} onClick={onClose} className="block w-full">
            <Button className="w-full gradient-brand text-primary-foreground font-semibold shadow-glow cursor-pointer">
              Começar a Vender
            </Button>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1 transition-colors cursor-pointer"
          >
            Dispensar anúncio
          </button>
        </div>
      </div>
    </div>
  );
}
