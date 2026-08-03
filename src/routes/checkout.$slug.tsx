import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldCheck, Lock, ArrowLeft, CreditCard, Smartphone, Building2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getProductBySlug } from "@/lib/catalog.functions";
import { createOrder } from "@/lib/checkout.functions";
import { getProductTracking } from "@/lib/tracking.functions";
import { TrackingScripts } from "@/components/TrackingScripts";
import { useQuery } from "@tanstack/react-query";

const opt = (slug: string) => queryOptions({
  queryKey: ["product-checkout", slug],
  queryFn: () => getProductBySlug({ data: { slug } }),
});

export const Route = createFileRoute("/checkout/$slug")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(opt(params.slug));
    if (!d) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "Checkout — InfroPay" },
      { name: "description", content: "Finalize a sua compra com segurança na InfroPay." },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const r = useRouter();
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md p-10 text-center">
          <p className="text-destructive text-sm mb-4">{(error as Error).message}</p>
          <Button onClick={() => { reset(); r.invalidate(); }}>Tentar novamente</Button>
        </div>
      </SiteLayout>
    );
  },
  notFoundComponent: () => (
    <SiteLayout><div className="p-10 text-center">Produto indisponível.</div></SiteLayout>
  ),
  component: Checkout,
});

const METHODS = [
  { id: "multicaixa_express", label: "Multicaixa Express", desc: "Pagamento instantâneo pela app", icon: Smartphone },
  { id: "referencia", label: "Referência Multicaixa", desc: "Pagar em ATM ou Internet Banking", icon: CreditCard },
  { id: "transferencia", label: "Transferência Bancária", desc: "IBAN + comprovativo", icon: Building2 },
] as const;

function fmt(c: number, cur: string) {
  try { return new Intl.NumberFormat("pt-PT",{style:"currency",currency:cur}).format(c/100); }
  catch { return `${cur} ${(c/100).toFixed(2)}`; }
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
  const [method, setMethod] = useState<typeof METHODS[number]["id"]>("multicaixa_express");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!p) return null;
  const price = p.promo_price_cents && p.promo_price_cents < p.price_cents ? p.promo_price_cents : p.price_cents;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createOrder({ data: { product_slug: slug, buyer_name: name, buyer_email: email, buyer_phone: phone, payment_method: method } });
      toast.success("Pedido criado! A aguardar pagamento.");
      router.navigate({ to: "/pedido/$token", params: { token: res.token } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <TrackingScripts
        config={tracking}
        event={{ type: "InitiateCheckout", id: p.id, name: p.title, value: price / 100, currency: p.currency }}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <Link to="/produto/$slug" params={{ slug }} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao produto
        </Link>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-8">
          <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Finalizar compra</h1>
              <p className="text-sm text-muted-foreground mt-1">Preencha os seus dados para receber o acesso.</p>
            </div>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">1. Dados de contacto</h2>
              <div className="grid gap-4">
                <div>
                  <Label>Nome completo</Label>
                  <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="O seu nome" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+244 900 000 000" />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">2. Método de pagamento</h2>
              <div className="grid gap-3">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <button type="button" key={m.id} onClick={() => setMethod(m.id)}
                      className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${active ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/40"}`}>
                      <div className={`h-10 w-10 rounded-lg grid place-items-center ${active ? "gradient-brand text-primary-foreground" : "bg-secondary"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{m.label}</div>
                        <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${active ? "border-primary bg-primary" : "border-border"}`} />
                    </button>
                  );
                })}
              </div>
            </section>

            <Button disabled={loading} size="lg" type="submit" className="w-full h-12 gradient-brand text-primary-foreground shadow-glow text-base">
              <Lock className="h-4 w-4 mr-2" />
              {loading ? "A processar..." : `Pagar ${fmt(price, p.currency)}`}
            </Button>

            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Ambiente seguro · Os seus dados são protegidos.
            </p>
          </form>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-4">Resumo do pedido</div>
              <div className="flex gap-4">
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-gold/10 shrink-0">
                  {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold line-clamp-2">{p.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">Entrega imediata após pagamento</div>
                </div>
              </div>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(price, p.currency)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Taxas</span><span>Grátis</span></div>
                <div className="pt-3 border-t border-border flex justify-between text-lg font-bold">
                  <span>Total</span><span className="text-gradient-gold">{fmt(price, p.currency)}</span>
                </div>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2"><ShieldCheck className="h-3.5 w-3.5 text-success mt-0.5" /> Compra 100% protegida</li>
                <li className="flex gap-2"><Lock className="h-3.5 w-3.5 text-gold mt-0.5" /> Confirmação enviada por email</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
