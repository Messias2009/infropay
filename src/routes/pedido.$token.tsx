import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { CheckCircle2, Clock, Download, ExternalLink, Copy } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getOrderByToken } from "@/lib/checkout.functions";
import { referenceForMethod } from "@/lib/payments.config";

import { getOrderTracking } from "@/lib/tracking.functions";
import { TrackingScripts } from "@/components/TrackingScripts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const opt = (token: string) => queryOptions({
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
  errorComponent: ({ error }) => <div className="p-10 text-center text-destructive text-sm">{(error as Error).message}</div>,
  notFoundComponent: () => <SiteLayout><div className="p-10 text-center">Pedido não encontrado.</div></SiteLayout>,
  component: Pedido,
});

function fmt(c: number, cur: string) {
  try { return new Intl.NumberFormat("pt-PT",{style:"currency",currency:cur}).format(c/100); }
  catch { return `${cur} ${(c/100).toFixed(2)}`; }
}

const METHOD_LABEL: Record<string, string> = {
  multicaixa_express: "Multicaixa Express",
  referencia: "Referência Multicaixa",
  transferencia: "Transferência Bancária",
};

function Pedido() {
  const { token } = Route.useParams();
  const { data: o } = useSuspenseQuery(opt(token));
  const paid = o?.status === "pago";

  // Purchase é disparado uma única vez por pedido (guardado em localStorage).
  const [firedOnce, setFiredOnce] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setFiredOnce(window.localStorage.getItem(`ip_purchase_${token}`) === "1");
  }, [token]);

  const shouldTrack = paid && !firedOnce;
  const { data: tracking } = useQuery({
    queryKey: ["tracking", "order", token, shouldTrack],
    queryFn: () => getOrderTracking({ data: { token, notify: shouldTrack } }),
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
    <SiteLayout>
      {shouldTrack && tracking && (
        <TrackingScripts
          config={tracking}
          event={{
            type: "Purchase",
            id: tracking.content_id,
            name: tracking.content_name,
            value: tracking.value,
            currency: tracking.currency,
          }}
        />
      )}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className={`rounded-2xl border p-8 text-center ${paid ? "border-success/40 bg-success/5" : "border-gold/40 bg-gold/5"}`}>
          <div className={`mx-auto h-16 w-16 rounded-full grid place-items-center ${paid ? "gradient-brand" : "gradient-gold"}`}>
            {paid ? <CheckCircle2 className="h-8 w-8 text-primary-foreground" /> : <Clock className="h-8 w-8 text-gold-foreground" />}
          </div>
          <h1 className="mt-4 text-3xl font-bold">{paid ? "Pagamento confirmado!" : "A aguardar pagamento"}</h1>
          <p className="mt-2 text-muted-foreground">
            {paid ? "Acesso liberado — obrigado pela sua compra." : "Assim que confirmarmos o pagamento, o acesso será liberado automaticamente."}
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">Produto</div>
            <div className="flex gap-3">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-secondary shrink-0">
                {prod?.cover_url && <img src={prod.cover_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0">
                <div className="font-semibold line-clamp-2">{prod?.title}</div>
                <div className="mt-1 text-lg font-bold text-gradient-gold">{fmt(o.gross_cents, o.currency)}</div>
              </div>
            </div>
            {paid && (
              <div className="mt-4 space-y-2">
                {prod?.file_url && (
                  <a href={prod.file_url} target="_blank" rel="noreferrer">
                    <Button className="w-full gradient-brand text-primary-foreground"><Download className="h-4 w-4 mr-2" />Baixar produto</Button>
                  </a>
                )}
                {prod?.external_url && (
                  <a href={prod.external_url} target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full"><ExternalLink className="h-4 w-4 mr-2" />Aceder</Button>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-3">Detalhes</div>
            <dl className="space-y-2 text-sm">
              <Row k="Método" v={METHOD_LABEL[o.payment_method] ?? o.payment_method} />
              <Row k="Comprador" v={o.buyer_name ?? "-"} />
              <Row k="Email" v={o.buyer_email ?? "-"} />
              <Row k="Data" v={new Date(o.created_at).toLocaleString("pt-PT")} />
              <Row k="Referência" v={
                <button onClick={() => { navigator.clipboard.writeText(token); toast.success("Copiado"); }} className="inline-flex items-center gap-1 hover:text-foreground font-mono text-xs">
                  {token.slice(0, 12)}… <Copy className="h-3 w-3" />
                </button>
              } />
            </dl>
            {!paid && (
              <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                Guarde esta página. A confirmação atualiza automaticamente a cada 15 segundos.
              </div>
            )}
          </div>
        </div>

        {!paid && payRef && (
          <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/5 p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs font-semibold uppercase tracking-widest text-gold">
                Pagar por {payRef.provider}
              </div>
              {payRef.mode === "test" && (
                <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-warning">
                  Modo de teste
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <RefBox label="Entidade" value={payRef.entity} />
              <RefBox label="Referência" value={payRef.reference} />
              <RefBox label="Valor" value={fmt(o.gross_cents, o.currency)} />
            </div>
            <ol className="mt-5 space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
              {payRef.instructions.map((i) => <li key={i}>{i}</li>)}
            </ol>
          </div>
        )}


        <div className="mt-8 text-center">
          <Link to="/loja"><Button variant="outline">Continuar a explorar</Button></Link>
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
