import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const offerSchema = z.object({
  product_id: z.string().uuid(),
  offer_product_id: z.string().uuid(),
  kind: z.enum(["order_bump", "upsell", "downsell"]),
  headline: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  offer_price_cents: z.number().int().min(0).max(100_000_00),
  sort_order: z.number().int().min(0).max(99).default(0),
});

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/),
  product_id: z.string().uuid().optional().nullable(),
  discount_kind: z.enum(["percentagem", "valor"]),
  discount_value: z.number().int().min(1).max(10_000_00),
  max_uses: z.number().int().min(1).max(100_000).optional().nullable(),
  expires_at: z.string().optional().nullable(),
});

export const listMyOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("product_offers")
      .select(
        "*, product:products!product_offers_product_id_fkey(title, slug), offer:products!product_offers_offer_product_id_fkey(title, slug, price_cents, cover_url)",
      )
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => offerSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("product_offers")
      .insert({ ...data, producer_id: context.userId });
    if (error) throw error;
    return { ok: true };
  });

export const toggleOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("product_offers")
      .update({ active: data.active })
      .eq("id", data.id)
      .eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("product_offers")
      .delete()
      .eq("id", data.id)
      .eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const listMyCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("coupons")
      .select("*, product:products(title, slug)")
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const createCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => couponSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any).from("coupons").insert({
      ...data,
      code: data.code.toUpperCase(),
      product_id: data.product_id || null,
      expires_at: data.expires_at || null,
      producer_id: context.userId,
    });
    if (error) throw error;
    return { ok: true };
  });

export const toggleCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("coupons")
      .update({ active: data.active })
      .eq("id", data.id)
      .eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("coupons")
      .delete()
      .eq("id", data.id)
      .eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

/** Public: order bumps / upsells shown on a checkout page. */
export const getCheckoutOffers = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ product_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { createServerPublicClient } = await import("./public-client.server");
    const supabase = createServerPublicClient();
    const { data: rows } = await (supabase as any)
      .from("product_offers")
      .select(
        "id, kind, headline, description, offer_price_cents, sort_order, offer:products!product_offers_offer_product_id_fkey(title, slug, cover_url, price_cents)",
      )
      .eq("product_id", data.product_id)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    return rows ?? [];
  });

/** Public: validates a coupon code for a product and returns the discount in cents. */
export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        code: z.string().trim().min(3).max(32),
        product_id: z.string().uuid(),
        amount_cents: z.number().int().min(0),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { createServerPublicClient } = await import("./public-client.server");
    const supabase = createServerPublicClient();
    const { data: rows } = await (supabase as any)
      .from("coupons")
      .select(
        "id, code, discount_kind, discount_value, max_uses, uses_count, product_id, expires_at, active",
      )
      .eq("code", data.code.toUpperCase())
      .eq("active", true)
      .limit(5);
    const c = (rows ?? []).find((r: any) => !r.product_id || r.product_id === data.product_id);
    if (!c) return { valid: false as const, reason: "Cupão inválido." };
    if (c.expires_at && new Date(c.expires_at) < new Date())
      return { valid: false as const, reason: "Cupão expirado." };
    if (c.max_uses != null && c.uses_count >= c.max_uses)
      return { valid: false as const, reason: "Cupão esgotado." };
    const discount =
      c.discount_kind === "percentagem"
        ? Math.min(data.amount_cents, Math.round((data.amount_cents * c.discount_value) / 100))
        : Math.min(data.amount_cents, c.discount_value * 100);
    return { valid: true as const, code: c.code, discount_cents: discount };
  });
