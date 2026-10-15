import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerPublicClient } from "@/lib/public-client.server";

function pub() {
  return createServerPublicClient();
}

const createOrderSchema = z.object({
  product_slug: z.string().min(1),
  buyer_name: z.string().trim().min(2).max(120),
  buyer_email: z.string().trim().email().max(180),
  buyer_phone: z.string().trim().min(6).max(40),
  payment_method: z.enum(["multicaixa_express", "referencia", "transferencia"]),
  ref: z.string().trim().min(4).max(40).optional().nullable(),
  bump_offer_ids: z.array(z.string().uuid()).optional().default([]),
  coupon_code: z.string().trim().optional().nullable(),
});

export const createOrder = createServerFn({ method: "POST" })
  .validator((d: unknown) => createOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = pub();
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select(
        "id, producer_id, price_cents, promo_price_cents, currency, status, allow_affiliates, affiliate_commission_percent",
      )
      .eq("slug", data.product_slug)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!product || product.status !== "publicado") throw new Error("Produto indisponível");

    const baseGross =
      product.promo_price_cents && product.promo_price_cents < product.price_cents
        ? product.promo_price_cents
        : product.price_cents;

    // Calcular Order Bumps selecionados
    let bumpTotalCents = 0;
    if (data.bump_offer_ids && data.bump_offer_ids.length > 0) {
      const { data: bumps } = await (supabase as any)
        .from("product_offers")
        .select("id, offer_price_cents, active")
        .eq("product_id", product.id)
        .in("id", data.bump_offer_ids)
        .eq("active", true);

      if (bumps && bumps.length > 0) {
        bumpTotalCents = bumps.reduce((acc: number, b: any) => acc + (b.offer_price_cents || 0), 0);
      }
    }

    // Calcular Cupão de desconto se informado
    let discountCents = 0;
    let appliedCoupon: string | null = null;
    if (data.coupon_code) {
      const { data: coupons } = await (supabase as any)
        .from("coupons")
        .select(
          "id, code, discount_kind, discount_value, max_uses, uses_count, product_id, expires_at, active",
        )
        .eq("code", data.coupon_code.toUpperCase())
        .eq("active", true)
        .limit(5);

      const c = (coupons ?? []).find((r: any) => !r.product_id || r.product_id === product.id);
      if (c) {
        const notExpired = !c.expires_at || new Date(c.expires_at) >= new Date();
        const notExhausted = c.max_uses == null || c.uses_count < c.max_uses;
        if (notExpired && notExhausted) {
          const subtotal = baseGross + bumpTotalCents;
          discountCents =
            c.discount_kind === "percentagem"
              ? Math.min(subtotal, Math.round((subtotal * c.discount_value) / 100))
              : Math.min(subtotal, c.discount_value * 100);
          appliedCoupon = c.code;

          // Incrementar uso do cupão
          await (supabase as any)
            .from("coupons")
            .update({ uses_count: (c.uses_count || 0) + 1 })
            .eq("id", c.id);
        }
      }
    }

    const gross = Math.max(0, baseGross + bumpTotalCents - discountCents);
    const fee = Math.round(gross * 0.02);

    // Atribuição de afiliado (se o link for válido para este produto)
    let affiliateId: string | null = null;
    let affiliateCode: string | null = null;
    let affiliateCommission = 0;
    if (data.ref && product.allow_affiliates) {
      const { data: link } = await supabase
        .from("affiliate_links")
        .select("affiliate_id, product_id, code")
        .eq("code", data.ref)
        .maybeSingle();
      if (link && link.product_id === product.id && link.affiliate_id !== product.producer_id) {
        affiliateId = link.affiliate_id;
        affiliateCode = link.code;
        affiliateCommission = Math.round(
          (gross * Number(product.affiliate_commission_percent ?? 0)) / 100,
        );
      }
    }

    const net = gross - fee - affiliateCommission;

    const { data: sale, error } = await supabase
      .from("sales")
      .insert({
        product_id: product.id,
        producer_id: product.producer_id,
        buyer_name: data.buyer_name,
        buyer_email: data.buyer_email,
        buyer_phone: data.buyer_phone,
        gross_cents: gross,
        discount_cents: discountCents,
        coupon_code: appliedCoupon,
        platform_fee_cents: fee,
        net_cents: net,
        currency: product.currency,
        payment_method: data.payment_method,
        status: "pendente",
        affiliate_id: affiliateId,
        affiliate_code: affiliateCode,
        affiliate_commission_cents: affiliateCommission,
      })
      .select("access_token")
      .single();
    if (error) throw error;
    return { token: sale.access_token };
  });

export const getOrderByToken = createServerFn({ method: "GET" })
  .validator((d: { token: string }) => z.object({ token: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sale, error } = await supabaseAdmin
      .from("sales")
      .select(
        "id, status, gross_cents, currency, payment_method, buyer_name, buyer_email, created_at, paid_at, product:products(title, slug, cover_url, file_url, external_url)",
      )
      .eq("access_token", data.token)
      .maybeSingle();
    if (error) throw error;
    if (!sale) return null;
    // Delivery authorization is enforced server-side, not just hidden in JSX.
    if (sale.status !== "pago" && sale.product) {
      return { ...sale, product: { ...sale.product, file_url: null, external_url: null } };
    }
    return sale;
  });
