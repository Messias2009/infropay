import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, icon, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
});

export const listPublishedProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; limit?: number } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("products")
      .select("id, slug, title, short_description, cover_url, price_cents, promo_price_cents, currency, rating, reviews_count, sales_count, category:categories(name, slug)")
      .eq("status", "publicado")
      .order("sales_count", { ascending: false })
      .limit(data?.limit ?? 24);
    if (data?.category) {
      const { data: cat } = await supabase.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (cat?.id) q = q.eq("category_id", cat.id);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("products")
      .select("*, category:categories(name, slug), producer:profiles!products_producer_id_fkey(full_name, username, avatar_url)")
      .eq("slug", data.slug)
      .eq("status", "publicado")
      .maybeSingle();
    if (error) throw error;
    return row;
  });
