import { createServerFn } from "@tanstack/react-start";
import { createServerPublicClient } from "@/lib/public-client.server";

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServerPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, icon, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
});

export const listPublishedProducts = createServerFn({ method: "GET" })
  .validator(
    (d: { category?: string; limit?: number; sort?: "popular" | "recent" } | undefined) => d ?? {},
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const recent = data?.sort === "recent";
    let q = supabase
      .from("products")
      .select(
        "id, slug, title, short_description, cover_url, price_cents, promo_price_cents, currency, rating, reviews_count, sales_count, created_at, category:categories(name, slug)",
      )
      .eq("store_visible", true)
      .eq("status", "publicado")
      .order(recent ? "created_at" : "sales_count", { ascending: false })
      .limit(data?.limit ?? 24);
    if (data?.category) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (cat?.id) q = q.eq("category_id", cat.id);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const supabase = createServerPublicClient();
    const { data: row, error } = await supabase
      .from("products")
      .select(
        "*, category:categories(name, slug), producer:profiles!products_producer_id_fkey(full_name, username, avatar_url)",
      )
      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();
    if (error) throw error;
    return row;
  });
