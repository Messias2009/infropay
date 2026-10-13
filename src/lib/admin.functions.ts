import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Acesso restrito a administradores");
}

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return !!data;
  });

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("bootstrap_admin");
    if (error) throw error;
    return { promoted: !!data };
  });

export const listPendingProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("products")
      .select(
        "id, slug, title, short_description, cover_url, price_cents, currency, product_type, created_at, producer_id, category:categories(name), producer:profiles!products_producer_id_fkey(full_name, username, avatar_url)",
      )
      .eq("status", "em_analise")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const listAllProductsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    let q = context.supabase
      .from("products")
      .select(
        "id, slug, title, status, cover_url, price_cents, currency, sales_count, created_at, producer:profiles!products_producer_id_fkey(full_name, username)",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (data?.status) q = q.eq("status", data.status as any);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const approveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("products")
      .update({ status: "publicado", rejection_reason: null })
      .eq("id", data.id);
    if (error) throw error;
    await logAdminAction(context.supabase, context.userId, "product_approved", "product", data.id);
    return { ok: true };
  });

export const rejectProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason: string }) =>
    z.object({ id: z.string().uuid(), reason: z.string().trim().min(3).max(500) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("products")
      .update({ status: "rascunho", rejection_reason: data.reason })
      .eq("id", data.id);
    if (error) throw error;
    await logAdminAction(context.supabase, context.userId, "product_rejected", "product", data.id, {
      reason: data.reason,
    });
    return { ok: true };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase.from("products").select("status");
    const rows = data ?? [];
    return {
      total: rows.length,
      published: rows.filter((r) => r.status === "publicado").length,
      pending: rows.filter((r) => r.status === "em_analise").length,
      drafts: rows.filter((r) => r.status === "rascunho").length,
    };
  });

// ---------------- Audit log helper ----------------
export async function logAdminAction(
  supabase: any,
  adminId: string,
  action: string,
  target_type: string,
  target_id: string,
  details: Record<string, unknown> = {},
) {
  let adminName: string | null = null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", adminId)
    .maybeSingle();
  adminName = prof?.full_name ?? prof?.username ?? null;
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    admin_name: adminName,
    action,
    target_type,
    target_id,
    details,
  });
}

export const listAdminLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { action?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    let q = (context.supabase as any)
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data?.action) q = q.eq("action", data.action);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

// ---------------- Users ----------------
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, avatar_url, is_banned, ban_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: sales } = await supabaseAdmin
      .from("sales")
      .select("producer_id, buyer_user_id, gross_cents, status");
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const emailById = new Map<string, string>();
    for (const u of authUsers?.users ?? []) if (u.id) emailById.set(u.id, u.email ?? "");

    const rolesById = new Map<string, string[]>();
    for (const r of roles ?? [])
      rolesById.set(r.user_id, [...(rolesById.get(r.user_id) ?? []), r.role as string]);

    const sold = new Map<string, number>();
    const spent = new Map<string, number>();
    for (const s of sales ?? []) {
      if (s.status !== "pago") continue;
      sold.set(s.producer_id, (sold.get(s.producer_id) ?? 0) + s.gross_cents);
      if (s.buyer_user_id)
        spent.set(s.buyer_user_id, (spent.get(s.buyer_user_id) ?? 0) + s.gross_cents);
    }

    const term = (data?.search ?? "").trim().toLowerCase();
    return (profiles ?? [])
      .map((p) => ({
        ...p,
        email: emailById.get(p.id) ?? "",
        roles: rolesById.get(p.id) ?? [],
        total_sold_cents: sold.get(p.id) ?? 0,
        total_spent_cents: spent.get(p.id) ?? 0,
      }))
      .filter(
        (p) =>
          !term ||
          (p.full_name ?? "").toLowerCase().includes(term) ||
          (p.username ?? "").toLowerCase().includes(term) ||
          p.email.toLowerCase().includes(term),
      );
  });

export const toggleUserBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; banned: boolean; reason?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        banned: z.boolean(),
        reason: z.string().trim().max(300).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.id === context.userId) throw new Error("Não pode bloquear a sua própria conta");
    const { error } = await (context.supabase as any)
      .from("profiles")
      .update({
        is_banned: data.banned,
        banned_at: data.banned ? new Date().toISOString() : null,
        ban_reason: data.banned ? (data.reason ?? "Sem motivo indicado") : null,
      })
      .eq("id", data.id);
    if (error) throw error;
    await logAdminAction(
      context.supabase,
      context.userId,
      data.banned ? "user_banned" : "user_unbanned",
      "user",
      data.id,
      { reason: data.reason ?? null },
    );
    return { ok: true };
  });

export const getMyAccountStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("profiles")
      .select("is_banned, ban_reason")
      .eq("id", context.userId)
      .maybeSingle();
    return { banned: !!data?.is_banned, reason: data?.ban_reason ?? null };
  });

// ---------------- Platform report ----------------
export const getPlatformReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: sales }, { data: withdrawals }, { data: products }, { data: profiles }] =
      await Promise.all([
        supabaseAdmin
          .from("sales")
          .select(
            "gross_cents, platform_fee_cents, net_cents, affiliate_commission_cents, status, created_at, paid_at, producer_id, product_id",
          ),
        supabaseAdmin.from("withdrawals").select("gross_cents, fee_cents, net_cents, status"),
        supabaseAdmin.from("products").select("id, title, slug, sales_count, producer_id"),
        supabaseAdmin.from("profiles").select("id, full_name, username"),
      ]);

    const paid = (sales ?? []).filter((s) => s.status === "pago");
    const gross = paid.reduce((a, s) => a + s.gross_cents, 0);
    const commissions = paid.reduce((a, s) => a + s.platform_fee_cents, 0);
    const affiliateCommissions = paid.reduce((a, s) => a + (s.affiliate_commission_cents ?? 0), 0);
    const wd = withdrawals ?? [];
    const withdrawalFees = wd
      .filter((w) => w.status === "pago")
      .reduce((a, w) => a + w.fee_cents, 0);
    const withdrawnNet = wd.filter((w) => w.status === "pago").reduce((a, w) => a + w.net_cents, 0);
    const pendingWithdrawals = wd
      .filter((w) => w.status === "em_analise" || w.status === "aprovado")
      .reduce((a, w) => a + w.gross_cents, 0);

    // last 30 days series
    const days: { date: string; total: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), total: 0, count: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const s of paid) {
      const key = (s.paid_at ?? s.created_at).slice(0, 10);
      const i = idx.get(key);
      if (i !== undefined) {
        days[i].total += s.gross_cents;
        days[i].count += 1;
      }
    }

    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? p.username ?? "—"]));
    const byProducer = new Map<string, number>();
    const byProduct = new Map<string, { revenue: number; count: number }>();
    for (const s of paid) {
      byProducer.set(s.producer_id, (byProducer.get(s.producer_id) ?? 0) + s.gross_cents);
      const cur = byProduct.get(s.product_id) ?? { revenue: 0, count: 0 };
      byProduct.set(s.product_id, { revenue: cur.revenue + s.gross_cents, count: cur.count + 1 });
    }
    const productById = new Map((products ?? []).map((p) => [p.id, p]));

    return {
      totals: {
        gross_cents: gross,
        commissions_cents: commissions,
        affiliate_commissions_cents: affiliateCommissions,
        withdrawal_fees_cents: withdrawalFees,
        withdrawn_cents: withdrawnNet,
        pending_withdrawals_cents: pendingWithdrawals,
        sales_count: paid.length,
        products_count: (products ?? []).length,
        users_count: (profiles ?? []).length,
      },
      series: days,
      top_producers: [...byProducer.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, revenue]) => ({ id, name: nameById.get(id) ?? "—", revenue_cents: revenue })),
      top_products: [...byProduct.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, v]) => ({
          id,
          title: productById.get(id)?.title ?? "—",
          slug: productById.get(id)?.slug ?? "",
          sales: v.count,
          revenue_cents: v.revenue,
        })),
    };
  });

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join(
    "\n",
  );
}

export const exportCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "pedidos" | "produtores" | "produtos" }) =>
    z.object({ kind: z.enum(["pedidos", "produtores", "produtos"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.kind === "pedidos") {
      const { data: rows } = await supabaseAdmin
        .from("sales")
        .select(
          "id, created_at, paid_at, status, payment_method, gross_cents, platform_fee_cents, net_cents, currency, buyer_name, buyer_email, product:products(title)",
        )
        .order("created_at", { ascending: false })
        .limit(5000);
      return toCsv(
        (rows ?? []).map((r: any) => ({
          id: r.id,
          criado: r.created_at,
          pago: r.paid_at,
          estado: r.status,
          metodo: r.payment_method,
          bruto: r.gross_cents / 100,
          comissao: r.platform_fee_cents / 100,
          liquido: r.net_cents / 100,
          moeda: r.currency,
          comprador: r.buyer_name,
          email: r.buyer_email,
          produto: r.product?.title,
        })),
      );
    }

    if (data.kind === "produtos") {
      const { data: rows } = await supabaseAdmin
        .from("products")
        .select(
          "id, title, slug, status, price_cents, currency, sales_count, views_count, created_at",
        )
        .order("sales_count", { ascending: false })
        .limit(5000);
      return toCsv(
        (rows ?? []).map((r: any) => ({
          id: r.id,
          titulo: r.title,
          slug: r.slug,
          estado: r.status,
          preco: r.price_cents / 100,
          moeda: r.currency,
          vendas: r.sales_count,
          visualizacoes: r.views_count,
          criado: r.created_at,
        })),
      );
    }

    const [{ data: profiles }, { data: sales }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, username, is_banned, created_at"),
      supabaseAdmin.from("sales").select("producer_id, gross_cents, status"),
    ]);
    const sold = new Map<string, { revenue: number; count: number }>();
    for (const s of sales ?? []) {
      if (s.status !== "pago") continue;
      const c = sold.get(s.producer_id) ?? { revenue: 0, count: 0 };
      sold.set(s.producer_id, { revenue: c.revenue + s.gross_cents, count: c.count + 1 });
    }
    return toCsv(
      (profiles ?? []).map((p) => ({
        id: p.id,
        nome: p.full_name,
        username: p.username,
        bloqueado: p.is_banned,
        faturamento: (sold.get(p.id)?.revenue ?? 0) / 100,
        vendas: sold.get(p.id)?.count ?? 0,
        registo: p.created_at,
      })),
    );
  });
