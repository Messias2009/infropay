import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
});

export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("id, slug, title, status, price_cents, promo_price_cents, currency, sales_count, views_count, cover_url, rejection_reason, created_at, category:categories(name)")
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
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
    // If user tries to publish directly, force em_analise
    const status = data.status === "publicado" ? "em_analise" : data.status;
    const insert = {
      ...data, status,
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
    // Producers cannot self-publish; publish requests always go to em_analise
    const patch: Record<string, unknown> = { ...data.patch };
    if (patch.status === "publicado") patch.status = "em_analise";
    if (patch.cover_url === "") patch.cover_url = null;
    if (patch.banner_url === "") patch.banner_url = null;
    if (patch.file_url === "") patch.file_url = null;
    if (patch.external_url === "") patch.external_url = null;
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

export const submitProductForApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("products").update({ status: "em_analise", rejection_reason: null })
      .eq("id", data.id).eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
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
