import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

/** Catálogo público de produtos abertos a afiliação. */
export const listAffiliateOffers = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await pub()
    .from("products")
    .select(
      "id, slug, title, cover_url, price_cents, promo_price_cents, currency, sales_count, affiliate_commission_percent, category:categories(name), producer:profiles!products_producer_id_fkey(full_name, username, avatar_url)",
    )
    .eq("allow_affiliates", true)
    .eq("status", "publicado")
    .order("sales_count", { ascending: false })
    .limit(60);
  if (error) throw error;
  return data ?? [];
});

/** Regista um clique num link de afiliado (idempotência é do lado do cliente). */
export const registerAffiliateClick = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) =>
    z.object({ code: z.string().trim().min(4).max(40) }).parse(d),
  )
  .handler(async ({ data }) => {
    await pub().rpc("register_affiliate_click", { _code: data.code });
    return { ok: true };
  });

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** Gera (ou devolve) o link de afiliado do utilizador para um produto. */
export const createAffiliateLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string }) =>
    z.object({ product_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: product, error: pErr } = await context.supabase
      .from("products")
      .select("id, slug, producer_id, allow_affiliates, status")
      .eq("id", data.product_id)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!product || !product.allow_affiliates || product.status !== "publicado")
      throw new Error("Este produto não aceita afiliados");
    if (product.producer_id === context.userId)
      throw new Error("Não pode afiliar-se ao seu próprio produto");

    const { data: existing } = await context.supabase
      .from("affiliate_links")
      .select("id, code")
      .eq("product_id", product.id)
      .eq("affiliate_id", context.userId)
      .maybeSingle();
    if (existing) return { code: existing.code, slug: product.slug };

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode();
      const { data: row, error } = await context.supabase
        .from("affiliate_links")
        .insert({ product_id: product.id, affiliate_id: context.userId, code })
        .select("code")
        .single();
      if (!error) return { code: row.code, slug: product.slug };
      lastError = error;
    }
    throw lastError instanceof Error ? lastError : new Error("Não foi possível gerar o link");
  });

/** Painel do afiliado: links, cliques, vendas e comissões. */
export const getAffiliateOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: links }, { data: sales }] = await Promise.all([
      context.supabase
        .from("affiliate_links")
        .select(
          "id, code, clicks, created_at, product:products(id, slug, title, cover_url, currency, affiliate_commission_percent, price_cents, promo_price_cents)",
        )
        .eq("affiliate_id", context.userId)
        .order("created_at", { ascending: false }),
      context.supabase
        .from("sales")
        .select(
          "id, status, gross_cents, affiliate_commission_cents, currency, created_at, product:products(title, slug)",
        )
        .eq("affiliate_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const rows = (sales ?? []) as any[];
    const paid = rows.filter((s) => s.status === "pago");
    const pending = rows.filter((s) => s.status === "pendente");
    const byLink = new Map<string, { sales: number; earned: number }>();
    for (const s of paid) {
      const key = (s.product as any)?.slug ?? "";
      const cur = byLink.get(key) ?? { sales: 0, earned: 0 };
      byLink.set(key, {
        sales: cur.sales + 1,
        earned: cur.earned + (s.affiliate_commission_cents ?? 0),
      });
    }

    const clicks = (links ?? []).reduce((a, l: any) => a + (l.clicks ?? 0), 0);
    const earned = paid.reduce((a, s) => a + (s.affiliate_commission_cents ?? 0), 0);
    const pendingCents = pending.reduce((a, s) => a + (s.affiliate_commission_cents ?? 0), 0);

    return {
      clicks,
      salesCount: paid.length,
      earnedCents: earned,
      pendingCents,
      conversion: clicks ? paid.length / clicks : 0,
      links: (links ?? []).map((l: any) => ({
        ...l,
        stats: byLink.get(l.product?.slug ?? "") ?? { sales: 0, earned: 0 },
      })),
      recent: rows.slice(0, 20),
    };
  });
