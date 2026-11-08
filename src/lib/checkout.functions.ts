import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseEnv } from "@/integrations/supabase/env";
import { PAYPAY_REFERENCE } from "@/lib/payments.config";

function pub() {
  const { url, key } = requireSupabaseEnv();
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const createOrderSchema = z.object({
  product_slug: z.string().min(1),
  buyer_name: z.string().trim().min(2).max(120),
  buyer_email: z.string().trim().email().max(180),
  buyer_phone: z.string().trim().min(6).max(40),
  payment_method: z.enum(["multicaixa_express", "referencia"]),
  ref: z.string().trim().min(4).max(40).optional().nullable(),
  order_bump_offer_id: z.string().uuid().optional().nullable(),
  coupon_code: z.string().trim().min(3).max(32).optional().nullable(),
  offer_id: z.string().uuid().optional().nullable(),
  parent_token: z.string().min(10).max(120).optional().nullable(),
  tracking_context: z.object({
    fbp: z.string().max(500).optional().nullable(),
    fbc: z.string().max(1000).optional().nullable(),
    ttp: z.string().max(500).optional().nullable(),
    ttclid: z.string().max(1200).optional().nullable(),
    user_agent: z.string().max(1000).optional().nullable(),
    page_url: z.string().url().max(2000).optional().nullable(),
    referrer: z.string().url().max(2000).optional().nullable(),
  }).optional(),
});

export const createOrder = createServerFn({ method: "POST" })
  .validator((d: unknown) => createOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin as any;

    // Post-purchase upsell/downsell: a new order is created only after the
    // original order is paid and the active offer is verified on the server.
    if (data.offer_id) {
      if (!data.parent_token) throw new Error("Pedido original não identificado.");
      const { data: parent, error: parentError } = await supabase
        .from("sales")
        .select("id, product_id, producer_id, status, origin, parent_sale_id, buyer_name, buyer_email, buyer_phone, payment_method, tracking_fbp, tracking_fbc, tracking_ttp, tracking_ttclid, tracking_user_agent, tracking_page_url, tracking_referrer")
        .eq("access_token", data.parent_token)
        .maybeSingle();
      if (parentError) throw parentError;
      if (!parent || parent.status !== "pago" || parent.parent_sale_id || (parent.origin ?? "principal") !== "principal")
        throw new Error("A oferta já não está disponível.");

      const { data: offer, error: offerError } = await supabase
        .from("product_offers")
        .select("id, kind, producer_id, product_id, offer_product_id, offer_price_cents")
        .eq("id", data.offer_id)
        .eq("product_id", parent.product_id)
        .eq("producer_id", parent.producer_id)
        .eq("active", true)
        .maybeSingle();
      if (offerError) throw offerError;
      if (!offer || !["upsell", "downsell"].includes(offer.kind))
        throw new Error("Esta oferta já não está ativa.");
      const { data: offeredProduct, error: offeredError } = await supabase
        .from("products")
        .select("id, slug, producer_id, status, currency")
        .eq("id", offer.offer_product_id)
        .maybeSingle();
      if (offeredError) throw offeredError;
      if (!offeredProduct || offeredProduct.status !== "publicado" || offeredProduct.producer_id !== parent.producer_id)
        throw new Error("Produto da oferta indisponível.");
      if (offeredProduct.slug !== data.product_slug)
        throw new Error("Produto da oferta inválido.");

      const { data: existing, error: existingError } = await supabase
        .from("sales")
        .select("id")
        .eq("parent_sale_id", parent.id)
        .eq("origin", offer.kind)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) throw new Error("Esta oferta já foi aceite anteriormente.");

      const gross = Number(offer.offer_price_cents);
      const fee = Math.round(gross * 0.02);
      const { data: created, error: createError } = await supabase
        .from("sales")
        .insert({
          product_id: offeredProduct.id,
          producer_id: parent.producer_id,
          buyer_name: parent.buyer_name,
          buyer_email: parent.buyer_email,
          buyer_phone: parent.buyer_phone,
          gross_cents: gross,
          platform_fee_cents: fee,
          net_cents: gross - fee,
          currency: offeredProduct.currency || "AOA",
          payment_method: parent.payment_method,
          provider: parent.payment_method === "referencia" ? PAYPAY_REFERENCE.provider : null,
          payment_ref: parent.payment_method === "referencia"
            ? `${PAYPAY_REFERENCE.entity}/${PAYPAY_REFERENCE.reference}`
            : null,
          status: "pendente",
          origin: offer.kind,
          parent_sale_id: parent.id,
          tracking_fbp: parent.tracking_fbp,
          tracking_fbc: parent.tracking_fbc,
          tracking_ttp: parent.tracking_ttp,
          tracking_ttclid: parent.tracking_ttclid,
          tracking_user_agent: parent.tracking_user_agent,
          tracking_page_url: parent.tracking_page_url,
          tracking_referrer: parent.tracking_referrer,
        })
        .select("access_token")
        .single();
      if (createError) throw createError;
      return { token: created.access_token };
    }

    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id, producer_id, price_cents, promo_price_cents, currency, status, allow_affiliates, affiliate_commission_percent")
      .eq("slug", data.product_slug)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!product || product.status !== "publicado") throw new Error("Produto indisponível");

    const baseGross =
      product.promo_price_cents && product.promo_price_cents < product.price_cents
        ? product.promo_price_cents
        : product.price_cents;

    // Validate the selected coupon against the product owner, product and live usage limit.
    let couponCode: string | null = null;
    let discountCents = 0;
    if (data.coupon_code) {
      const code = data.coupon_code.toUpperCase();
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("id, code, producer_id, product_id, discount_kind, discount_value, max_uses, uses_count, expires_at, active")
        .eq("producer_id", product.producer_id)
        .eq("code", code)
        .eq("active", true)
        .maybeSingle();
      if (couponError) throw couponError;
      if (!coupon || (coupon.product_id && coupon.product_id !== product.id))
        throw new Error("Cupão inválido para este produto.");
      if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now())
        throw new Error("Este cupão expirou.");
      if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses)
        throw new Error("Este cupão já atingiu o limite de utilizações.");
      discountCents = coupon.discount_kind === "percentagem"
        ? Math.min(baseGross, Math.round((baseGross * coupon.discount_value) / 100))
        : Math.min(baseGross, coupon.discount_value * 100);
      couponCode = coupon.code;
    }

    // The offer ID is never trusted from the browser: it must be an active
    // order bump for this exact product, owned by the same producer.
    let bump: any = null;
    if (data.order_bump_offer_id) {
      const { data: found, error: bumpError } = await supabase
        .from("product_offers")
        .select("id, producer_id, offer_product_id, offer_price_cents")
        .eq("id", data.order_bump_offer_id)
        .eq("product_id", product.id)
        .eq("producer_id", product.producer_id)
        .eq("kind", "order_bump")
        .eq("active", true)
        .maybeSingle();
      if (bumpError) throw bumpError;
      if (!found) throw new Error("Order Bump indisponível. Actualize a página.");
      const { data: bumpProduct, error: bumpProductError } = await supabase
        .from("products")
        .select("id, title, producer_id, status")
        .eq("id", found.offer_product_id)
        .maybeSingle();
      if (bumpProductError) throw bumpProductError;
      if (!bumpProduct || bumpProduct.status !== "publicado" || bumpProduct.producer_id !== product.producer_id)
        throw new Error("Produto adicional indisponível.");
      bump = { ...found, product: bumpProduct };
    }

    const gross = Math.max(0, baseGross - discountCents) + (bump ? Number(bump.offer_price_cents) : 0);
    const fee = Math.round(gross * 0.02);

    // Atribuição de afiliado (se o link for válido para este produto).
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
    const useReference = data.payment_method === "referencia";
    const { data: sale, error } = await supabase
      .from("sales")
      .insert({
        provider: useReference ? PAYPAY_REFERENCE.provider : null,
        payment_ref: useReference
          ? `${PAYPAY_REFERENCE.entity}/${PAYPAY_REFERENCE.reference}`
          : null,
        product_id: product.id,
        producer_id: product.producer_id,
        buyer_name: data.buyer_name,
        buyer_email: data.buyer_email,
        buyer_phone: data.buyer_phone,
        gross_cents: gross,
        platform_fee_cents: fee,
        net_cents: net,
        currency: product.currency,
        payment_method: data.payment_method,
        status: "pendente",
        affiliate_id: affiliateId,
        affiliate_code: affiliateCode,
        affiliate_commission_cents: affiliateCommission,
        coupon_code: couponCode,
        discount_cents: discountCents,
        tracking_fbp: data.tracking_context?.fbp ?? null,
        tracking_fbc: data.tracking_context?.fbc ?? null,
        tracking_ttp: data.tracking_context?.ttp ?? null,
        tracking_ttclid: data.tracking_context?.ttclid ?? null,
        tracking_user_agent: data.tracking_context?.user_agent ?? null,
        tracking_page_url: data.tracking_context?.page_url ?? null,
        tracking_referrer: data.tracking_context?.referrer ?? null,
      })
      .select("id, access_token")
      .single();
    if (error) throw error;

    if (bump) {
      const { error: itemError } = await supabase.from("sale_items").insert({
        sale_id: sale.id,
        product_id: bump.product.id,
        offer_id: bump.id,
        kind: "order_bump",
        title_snapshot: bump.product.title,
        price_cents: bump.offer_price_cents,
      });
      if (itemError) {
        await supabase.from("sales").delete().eq("id", sale.id).eq("status", "pendente");
        throw new Error("Não foi possível adicionar o produto complementar ao pedido. Tente novamente.");
      }
    }

    return { token: sale.access_token };
  });

export const getOrderByToken = createServerFn({ method: "GET" })
  .validator((d: { token: string }) => z.object({ token: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const base =
      "id, status, gross_cents, currency, payment_method, payment_ref, buyer_name, buyer_email, buyer_phone, created_at, paid_at, origin, parent_sale_id, product:products(title, slug, cover_url, file_url, external_url), sale_items(id, kind, title_snapshot, price_cents, product:products(title, cover_url, file_url, external_url))";
    const withReceipt = base + ", receipt_status, receipt_kind, receipt_submitted_at, receipt_note";

    let query = await supabaseAdmin
      .from("sales")
      .select(withReceipt)
      .eq("access_token", data.token)
      .maybeSingle();

    // A migração de comprovativos ainda pode não ter sido aplicada: o pedido
    // continua a funcionar, apenas sem o estado do comprovativo.
    if (query.error && /receipt_/.test(query.error.message ?? "")) {
      query = await supabaseAdmin
        .from("sales")
        .select(base)
        .eq("access_token", data.token)
        .maybeSingle();
    }

    // A select dinâmica perde a inferência de tipos do supabase-js: o formato
    // da linha é verificado em runtime pelo schema real.
    const result = query as unknown as { data: any; error: { message?: string } | null };
    if (result.error) throw new Error(result.error.message ?? "Erro ao consultar o pedido");
    const sale = result.data;
    if (!sale) return null;

    const shaped = {
      ...sale,
      receipt_status: sale.receipt_status ?? "sem_comprovativo",
      receipt_kind: sale.receipt_kind ?? null,
      receipt_submitted_at: sale.receipt_submitted_at ?? null,
      receipt_note: sale.receipt_note ?? null,
    };

    // Delivery authorization is enforced server-side, not just hidden in JSX.
    if (shaped.status !== "pago") {
      return {
        ...shaped,
        product: shaped.product
          ? { ...shaped.product, file_url: null, external_url: null }
          : shaped.product,
        sale_items: (shaped.sale_items ?? []).map((item: any) => ({
          ...item,
          product: item.product
            ? { ...item.product, file_url: null, external_url: null }
            : item.product,
        })),
      };
    }
    return shaped;
  });
