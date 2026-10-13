import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Star,
  Wallet,
  Trophy,
  Rocket,
  Smartphone,
} from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Compra protegida", desc: "Garantia em todas as ordens" },
  { icon: Zap, title: "Entrega instantânea", desc: "Acesso liberado após pagamento" },
  { icon: TrendingUp, title: "Alta conversão", desc: "Checkout otimizado" },
  { icon: Star, title: "Curadoria premium", desc: "Produtos verificados" },
  { icon: Wallet, title: "Saque em Kwanza", desc: "A partir de 5.000 Kz" },
  { icon: Smartphone, title: "Multicaixa Express", desc: "Pagamento nacional" },
  { icon: Trophy, title: "Placas oficiais", desc: "10 níveis de conquista" },
  { icon: Rocket, title: "Comissão de 2%", desc: "A menor do mercado" },
];

export function TrustMarquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <section className="border-y border-border/60 bg-card/40 overflow-hidden">
      <div className="marquee-mask py-8">
        <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused] motion-reduce:animate-none">
          {row.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 w-[260px] shrink-0"
                aria-hidden={i >= ITEMS.length}
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 grid place-items-center shrink-0">
                  <Icon className="h-5 w-5 text-primary-glow" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
