import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageCircle, Mail, Headphones, HelpCircle, ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ open, onOpenChange }) => {
  const whatsappUrl =
    "https://wa.me/244923000000?text=" +
    encodeURIComponent(
      "Olá equipa da InfroPay! Preciso de apoio técnico relativamente à minha conta de produtor.",
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Suporte ao Produtor</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Estamos disponíveis para ajudar na tua jornada no InfroPay.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* WhatsApp Direto */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500 text-black">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition">
                  Atendimento WhatsApp Oficial
                </div>
                <div className="text-xs text-muted-foreground">
                  Resposta rápida com a nossa equipa técnica
                </div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
          </a>

          {/* Email de Suporte */}
          <a
            href="mailto:infropayao@gmail.com?subject=Apoio%20ao%20Produtor%20InfroPay"
            className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/60 hover:bg-accent/40 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary-glow">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Apoio por Correio Eletrónico
                </div>
                <div className="text-xs text-muted-foreground">infropayao@gmail.com</div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
          </a>

          {/* FAQ e Central */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-accent/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/15 text-gold">
                <HelpCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Perguntas Frequentes</div>
                <div className="text-xs text-muted-foreground">
                  Respostas rápidas às dúvidas comuns
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-gold/40 text-gold hover:bg-gold/10"
              onClick={() => {
                onOpenChange(false);
                window.location.href = "/faq";
              }}
            >
              Ver FAQ
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-gold" />
          <span>Atendimento de Segunda a Sexta, das 08h00 às 18h00 (WAT).</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
