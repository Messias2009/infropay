import { ShieldCheck, Info } from "lucide-react";

export function FeeBanner({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 flex items-center gap-3 text-sm">
        <ShieldCheck className="h-4 w-4 text-gold shrink-0" />
        <span className="text-muted-foreground">
          Taxas InfroPay: <b className="text-foreground">2%</b> por venda ·{" "}
          <b className="text-foreground">8%</b> por saque · Saque mínimo{" "}
          <b className="text-foreground">5.000 Kz</b>
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/10 via-card to-primary/10 p-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl gradient-brand grid place-items-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display font-semibold text-lg">Transparência total</div>
          <p className="text-sm text-muted-foreground mt-1">
            A InfroPay cobra apenas <b className="text-foreground">2% por cada venda</b> concluída e{" "}
            <b className="text-foreground">8% em cada saque</b>. Sem mensalidades, sem taxas
            escondidas. Saque mínimo de <b className="text-foreground">5.000 Kz</b> ·{" "}
            <b className="text-foreground">liberação em no mínimo 1 hora</b> após a aprovação do
            pagamento.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3" /> Valores exibidos já em Kwanzas (AOA).
          </div>
        </div>
      </div>
    </div>
  );
}

export function kz(cents: number | null | undefined) {
  const v = (cents ?? 0) / 100;
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(v);
}
