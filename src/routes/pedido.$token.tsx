import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Download, ExternalLink, Copy } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getOrderByToken, createOrder } from "@/lib/checkout.functions";
import { getPostPurchaseOffers } from "@/lib/funnel.functions";
import { referenceForMethod } from "@/lib/payments.config";
import { ReferenceGeneration } from "@/components/payments/ReferenceGeneration";
import { ReceiptUpload } from "@/components/payments/ReceiptUpload";

import { getOrderTracking } from "@/lib/tracking.functions";
import { TrackingScripts } from "@/components/TrackingScripts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

function readTrackingContext() {
  if (typeof window === "undefined") return undefined;
  const cookie = (name: string) => {
    const item = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
    return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
  };
  const params = new URLSearchParams(window.location.search);
  return {
    fbp: cookie("_fbp"),
    fbc: cookie("_fbc"),
    ttp: cookie("_ttp"),
    ttclid: params.get("ttclid") || cookie("ttclid"),
    user_agent: navigator.userAgent,
    page_url: window.location.href,
    referrer: document.referrer || null,
  };
}

const opt = (token: string) =>
  queryOptions({
    queryKey: ["order", token],
    queryFn: () => getOrderByToken({ data: { token } }),
    refetchInterval: 15000,
  });

export const Route = createFileRoute("/pedido/$token")({
  loader: async ({ context, params }) => {
    const d = await context.queryClient.ensureQueryData(opt(params.token));
    if (!d) throw notFound();
  },
  head: () => ({ meta: [{ title: "Pedido — InfroPay" }, { name: "robots", content: "noindex" }] }),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-destructive text-sm">{(error as Error).message}</div>
  ),
  notFoundComponent: () => (
    <SiteLayout variant="checkout">
      <div className="p-10 text-center">Pedido não encontrado.</div>
    </SiteLayout>
  ),
  component: Pedido,
});

function fmt(c: number, cur: string) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: cur }).format(c / 100);
  } catch {
    return `${cur} ${(c / 100).toFixed(2)}`;
  }
}

const METHOD_LABEL: Record<string, string> = {
  multicaixa_express: "Multicaixa Express",
  referencia: "Referência Multicaixa",
  transferencia: "Transferência Bancária",
};

function Pedido() {
  const { token } = Route.useParams();
  const router = useRouter();
  const { data: o } = useSuspenseQuery(opt(token));
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["order", token] });
  const paid = o?.status === "pago";
  const { data: postOffers } = useQuery({
    queryKey: ["post-purchase-offers", token],
    queryFn: () => getPostPurchaseOffers({ data: { token } }),
    enabled: paid,
    staleTime: Infinity,
  });
  const [showDownsell, setShowDownsell] = useState(false);
  const [hideOffers, setHideOffers] = useState(false);
  const [offerBusy, setOfferBusy] = useState(false);
  const activeOffer = hideOffers
    ? null
    : showDownsell
      ? postOffers?.downsell ?? null
      : postOffers?.upsell ?? postOffers?.downsell ?? null;

  async function acceptOffer() {
    if (!activeOffer || !o) return;
    setOfferBusy(true);
    try {
      const result = await createOrder({
        data: {
          product_slug: activeOffer.offer.slug,
          buyer_name: o.buyer_name ?? "",
          buyer_email: o.buyer_email ?? "",
          buyer_phone: (o as any).buyer_phone ?? "",
          payment_method: o.payment_method,
          offer_id: activeOffer.id,
          parent_token: token,
        },
      });
      router.navigate({ to: "/pedido/$token", params: { token: result.token } });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setOfferBusy(false);
    }
  }

  function declineOffer() {
    if (!showDownsell && postOffers?.upsell && postOffers?.downsell) {
      setShowDownsell(true);
    } else {
      setHideOffers(true);
    }
  }

  // Purchase é disparado uma única vez por pedido (guardado em localStorage).
  const [firedOnce, setFiredOnce] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setFiredOnce(window.localStorage.getItem(`ip_purchase_${token}`) === "1");
  }, [token]);

  const shouldTrack = paid && !firedOnce;
  const { data: tracking } = useQuery({
    queryKey: ["tracking", "order", token, shouldTrack],
    queryFn: () =>
      getOrderTracking({
        data: {
          token,
          notify: shouldTrack,
          tracking_context: readTrackingContext(),
        },
      }),
    enabled: paid,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (shouldTrack && tracking) {
      window.localStorage.setItem(`ip_purchase_${token}`, "1");
      setFiredOnce(true);
    }
  }, [shouldTrack, tracking, token]);

  if (!o) return null;
  const prod = o.product as any;
  const payRef = referenceForMethod(o.payment_method);

  return (
    <SiteLayout variant="checkout">
      {shouldTrack && tracking && (
        <TrackingScripts
          config={tracking}
          event={{
            type: "Purchase",
            id: tracking.content_id,
            eventId: tracking.event_id,
            name: tracking.content_name,
            value: tracking.value,
            currency: tracking.currency,
          }}
        />
      )}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div
          className={`rounded-2xl border p-8 text-center ${paid ? "border-success/40 bg-success/5" : "border-gold/40 bg-gold/5"}`}
        >
          <div
            className={`mx-auto h-16 w-16 rounded-full grid place-items-center ${paid ? "gradient-brand" : "gradient-gold"}`}
          >
            {paid ? (
              <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
            ) : (
              <Clock className="h-8 w-8 text-gold-foreground" />
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold">
            {paid ? "Pagamento confirmado!" : "A aguardar pagamento"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {paid
              ? "Acesso liberado — obrigado pela sua compra."
              : "Assim que confirmarmos o pagamento, o acesso será liberado automaticamente."}
          </p>
        </div>

        {paid && activeOffer && (
          <section className="mt-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 sm:p-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
              Oferta exclusiva após a compra
            </div>
            <h2 className="text-xl font-bold">
              {activeOffer.headline || (showDownsell ? "Uma última oferta especial para si" : "Aproveite esta oferta especial")}
            </h2>
            <div className="mt-4 flex items-center gap-4">
              {activeOffer.offer?.cover_url && (
                <img src={activeOffer.offer.cover_url} alt="" className="h-20 w-20 rounded-xl object-cover border border-border shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-semibold">{activeOffer.offer?.title}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeOffer.description || activeOffer.offer?.short_description || "Adicione este produto à sua compra."}
                </p>
                <div className="mt-2 text-lg font-extrabold text-gradient-gold">
                  {fmt(Number(activeOffer.offer_price_cents), activeOffer.offer?.currency || o.currency)}
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button disabled={offerBusy} onClick={acceptOffer} className="gradient-brand text-primary-foreground">
                {offerBusy ? "A preparar pedido..." : "Sim, quero aproveitar"}
              </Button>
              <Button disabled={offerBusy} variant="outline" onClick={declineOffer}>
                Não, obrigado
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Ao aceitar, será criado um novo pedido com o preço especial. O acesso será liberado após a confirmação desse pagamento.
            </p>
          </section>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
              Produto
            </div>
            <div className="flex gap-3">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-secondary shrink-0">
                {prod?.cover_url && (
                  <img src={prod.cover_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold line-clamp-2">{prod?.title}</div>
                <div className="mt-1 text-lg font-bold text-gradient-gold">
                  {fmt(o.gross_cents, o.currency)}
                </div>
              </div>
            </div>
            {paid && (o.sale_items ?? []).map((item: any) => (
              <div key={item.id} className="mt-4 rounded-xl border border-border p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                  Produto adicional incluído
                </div>
                <div className="font-semibold text-sm">{item.title_snapshot || item.product?.title}</div>
                <div className="text-sm font-bold text-gradient-gold mt-1">
                  {fmt(Number(item.price_cents), o.currency)}
                </div>
                {item.product?.file_url && (
                  <a href={item.product.file_url} target="_blank" rel="noreferrer" className="block mt-3">
                    <Button className="w-full gradient-brand text-primary-foreground">
                      <Download className="h-4 w-4 mr-2" /> Baixar produto adicional
                    </Button>
                  </a>
                )}
                {item.product?.external_url && (
                  <a href={item.product.external_url} target="_blank" rel="noreferrer" className="block mt-2">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" /> Aceder ao produto adicional
                    </Button>
                  </a>
                )}
              </div>
            ))}
            {paid && (
              <div className="mt-4 space-y-2">
                {prod?.file_url && (
                  <a href={prod.file_url} target="_blank" rel="noreferrer">
                    <Button className="w-full gradient-brand text-primary-foreground">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar produto
                    </Button>
                  </a>
                )}
                {prod?.external_url && (
                  <a href={prod.external_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Aceder
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">
              Detalhes
            </div>
            <dl className="space-y-2 text-sm">
              <Row k="Método" v={METHOD_LABEL[o.payment_method] ?? o.payment_method} />
              <Row k="Comprador" v={o.buyer_name ?? "-"} />
              <Row k="Email" v={o.buyer_email ?? "-"} />
              <Row k="Data" v={new Date(o.created_at).toLocaleString("pt-PT")} />
              <Row
                k="Referência"
                v={
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(token);
                      toast.success("Copiado");
                    }}
                    className="inline-flex items-center gap-1 hover:text-foreground font-mono text-xs"
                  >
                    {token.slice(0, 12)}… <Copy className="h-3 w-3" />
                  </button>
                }
              />
            </dl>
            {!paid && (
              <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                Guarde esta página. A confirmação atualiza automaticamente a cada 15 segundos.
              </div>
            )}
          </div>
        </div>

        {!paid && payRef && (
          <div className="mt-6">
            <ReferenceGeneration reference={payRef} amountLabel={fmt(o.gross_cents, o.currency)} />
          </div>
        )}

        <div className="mt-6">
          <ReceiptUpload
            token={token}
            receiptStatus={(o as any).receipt_status ?? "sem_comprovativo"}
            receiptKind={(o as any).receipt_kind}
            receiptNote={(o as any).receipt_note}
            orderStatus={o.status}
            onSubmitted={refresh}
          />
        </div>

      </div>
    </SiteLayout>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium text-right min-w-0 truncate">{v}</dd>
    </div>
  );
}
