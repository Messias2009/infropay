import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Link2,
  MousePointerClick,
  ShoppingCart,
  Wallet,
  Hourglass,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listAffiliateOffers,
  createAffiliateLink,
  getAffiliateOverview,
} from "@/lib/affiliate.functions";

export const Route = createFileRoute("/_authenticated/afiliados")({
  head: () => ({
    meta: [
      { title: "Afiliados — InfroPay" },
      {
        name: "description",
        content: "Promova produtos da InfroPay e ganhe comissão em cada venda.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function kz(cents: number, currency = "AOA") {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function linkFor(slug: string, code: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://infropay.lovable.app";
  return `${origin}/produto/${slug}?ref=${code}`;
}

function Page() {
  const qc = useQueryClient();
  const offersFn = useServerFn(listAffiliateOffers);
  const overviewFn = useServerFn(getAffiliateOverview);
  const createFn = useServerFn(createAffiliateLink);
  const [tab, setTab] = useState<"ofertas" | "meus">("ofertas");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: offers } = useQuery({
    queryKey: ["affiliate", "offers"],
    queryFn: () => offersFn(),
  });
  const { data: ov } = useQuery({
    queryKey: ["affiliate", "overview"],
    queryFn: () => overviewFn(),
  });

  async function generate(productId: string) {
    setBusy(productId);
    try {
      const res = await createFn({ data: { product_id: productId } });
      await navigator.clipboard.writeText(linkFor(res.slug, res.code)).catch(() => {});
      toast.success("Link de afiliado gerado e copiado!");
      qc.invalidateQueries({ queryKey: ["affiliate", "overview"] });
      setTab("meus");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">
          Programa de afiliados
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">
          Ganhe comissão a divulgar
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Gere o seu link único, partilhe, e receba a sua comissão na carteira assim que a venda for
          paga.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={MousePointerClick} label="Cliques" value={String(ov?.clicks ?? 0)} />
        <Kpi icon={ShoppingCart} label="Vendas geradas" value={String(ov?.salesCount ?? 0)} />
        <Kpi icon={Wallet} label="Comissão ganha" value={kz(ov?.earnedCents ?? 0)} highlight />
        <Kpi icon={Hourglass} label="Comissão pendente" value={kz(ov?.pendingCents ?? 0)} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["ofertas", "meus"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${tab === t ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {t === "ofertas" ? "Produtos disponíveis" : "Meus links"}
            </button>
          ))}
        </div>
        <Link
          to="/produtor/saques"
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Sacar comissões (taxa 8%)
        </Link>
      </div>

      {tab === "ofertas" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(offers ?? []).map((p: any) => {
            const price =
              p.promo_price_cents && p.promo_price_cents < p.price_cents
                ? p.promo_price_cents
                : p.price_cents;
            const commission = Math.round(
              (price * Number(p.affiliate_commission_percent ?? 0)) / 100,
            );
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-gold/10">
                  {p.cover_url && (
                    <img
                      src={p.cover_url}
                      alt={p.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="font-semibold line-clamp-2">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    por {p.producer?.full_name ?? p.producer?.username ?? "Produtor"}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Preço </span>
                    <b>{kz(price, p.currency)}</b>
                  </div>
                  <div className="text-sm text-gold font-semibold">
                    {Number(p.affiliate_commission_percent)}% · ganha {kz(commission, p.currency)}{" "}
                    por venda
                  </div>
                  <Button
                    className="mt-auto gradient-brand text-primary-foreground"
                    disabled={busy === p.id}
                    onClick={() => generate(p.id)}
                  >
                    <Link2 className="h-4 w-4 mr-1" />{" "}
                    {busy === p.id ? "A gerar..." : "Gerar meu link"}
                  </Button>
                </div>
              </div>
            );
          })}
          {!(offers ?? []).length && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
              <Handshake className="h-12 w-12 text-gold mx-auto mb-3" />
              <h3 className="font-display text-xl font-semibold">Sem ofertas por agora</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nenhum produtor abriu afiliação neste momento.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(ov?.links ?? []).map((l: any) => {
            const url = linkFor(l.product?.slug ?? "", l.code);
            return (
              <div
                key={l.id}
                className="rounded-2xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                  {l.product?.cover_url && (
                    <img src={l.product.cover_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{l.product?.title}</div>
                  <div className="text-xs text-muted-foreground truncate font-mono">{url}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {l.clicks} cliques · {l.stats.sales} vendas ·{" "}
                    {kz(l.stats.earned, l.product?.currency ?? "AOA")} ganhos
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => copy(url)}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar link
                </Button>
              </div>
            );
          })}
          {!(ov?.links ?? []).length && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
              Ainda não gerou nenhum link. Escolha um produto em “Produtos disponíveis”.
            </div>
          )}

          {!!(ov?.recent ?? []).length && (
            <div className="rounded-2xl border border-border bg-card overflow-x-auto mt-6">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left p-3">Produto</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-right p-3">Comissão</th>
                    <th className="text-left p-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {(ov?.recent ?? []).map((s: any) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0">
                      <td className="p-3">{s.product?.title ?? "—"}</td>
                      <td className="p-3 text-xs uppercase tracking-wide text-muted-foreground">
                        {s.status}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {kz(s.affiliate_commission_cents ?? 0, s.currency)}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("pt-PT")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${highlight ? "border-gold/40 bg-gold/5" : "border-border bg-card"}`}
    >
      <Icon className={`h-4 w-4 ${highlight ? "text-gold" : "text-muted-foreground"}`} />
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-2">{label}</div>
      <div className={`mt-1 text-2xl font-display font-bold ${highlight ? "text-gold" : ""}`}>
        {value}
      </div>
    </div>
  );
}
