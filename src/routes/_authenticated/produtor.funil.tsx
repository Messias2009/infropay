import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Tag, TrendingUp, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { kz } from "@/components/finance/FeeBanner";
import { listMyProducts } from "@/lib/products.functions";
import {
  listMyOffers,
  createOffer,
  deleteOffer,
  toggleOffer,
  listMyCoupons,
  createCoupon,
  deleteCoupon,
  toggleCoupon,
} from "@/lib/funnel.functions";

export const Route = createFileRoute("/_authenticated/produtor/funil")({
  head: () => ({
    meta: [{ title: "Funil de vendas — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

const KIND_LABEL: Record<string, string> = {
  order_bump: "Order bump",
  upsell: "Upsell",
  downsell: "Downsell",
};

function Page() {
  const prodFn = useServerFn(listMyProducts);
  const offersFn = useServerFn(listMyOffers);
  const couponsFn = useServerFn(listMyCoupons);
  const createOfferFn = useServerFn(createOffer);
  const delOfferFn = useServerFn(deleteOffer);
  const togOfferFn = useServerFn(toggleOffer);
  const createCouponFn = useServerFn(createCoupon);
  const delCouponFn = useServerFn(deleteCoupon);
  const togCouponFn = useServerFn(toggleCoupon);

  const { data: products } = useQuery({
    queryKey: ["producer", "products"],
    queryFn: () => prodFn(),
  });
  const { data: offers, refetch: refetchOffers } = useQuery({
    queryKey: ["funnel", "offers"],
    queryFn: () => offersFn(),
  });
  const { data: coupons, refetch: refetchCoupons } = useQuery({
    queryKey: ["funnel", "coupons"],
    queryFn: () => couponsFn(),
  });

  const [offer, setOffer] = useState({
    product_id: "",
    offer_product_id: "",
    kind: "order_bump",
    headline: "",
    price: "",
  });
  const [coupon, setCoupon] = useState({
    code: "",
    product_id: "",
    discount_kind: "percentagem",
    discount_value: "",
    max_uses: "",
  });

  async function addOffer() {
    try {
      await createOfferFn({
        data: {
          product_id: offer.product_id,
          offer_product_id: offer.offer_product_id,
          kind: offer.kind as any,
          headline: offer.headline || null,
          description: null,
          offer_price_cents: Math.round(Number(offer.price || 0) * 100),
          sort_order: 0,
        },
      });
      toast.success("Oferta criada");
      setOffer({
        product_id: "",
        offer_product_id: "",
        kind: "order_bump",
        headline: "",
        price: "",
      });
      refetchOffers();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function addCoupon() {
    try {
      await createCouponFn({
        data: {
          code: coupon.code,
          product_id: coupon.product_id || null,
          discount_kind: coupon.discount_kind as any,
          discount_value: Number(coupon.discount_value || 0),
          max_uses: coupon.max_uses ? Number(coupon.max_uses) : null,
          expires_at: null,
        },
      });
      toast.success("Cupão criado");
      setCoupon({
        code: "",
        product_id: "",
        discount_kind: "percentagem",
        discount_value: "",
        max_uses: "",
      });
      refetchCoupons();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const list = products ?? [];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Conversão</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Funil de vendas</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Crie order bumps, upsells e cupões para aumentar o valor médio de cada compra.
        </p>
      </div>

      {/* OFERTAS */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary-glow" />
          <h2 className="font-display font-semibold text-lg">Ofertas do funil</h2>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-5">
          <div className="md:col-span-1">
            <Label className="text-xs">Produto principal</Label>
            <Select
              value={offer.product_id}
              onValueChange={(v) => setOffer({ ...offer, product_id: v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Escolher" />
              </SelectTrigger>
              <SelectContent>
                {list.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <Label className="text-xs">Produto ofertado</Label>
            <Select
              value={offer.offer_product_id}
              onValueChange={(v) => setOffer({ ...offer, offer_product_id: v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Escolher" />
              </SelectTrigger>
              <SelectContent>
                {list
                  .filter((p: any) => p.id !== offer.product_id)
                  .map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={offer.kind} onValueChange={(v) => setOffer({ ...offer, kind: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order_bump">Order bump</SelectItem>
                <SelectItem value="upsell">Upsell</SelectItem>
                <SelectItem value="downsell">Downsell</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Preço especial (Kz)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              step="0.01"
              value={offer.price}
              onChange={(e) => setOffer({ ...offer, price: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full gradient-brand text-primary-foreground shadow-glow"
              disabled={!offer.product_id || !offer.offer_product_id || !offer.price}
              onClick={addOffer}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          <div className="md:col-span-5">
            <Label className="text-xs">Chamada da oferta (opcional)</Label>
            <Input
              className="mt-1.5"
              value={offer.headline}
              onChange={(e) => setOffer({ ...offer, headline: e.target.value })}
              placeholder="Leve também o pack de templates com 60% off"
            />
          </div>
        </div>

        {!offers?.length ? (
          <div className="px-6 pb-6 text-sm text-muted-foreground">Sem ofertas configuradas.</div>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {offers.map((o: any) => (
              <div key={o.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary-glow uppercase tracking-wider font-semibold">
                  {KIND_LABEL[o.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{o.offer?.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    no checkout de {o.product?.title} · {o.headline || "sem chamada"}
                  </div>
                </div>
                <div className="text-sm font-semibold text-gradient-gold">
                  {kz(o.offer_price_cents)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await togOfferFn({ data: { id: o.id, active: !o.active } });
                    refetchOffers();
                  }}
                >
                  <Power className="h-3.5 w-3.5 mr-1" />
                  {o.active ? "Ativa" : "Inativa"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await delOfferFn({ data: { id: o.id } });
                    refetchOffers();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUPÕES */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Tag className="h-4 w-4 text-gold" />
          <h2 className="font-display font-semibold text-lg">Cupões de desconto</h2>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-5">
          <div>
            <Label className="text-xs">Código</Label>
            <Input
              className="mt-1.5 uppercase"
              value={coupon.code}
              onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })}
              placeholder="LANCAMENTO20"
            />
          </div>
          <div>
            <Label className="text-xs">Produto (opcional)</Label>
            <Select
              value={coupon.product_id}
              onValueChange={(v) => setCoupon({ ...coupon, product_id: v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {list.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select
              value={coupon.discount_kind}
              onValueChange={(v) => setCoupon({ ...coupon, discount_kind: v })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentagem">Percentagem (%)</SelectItem>
                <SelectItem value="valor">Valor fixo (Kz)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Valor</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              value={coupon.discount_value}
              onChange={(e) => setCoupon({ ...coupon, discount_value: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full gradient-brand text-primary-foreground shadow-glow"
              disabled={coupon.code.length < 3 || !coupon.discount_value}
              onClick={addCoupon}
            >
              <Plus className="h-4 w-4 mr-1" /> Criar cupão
            </Button>
          </div>
        </div>

        {!coupons?.length ? (
          <div className="px-6 pb-6 text-sm text-muted-foreground">Sem cupões criados.</div>
        ) : (
          <div className="divide-y divide-border border-t border-border">
            {coupons.map((c: any) => (
              <div key={c.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-bold text-gold">{c.code}</span>
                <div className="min-w-0 flex-1 text-xs text-muted-foreground truncate">
                  {c.discount_kind === "percentagem"
                    ? `${c.discount_value}% off`
                    : `${kz(c.discount_value * 100)} off`}{" "}
                  · {c.product?.title ?? "todos os produtos"} · {c.uses_count} usos
                  {c.max_uses ? ` / ${c.max_uses}` : ""}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await togCouponFn({ data: { id: c.id, active: !c.active } });
                    refetchCoupons();
                  }}
                >
                  <Power className="h-3.5 w-3.5 mr-1" />
                  {c.active ? "Ativo" : "Inativo"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await delCouponFn({ data: { id: c.id } });
                    refetchCoupons();
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
