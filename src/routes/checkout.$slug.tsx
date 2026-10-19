import { createFileRoute, useRouter, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  Award,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/catalog.functions";
import { createOrder } from "@/lib/checkout.functions";
import multicaixaLogo from "@/assets/logo-multicaixa.svg";
import emisLogo from "@/assets/logo-emis.svg";
import { getRef } from "@/lib/affiliate-ref";
import { getProductTracking } from "@/lib/tracking.functions";
import { TrackingScripts } from "@/components/TrackingScripts";
import logoMark from "@/assets/infropay-mark.png";

const opt = (slug: string) =>
  queryOptions({
    queryKey: ["product-checkout", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });

function CheckoutError({ error, reset }: { error: unknown; reset: () => void }) {
  const r = useRouter();
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <header className="border-b border-border/70 bg-card/60 backdrop-blur-md py-4">
        <div className="mx-auto flex items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <img src={logoMark} alt="InfroPay" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight">
              Infro<span className="text-gradient-gold">Pay</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="mx-auto max-w-md w-full p-8 text-center rounded-2xl border border-border bg-card">
          <p className="text-destructive text-sm mb-4">{(error as Error).message}</p>
          <Button
            onClick={() => {
              reset();
              r.invalidate();
            }}
            className="gradient-brand text-primary-foreground font-semibold"
          >
            Tentar novamente
          </Button>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/checkout/$slug")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(opt(params.slug));
    if (!d) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Checkout Seguro — InfroPay" },
      { name: "description", content: "Finalize a sua compra com segurança na InfroPay." },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: CheckoutError,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <header className="border-b border-border/70 bg-card/60 backdrop-blur-md py-4">
        <div className="mx-auto flex items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <img src={logoMark} alt="InfroPay" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-lg font-bold tracking-tight">
              Infro<span className="text-gradient-gold">Pay</span>
            </span>
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-10 text-center text-muted-foreground">
        Produto indisponível ou esgotado.
      </div>
    </div>
  ),
  component: Checkout,
});

const METHODS = [
  {
    id: "multicaixa_express",
    label: "Multicaixa Express",
    desc: "Pagamento instantâneo no seu telefone",
    badge: "Mais Rápido",
    icon: Smartphone,
    tile: "bg-mcx-orange",
  },
  {
    id: "referencia",
    label: "Referência Multicaixa",
    desc: "Pague no ATM, Internet Banking ou Multicaixa Express",
    badge: "Multicaixa",
    icon: CreditCard,
    tile: "bg-mcx-blue",
  },
] as const;

function fmt(c: number, cur: string) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: cur }).format(c / 100);
  } catch {
    return `${cur} ${(c / 100).toFixed(2)}`;
  }
}

function Checkout() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const { data: p } = useSuspenseQuery(opt(slug));
  const { data: tracking } = useQuery({
    queryKey: ["tracking", "product", slug],
    queryFn: () => getProductTracking({ data: { slug } }),
    staleTime: 5 * 60_000,
  });
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("multicaixa_express");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!p) return null;

  const theme = p.checkout_theme || "azul";

  const price =
    p.promo_price_cents && p.promo_price_cents < p.price_cents
      ? p.promo_price_cents
      : p.price_cents;
  const hasPromo = Boolean(p.promo_price_cents && p.promo_price_cents < p.price_cents);

  // Botão estilizado conforme o tema escolhido pelo vendedor
  const actionButtonClass =
    theme === "dourado"
      ? "gradient-gold text-gold-foreground font-bold shadow-gold hover:opacity-90"
      : theme === "verde"
        ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg"
        : "gradient-brand text-primary-foreground font-bold shadow-glow hover:opacity-95";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const urlRef =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("ref")
          : null;
      const ref = urlRef ?? getRef(slug);
      const res = await createOrder({
        data: {
          product_slug: slug,
          buyer_name: name,
          buyer_email: email,
          buyer_phone: phone,
          payment_method: method,
          ref,
        },
      });
      toast.success("Pedido criado! A aguardar pagamento.");
      router.navigate({ to: "/pedido/$token", params: { token: res.token } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-gold/20 overflow-x-hidden">
      <TrackingScripts
        config={tracking}
        event={{
          type: "InitiateCheckout",
          id: p.id,
          name: p.title,
          value: price / 100,
          currency: p.currency,
        }}
      />

      {/* CABEÇALHO DO CHECKOUT: LOGO DO INFROPAY NO MEIO, SEM SELO DE SEGURANÇA NO TOPO */}
      <header className="border-b border-border/70 bg-card/60 backdrop-blur-md py-4 sticky top-0 z-40">
        <div className="mx-auto flex items-center justify-center px-4">
          <div className="flex items-center gap-2">
            <img
              src={p.checkout_logo_url || logoMark}
              alt={p.checkout_brand_name || "InfroPay"}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-lg object-contain shadow-xs"
            />
            {p.checkout_brand_name ? (
              <span className="text-xl font-bold tracking-tight text-foreground">
                {p.checkout_brand_name}
              </span>
            ) : (
              <span className="text-xl font-bold tracking-tight text-foreground">
                Infro<span className="text-gradient-gold">Pay</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL: COLUNA ÚNICA CENTRALIZADA, SEM ROLAGEM HORIZONTAL */}
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 w-full">
        <div className="w-full max-w-xl mx-auto overflow-x-hidden">
          {p.checkout_banner_url && (
            <img
              src={p.checkout_banner_url}
              alt={p.checkout_brand_name || p.title}
              referrerPolicy="no-referrer"
              className="w-full aspect-[3/1] object-cover rounded-2xl border border-border mb-6"
            />
          )}
          {/* RESUMO DO PRODUTO: CARTÃO COMPACTO COM MINIATURA, NOME, SELO E PREÇO */}
          <section
            aria-label="Resumo do pedido"
            className="mb-6 rounded-3xl border border-border bg-card p-4 sm:p-5 shadow-card"
          >
            <div className="flex items-start gap-4">
              {p.cover_url && (
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary">
                  <img
                    src={p.cover_url}
                    alt={p.title}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground border border-border">
                    {p.product_type || "Infoproduto"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
                    <CheckCircle2 className="h-3 w-3" />
                    Vendedor verificado
                  </span>
                </div>
                <h1 className="mt-2 text-base sm:text-lg font-bold leading-snug text-foreground line-clamp-3">
                  {p.title}
                </h1>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
              <div className="min-w-0">
                {hasPromo && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through tabular-nums">
                      {fmt(p.price_cents, p.currency)}
                    </span>
                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      -{Math.round((1 - price / p.price_cents) * 100)}%
                    </span>
                  </div>
                )}
                <div className="text-2xl sm:text-3xl font-extrabold text-gradient-gold tabular-nums leading-tight">
                  {fmt(price, p.currency)}
                </div>
              </div>
              <div className="text-right text-[11px] leading-tight text-muted-foreground">
                <div className="font-semibold text-foreground">Pagamento único</div>
                <div className="mt-0.5 inline-flex items-center gap-1">
                  <Zap className="h-3 w-3 text-primary" /> Acesso imediato
                </div>
              </div>
            </div>
          </section>

          {/* FORMULÁRIO DE PAGAMENTO (EM COLUNA ÚNICA) */}
          <form
            onSubmit={submit}
            className="w-full rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-card space-y-6 box-border"
          >
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Dados do Comprador
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Informe os dados para receber o acesso e o comprovativo oficial.
              </p>
            </div>

            {/* CAMPOS DE DADOS */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="checkout-name" className="text-xs font-semibold text-foreground">
                  Nome Completo
                </Label>
                <Input
                  id="checkout-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Baptista"
                  className="mt-1.5 h-11 w-full"
                />
              </div>

              <div>
                <Label htmlFor="checkout-email" className="text-xs font-semibold text-foreground">
                  Email para Receber o Acesso
                </Label>
                <Input
                  id="checkout-email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="mt-1.5 h-11 w-full"
                />
              </div>

              <div>
                <Label htmlFor="checkout-phone" className="text-xs font-semibold text-foreground">
                  Telefone de Contacto
                </Label>
                <Input
                  id="checkout-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244 923 000 000"
                  className="mt-1.5 h-11 w-full"
                />
              </div>
            </div>

            {/* MÉTODO DE PAGAMENTO */}
            <div className="pt-2 border-t border-border/80">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                Escolha o Método de Pagamento
              </Label>

              <div className="space-y-3">
                {METHODS.map((m) => {
                  const active = method === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`w-full flex items-center gap-3.5 rounded-2xl border p-3.5 sm:p-4 text-left transition cursor-pointer box-border ${
                        active
                          ? "border-primary bg-primary/10 shadow-glow"
                          : "border-border hover:border-primary/40 bg-card/60"
                      }`}
                    >
                      <div
                        className={`h-12 w-16 rounded-xl grid place-items-center shrink-0 ${m.tile} ${
                          active ? "ring-2 ring-gold" : ""
                        }`}
                      >
                        <img src={multicaixaLogo} alt="Multicaixa" className="w-12 h-auto object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{m.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground border border-border">
                            {m.badge}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {m.desc}
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border-2 shrink-0 grid place-items-center ${
                          active ? "border-primary bg-primary" : "border-border"
                        }`}
                      >
                        {active && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RESUMO SIMPLES DO VALOR */}
            <div className="rounded-2xl bg-secondary/50 p-4 border border-border/80 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-foreground">
                  {fmt(price, p.currency)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de processamento</span>
                <span className="text-emerald-400 font-semibold">Grátis</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between text-sm font-bold">
                <span className="text-foreground">Total a Pagar</span>
                <span className="text-gradient-gold font-mono tabular-nums">
                  {fmt(price, p.currency)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-border bg-card/60 p-3">
                <div className="rounded-lg bg-foreground px-2.5 py-1.5">
                  <img src={emisLogo} alt="EMIS" className="h-6 w-auto" />
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground text-left">
                  Pagamentos processados na rede Multicaixa, gerida pela EMIS — Empresa Interbancária de Serviços.
                </p>
              </div>
            </div>

            {/* BOTÃO PRINCIPAL DE PAGAMENTO */}
            <div className="pt-2">
              <Button
                disabled={loading}
                size="lg"
                type="submit"
                className={`w-full h-14 text-base rounded-xl cursor-pointer ${actionButtonClass}`}
              >
                <Lock className="h-5 w-5 mr-2" />
                {loading ? "A processar..." : "Confirmar compra"}
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground text-center mt-3.5">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="h-4 w-4 shrink-0" /> Pagamento 100% Seguro
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Award className="h-4 w-4 text-gold shrink-0" /> Garantia de{" "}
                  {p.guarantee_days ?? 7} dias
                </span>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* RODAPÉ MINIMALISTA */}
      <footer className="border-t border-border/70 bg-card/40 py-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="mx-auto max-w-xl px-4 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-foreground/80 font-medium text-xs">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Pagamento Seguro · Criptografia SSL 256-bit</span>
          </div>

          <div className="text-muted-foreground/80 text-[11px]">
            © {new Date().getFullYear()} InfroPay. Todos os direitos reservados.
          </div>

          <div className="flex items-center justify-center gap-3 pt-1 text-[11px] text-muted-foreground">
            <Link
              to="/termos"
              target="_blank"
              className="hover:text-foreground transition underline underline-offset-2"
            >
              Termos de Uso
            </Link>
            <span>·</span>
            <Link
              to="/privacidade"
              target="_blank"
              className="hover:text-foreground transition underline underline-offset-2"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
