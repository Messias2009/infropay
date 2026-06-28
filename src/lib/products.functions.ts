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
  price_cents: z.number().int().min(0).max(100_000_00),
  promo_price_cents: z.number().int().min(0).max(100_000_00).optional().nullable(),
  currency: z.string().length(3).default("AOA"),
  status: z.enum(["rascunho","publicado","pausado"]).default("rascunho"),
  tags: z.array(z.string().max(40)).max(20).default([]),
  external_url: z.string().url().optional().nullable().or(z.literal("")),
  guarantee_days: z.number().int().min(0).max(60).default(7),
});

export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("id, slug, title, status, price_cents, promo_price_cents, currency, sales_count, views_count, cover_url, created_at, category:categories(name)")
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Ensure user has producer role
    await context.supabase.from("user_roles").upsert(
      { user_id: context.userId, role: "producer" },
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
    const insert = {
      ...data,
      cover_url: data.cover_url || null,
      external_url: data.external_url || null,
      producer_id: context.userId,
    };
    const { data: row, error } = await context.supabase
      .from("products")
      .insert(insert)
      .select("id, slug")
      .single();
    if (error) throw error;
    return row;
  });

export const getMyProducerStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("products")
      .select("status, sales_count, views_count, price_cents")
      .eq("producer_id", context.userId);
    const rows = data ?? [];
    return {
      total: rows.length,
      published: rows.filter((r) => r.status === "publicado").length,
      drafts: rows.filter((r) => r.status === "rascunho").length,
      totalSales: rows.reduce((s, r) => s + (r.sales_count ?? 0), 0),
      totalViews: rows.reduce((s, r) => s + (r.views_count ?? 0), 0),
    };
  });
