import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const createOrderSchema = z.object({
  product_slug: z.string().min(1),
  buyer_name: z.string().trim().min(2).max(120),
  buyer_email: z.string().trim().email().max(180),
  buyer_phone: z.string().trim().min(6).max(40),
  payment_method: z.enum(["multicaixa_express", "referencia", "transferencia"]),
  ref: z.string().trim().min(4).max(40).optional().nullable(),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => createOrderSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = pub();
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id, producer_id, price_cents, promo_price_cents, currency, status, allow_affiliates, affiliate_commission_percent")
      .eq("slug", data.product_slug)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!product || product.status !== "publicado") throw new Error("Produto indisponível");

    const gross = product.promo_price_cents && product.promo_price_cents < product.price_cents
      ? product.promo_price_cents
      : product.price_cents;
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
        affiliateCommission = Math.round((gross * Number(product.affiliate_commission_percent ?? 0)) / 100);
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
  .inputValidator((d: { token: string }) => z.object({ token: z.string().min(10) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sale, error } = await supabaseAdmin
      .from("sales")
      .select("id, status, gross_cents, currency, payment_method, buyer_name, buyer_email, created_at, paid_at, product:products(title, slug, cover_url, file_url, external_url)")
      .eq("access_token", data.token)
      .maybeSingle();
    if (error) throw error;
    return sale;
  });

