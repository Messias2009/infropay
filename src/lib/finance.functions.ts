import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type SB = any;

async function ensureWalletRow(supabase: SB, uid: string) {
  await (supabase as any).from("wallets").upsert({ producer_id: uid }, { onConflict: "producer_id" });
}

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // release matured sales first (no-op if none)
    try { await (context.supabase as any).rpc("release_matured_sales"); } catch {}
    await ensureWalletRow(context.supabase, context.userId);
    const { data } = await (context.supabase as any)
      .from("wallets").select("*").eq("producer_id", context.userId).maybeSingle();
    return data ?? { producer_id: context.userId, available_cents: 0, pending_cents: 0, currency: "AOA" };
  });

export const getMyFinanceOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try { await (context.supabase as any).rpc("release_matured_sales"); } catch {}
    const { data: sales } = await (context.supabase as any)
      .from("sales")
      .select("id, gross_cents, net_cents, platform_fee_cents, status, created_at, product_id, payment_method")
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(500);
    const rows = (sales ?? []) as any[];
    const paid = rows.filter(r => r.status === "pago");

    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sum = (arr: any[], k: string) => arr.reduce((a, r) => a + (r[k] ?? 0), 0);
    const inRange = (from: Date) => paid.filter(r => new Date(r.created_at) >= from);

    // last 14 days chart
    const series: { date: string; gross: number; net: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const dayRows = paid.filter(r => { const t = new Date(r.created_at); return t >= d && t < next; });
      series.push({
        date: d.toISOString().slice(5,10),
        gross: sum(dayRows, "gross_cents") / 100,
        net: sum(dayRows, "net_cents") / 100,
        count: dayRows.length,
      });
    }

    // top products
    const byProd: Record<string, { count: number; net: number }> = {};
    for (const r of paid) {
      byProd[r.product_id] = byProd[r.product_id] ?? { count: 0, net: 0 };
      byProd[r.product_id].count++;
      byProd[r.product_id].net += r.net_cents ?? 0;
    }
    const topIds = Object.entries(byProd).sort((a,b) => b[1].net - a[1].net).slice(0, 5).map(([id]) => id);
    let topProducts: any[] = [];
    if (topIds.length) {
      const { data: prods } = await (context.supabase as any)
        .from("products").select("id, title, cover_url").in("id", topIds);
      topProducts = (prods ?? []).map((p: any) => ({ ...p, ...byProd[p.id] }));
      topProducts.sort((a,b) => b.net - a.net);
    }

    const totalGross = sum(paid, "gross_cents");
    const totalNet = sum(paid, "net_cents");
    const totalFees = sum(paid, "platform_fee_cents");
    const salesCount = paid.length;

    return {
      today: { count: inRange(startOfDay).length, gross: sum(inRange(startOfDay), "gross_cents") },
      week: { count: inRange(startOfWeek).length, gross: sum(inRange(startOfWeek), "gross_cents") },
      month: { count: inRange(startOfMonth).length, gross: sum(inRange(startOfMonth), "gross_cents") },
      totalGross, totalNet, totalFees, salesCount,
      avgTicket: salesCount ? Math.round(totalGross / salesCount) : 0,
      series,
      topProducts,
      recent: rows.slice(0, 10),
    };
  });

export const listMyTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("sales")
      .select("id, gross_cents, net_cents, platform_fee_cents, status, payment_method, buyer_name, buyer_email, created_at, released, release_at, product:products(title, slug)")
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  });
