import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { moderateProduct } from "@/lib/moderation";
import { z } from "zod";


const productSchema = z.object({
  title: z.string().trim().min(3).max(160),
  slug: z.string().trim().min(3).max(160).regex(/^[a-z0-9-]+$/),
  short_description: z.string().trim().max(280).optional().nullable(),
  description: z.string().trim().max(20000).optional().nullable(),
  product_type: z.enum(["ebook","curso","pdf","video","software","link_externo","streaming","assinatura","template","ia","comunidade","download"]),
  category_id: z.string().uuid().optional().nullable(),
  cover_url: z.string().url().optional().nullable().or(z.literal("")),
  banner_url: z.string().url().optional().nullable().or(z.literal("")),
  file_url: z.string().url().optional().nullable().or(z.literal("")),
  price_cents: z.number().int().min(0).max(100_000_00),
  promo_price_cents: z.number().int().min(0).max(100_000_00).optional().nullable(),
  currency: z.string().length(3).default("AOA"),
  status: z.enum(["rascunho","publicado","pausado","em_analise"]).default("rascunho"),
  tags: z.array(z.string().max(40)).max(20).default([]),
  external_url: z.string().url().optional().nullable().or(z.literal("")),
  guarantee_days: z.number().int().min(0).max(60).default(7),
  // entrega avançada
  delivery_kind: z.enum(["digital","fisico","apk","assinatura","membros","externo"]).default("digital"),
  stock_quantity: z.number().int().min(0).max(1_000_000).optional().nullable(),
  requires_shipping: z.boolean().default(false),
  shipping_fee_cents: z.number().int().min(0).max(100_000_00).default(0),
  weight_grams: z.number().int().min(0).max(200_000).optional().nullable(),
  app_version: z.string().trim().max(40).optional().nullable(),
  app_package: z.string().trim().max(120).optional().nullable(),
  app_requirements: z.string().trim().max(500).optional().nullable(),
  is_subscription: z.boolean().default(false),
  billing_interval: z.enum(["mensal","trimestral","semestral","anual"]).optional().nullable(),
  subscription_price_cents: z.number().int().min(0).max(100_000_00).optional().nullable(),
  trial_days: z.number().int().min(0).max(90).default(0),
  has_members_area: z.boolean().default(false),
  allow_affiliates: z.boolean().default(false),
  affiliate_commission_percent: z.number().min(0).max(80).default(30),
});

export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("id, slug, title, status, price_cents, promo_price_cents, currency, sales_count, views_count, cover_url, rejection_reason, created_at, allow_affiliates, affiliate_commission_percent, has_members_area, category:categories(name)")
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

/** Métricas por produto: vendas, receita, conversão, afiliados e comissões. */
export const getMyProductMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: products }, { data: sales }] = await Promise.all([
      context.supabase.from("products").select("id, title, slug, views_count, cover_url, price_cents, currency, status")
        .eq("producer_id", context.userId).order("created_at", { ascending: false }),
      context.supabase.from("sales").select("product_id, gross_cents, net_cents, affiliate_commission_cents, status, released")
        .eq("producer_id", context.userId),
    ]);
    const ids = (products ?? []).map((p) => p.id);
    const { data: allLinks } = ids.length
      ? await context.supabase.from("affiliate_links").select("product_id, affiliate_id, clicks").in("product_id", ids)
      : { data: [] as { product_id: string; affiliate_id: string; clicks: number }[] };

    return (products ?? []).map((p) => {
      const s = (sales ?? []).filter((x) => x.product_id === p.id);
      const paid = s.filter((x) => x.status === "pago");
      const l = (allLinks ?? []).filter((x) => x.product_id === p.id);
      const clicks = l.reduce((a, x) => a + (x.clicks ?? 0), 0);
      const views = p.views_count ?? 0;
      const base = views + clicks;
      const commissionPaid = paid.filter((x) => x.released).reduce((a, x) => a + (x.affiliate_commission_cents ?? 0), 0);
      const commissionPending = paid.filter((x) => !x.released).reduce((a, x) => a + (x.affiliate_commission_cents ?? 0), 0);
      return {
        id: p.id, title: p.title, slug: p.slug, cover_url: p.cover_url,
        currency: p.currency, status: p.status,
        views, clicks,
        sales: paid.length,
        revenue: paid.reduce((a, x) => a + (x.gross_cents ?? 0), 0),
        net: paid.reduce((a, x) => a + (x.net_cents ?? 0), 0),
        conversion: base > 0 ? (paid.length / base) * 100 : 0,
        activeAffiliates: new Set(l.map((x) => x.affiliate_id)).size,
        commissionPaid, commissionPending,
      };
    });
  });

/** Duplica um produto do próprio produtor como rascunho. */
export const duplicateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("products").select("*").eq("id", data.id).eq("producer_id", context.userId).maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Produto não encontrado");

    const {
      id: _id, created_at: _c, updated_at: _u, sales_count: _s, views_count: _v,
      reviews_count: _r, rating: _rt, rejection_reason: _rr, slug, title, ...rest
    } = row as Record<string, unknown> & { slug: string; title: string };

    const suffix = Date.now().toString(36).slice(-4);
    const { data: created, error: iErr } = await context.supabase
      .from("products")
      .insert({ ...rest, producer_id: context.userId, title: `${title} (cópia)`, slug: `${slug}-copia-${suffix}`.slice(0, 160), status: "rascunho" } as never)
      .select("id, slug").single();
    if (iErr) throw iErr;
    return created;
  });

export const getMyProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("products").select("*").eq("id", data.id).eq("producer_id", context.userId).maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Produto não encontrado");
    return row;
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("user_roles").upsert(
      { user_id: context.userId, role: "producer" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );

    // Aprovação automática: valida o conteúdo e publica de imediato se estiver conforme.
    let status = data.status;
    const rejection_reason: string | null = null;
    if (status === "publicado" || status === "em_analise") {
      const verdict = moderateProduct(data);
      if (!verdict.ok) throw new Error(verdict.reason);
      status = "publicado";
    }

    const insert = {
      ...data, status, rejection_reason,
      cover_url: data.cover_url || null,
      banner_url: data.banner_url || null,
      file_url: data.file_url || null,
      external_url: data.external_url || null,
      producer_id: context.userId,
    };
    const { data: row, error } = await context.supabase
      .from("products").insert(insert).select("id, slug, status").single();
    if (error) throw error;
    return row;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), patch: productSchema.partial() }).parse(d))
  .handler(async ({ data, context }) => {
    const patch = { ...data.patch } as any;
    for (const k of ["cover_url","banner_url","file_url","external_url"] as const) {
      if (patch[k] === "") patch[k] = null;
    }

    // Se o produtor quer publicar, valida automaticamente com base no estado final.
    if (patch.status === "publicado" || patch.status === "em_analise") {
      const { data: current } = await context.supabase
        .from("products")
        .select("title, short_description, description, external_url, file_url, tags, price_cents")
        .eq("id", data.id).eq("producer_id", context.userId).maybeSingle();
      const verdict = moderateProduct({ ...(current ?? {}), ...patch });
      if (!verdict.ok) {
        await context.supabase.from("products")
          .update({ status: "rascunho", rejection_reason: verdict.reason })
          .eq("id", data.id).eq("producer_id", context.userId);
        throw new Error(verdict.reason);
      }
      patch.status = "publicado";
      patch.rejection_reason = null;
    }

    const { data: row, error } = await context.supabase
      .from("products").update(patch).eq("id", data.id).eq("producer_id", context.userId)
      .select("id, slug, status").single();
    if (error) throw error;
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id).eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/** Publica o produto após validação automática de conteúdo. */
export const submitProductForApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: current, error: gErr } = await context.supabase
      .from("products")
      .select("title, short_description, description, external_url, file_url, tags, price_cents")
      .eq("id", data.id).eq("producer_id", context.userId).maybeSingle();
    if (gErr) throw gErr;
    if (!current) throw new Error("Produto não encontrado");

    const verdict = moderateProduct(current as any);
    if (!verdict.ok) {
      await context.supabase.from("products")
        .update({ status: "rascunho", rejection_reason: verdict.reason })
        .eq("id", data.id).eq("producer_id", context.userId);
      throw new Error(verdict.reason);
    }

    const { error } = await context.supabase
      .from("products").update({ status: "publicado", rejection_reason: null })
      .eq("id", data.id).eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true, status: "publicado" as const };
  });


export const getMyProducerStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("products").select("status, sales_count, views_count, price_cents")
      .eq("producer_id", context.userId);
    const rows = data ?? [];
    return {
      total: rows.length,
      published: rows.filter((r) => r.status === "publicado").length,
      drafts: rows.filter((r) => r.status === "rascunho").length,
      pending: rows.filter((r) => r.status === "em_analise").length,
      totalSales: rows.reduce((s, r) => s + (r.sales_count ?? 0), 0),
      totalViews: rows.reduce((s, r) => s + (r.views_count ?? 0), 0),
    };
  });
