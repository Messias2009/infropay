import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageCircle, Clock, ShieldCheck } from "lucide-react";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instagramUrl?: string;
  whatsappUrl?: string;
}

export function SupportModal({
  open,
  onOpenChange,
  instagramUrl = "https://www.instagram.com/infropay.ao/",
  whatsappUrl = "https://wa.me/?text=Ol%C3%A1%20equipa%20InfroPay%2C%20preciso%20de%20suporte",
}: SupportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-card border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="text-center sm:text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/30 to-gold/30 flex items-center justify-center mb-3 border border-gold/30">
            <MessageCircle className="w-6 h-6 text-gold" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Suporte Oficial InfroPay
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Escolha o canal oficial para falar com a nossa equipa em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-2">
          {/* Instagram Oficial */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 rounded-xl border border-border/80 bg-background/60 hover:bg-accent/40 hover:border-pink-500/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1.5 text-foreground group-hover:text-pink-400 transition-colors">
                  Instagram Oficial
                  <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 font-mono">
                    @infropay.ao
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  Mensagens diretas (DM) e suporte na rede
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-pink-400 shrink-0 ml-2" />
          </a>

          {/* WhatsApp Oficial */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 rounded-xl border border-border/80 bg-background/60 hover:bg-accent/40 hover:border-emerald-500/50 transition-all duration-200"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <svg
                  className="w-5 h-5 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold flex items-center gap-1.5 text-foreground group-hover:text-emerald-400 transition-colors">
                  WhatsApp Suporte
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 uppercase tracking-wider font-semibold">
                    Online
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  Atendimento em tempo real via chat
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 shrink-0 ml-2" />
          </a>
        </div>

        <div className="mt-2 pt-3 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span>Seg a Sáb: 08:00 às 20:00 (Angola)</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Suporte verificado</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="w-full mt-2"
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
