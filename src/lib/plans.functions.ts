import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PAYPAY_REFERENCE } from "@/lib/payments.config";

/**
 * Quiz Funnel — Passo 1: controlo de acesso Premium.
 *
 * O plano é sempre verificado e criado no servidor. O teste grátis de 1 dia
 * só pode ser activado uma vez por conta (índice único parcial na base de
 * dados), a compra de plano usa os mesmos métodos da InfroPay (Entidade/
 * Referência PayPay + comprovativo verificado pela administração) e só
 * depois disso nasce a subscrição.
 */

const SETUP_MESSAGE =
  "A configuração dos planos ainda não foi aplicada. Execute a migração " +
  "supabase/migrations/20261026000002_quiz_funnel_premium.sql no SQL Editor do Supabase.";

const BUCKET = "payment-receipts";
const MAX_BYTES = 10 * 1024 * 1024;
const DAY_MS = 24 * 60 * 60 * 1000;

const ALLOWED_TYPES: Record<string, "imagem" | "pdf"> = {
  "image/png": "imagem",
  "image/jpeg": "imagem",
  "image/webp": "imagem",
  "application/pdf": "pdf",
};

export const PLAN_PRICES = {
  "7d": {
    label: "Premium 7 dias",
    short: "7 dias",
    days: 7,
    price_cents: 1_360_000,
    price_label: "13.600 Kz",
  },
  "30d": {
    label: "Premium 30 dias",
    short: "30 dias",
    days: 30,
    price_cents: 2_100_000,
    price_label: "21.000 Kz",
  },
} as const;

export type PlanKey = keyof typeof PLAN_PRICES;
export const PLAN_KEYS = Object.keys(PLAN_PRICES) as PlanKey[];

export type PlanState = {
  premium: boolean;
  plano: string | null;
  estado: string | null;
  data_fim: string | null;
  dias_restantes: number;
  trial_used: boolean;
  trial_available: boolean;
  aviso_24h: boolean;
  setup_required: boolean;
  plano_label: string | null;
  data_inicio: string | null;
  order_id: string | null;
};

const NO_PLAN: PlanState = {
  premium: false,
  plano: null,
  estado: null,
  data_fim: null,
  dias_restantes: 0,
  trial_used: false,
  trial_available: true,
  aviso_24h: false,
  setup_required: false,
  plano_label: null,
  data_inicio: null,
  order_id: null,
};

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function isSetupError(error: { message?: string } | null | undefined) {
  const m = (error?.message ?? "").toLowerCase();
  return m.includes("subscriptions") || m.includes("schema cache");
}

function safeName(name: string) {
  const cleaned = name.replace(/[^\w.-]+/g, "_").replace(/_{2,}/g, "_");
  return cleaned.slice(-80) || "comprovativo";
}

/** Verdadeiro quando existe um plano activo (trial, 7d ou 30d). */
export async function hasActivePlan(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id, estado, data_fim")
    .eq("user_id", userId)
    .eq("estado", "ativo");
  if (error) return false;
  return ((data ?? []) as any[]).some((s) => new Date(s.data_fim).getTime() > Date.now());
}

function labelFor(plano: string | null) {
  if (!plano) return null;
  if (plano === "trial") return "Teste grátis (1 dia)";
  return PLAN_PRICES[plano as PlanKey]?.label ?? null;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Acesso restrito a administradores");
}

/** Avisa o vendedor 24h antes da expiração (uma única vez por subscrição). */
async function warnExpiryIfNeeded(
  supabaseAdmin: any,
  userId: string,
  sub: { id: string; plano: string; data_fim: string; avisado_24h: boolean },
) {
  const fim = new Date(sub.data_fim).getTime();
  const resta = fim - Date.now();
  if (resta <= 0 || resta > DAY_MS || sub.avisado_24h) return false;
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type: "plan",
    title: "O seu plano Premium expira em breve",
    body:
      `O plano ${labelFor(sub.plano)} termina em ` +
      `${new Date(sub.data_fim).toLocaleString("pt-PT")}. ` +
      "Renove para manter o Quiz Funnel activo.",
    link: "/produtor/quiz",
    metadata: { plano: sub.plano, data_fim: sub.data_fim },
  });
  if (error) return false;
  await supabaseAdmin
    .from("subscriptions")
    .update({ avisado_24h: true, updated_at: new Date().toISOString() })
    .eq("id", sub.id);
  return true;
}

function buildState(rows: any[], avisado: boolean): PlanState {
  const now = Date.now();
  const active =
    rows.find((r) => r.estado === "ativo" && new Date(r.data_fim).getTime() > now) ?? null;
  const trialUsed = rows.some((r) => r.plano === "trial");
  if (!active) {
    return {
      ...NO_PLAN,
      trial_used: trialUsed,
      trial_available: !trialUsed,
      setup_required: rows.length === 0 ? NO_PLAN.setup_required : NO_PLAN.setup_required,
    };
  }
  const dias = Math.max(0, Math.ceil((new Date(active.data_fim).getTime() - now) / DAY_MS));
  return {
    premium: true,
    plano: active.plano,
    estado: active.estado,
    data_fim: active.data_fim,
    data_inicio: active.data_inicio,
    dias_restantes: dias,
    trial_used: trialUsed,
    trial_available: !trialUsed,
    aviso_24h: avisado || active.avisado_24h,
    setup_required: false,
    plano_label: labelFor(active.plano),
    order_id: active.order_id ?? null,
  };
}

/** Estado Premium do utilizador autenticado (fonte de verdade do backend). */
export const getMyPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // expiração avaliada no servidor, nunca só no frontend
    try {
      await (context.supabase as any).rpc("expire_stale_subscriptions", {
        _user_id: context.userId,
      });
    } catch {
      // migração ainda não aplicada — tratado pelo erro da leitura abaixo
    }

    const { data: rows, error } = await context.supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", context.userId)
      .order("data_inicio", { ascending: false });

    if (error) {
      if (isSetupError(error)) return { ...NO_PLAN, setup_required: true };
      throw new Error(error.message);
    }

    const list = (rows ?? []) as any[];
    let avisado = false;
    const active = list.find(
      (r) => r.estado === "ativo" && new Date(r.data_fim).getTime() > Date.now(),
    );
    if (active) {
      try {
        const supabaseAdmin = await adminClient();
        avisado = await warnExpiryIfNeeded(supabaseAdmin, context.userId, active);
      } catch {
        // aviso é best-effort
      }
    }
    return buildState(list, avisado);
  });

/** Activa o teste grátis de 1 dia — uma única vez por conta. */
export const startFreeTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await adminClient();
    const { data: rows, error } = await supabaseAdmin
      .from("subscriptions")
      .select("id, plano, estado, data_fim")
      .eq("user_id", context.userId);
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }

    const list = (rows ?? []) as any[];
    if (list.some((r) => r.plano === "trial"))
      throw new Error("O teste grátis de 1 dia já foi utilizado nesta conta.");
    if (list.some((r) => r.estado === "ativo" && new Date(r.data_fim).getTime() > Date.now()))
      throw new Error("Já tem um plano ativo. Aguarde a expiração para mudar de plano.");

    const now = new Date();
    const { error: insError } = await supabaseAdmin.from("subscriptions").insert({
      user_id: context.userId,
      plano: "trial",
      data_inicio: now.toISOString(),
      data_fim: new Date(now.getTime() + DAY_MS).toISOString(),
      estado: "ativo",
    });
    if (insError) {
      if (insError.code === "23505")
        throw new Error("O teste grátis de 1 dia já foi utilizado nesta conta.");
      if (isSetupError(insError)) throw new Error(SETUP_MESSAGE);
      throw new Error(insError.message);
    }
    return buildState(
      [
        {
          plano: "trial",
          estado: "ativo",
          data_inicio: now,
          data_fim: new Date(now.getTime() + DAY_MS),
          avisado_24h: false,
        },
      ],
      false,
    );
  });

/**
 * Cria (ou reutiliza) a ordem de compra de um plano e devolve os dados da
 * Referência PayPay para pagamento.
 */
export const createPlanOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ plano: z.enum(["7d", "30d"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();

    const { data: subs, error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .select("id, estado, data_fim")
      .eq("user_id", context.userId);
    if (subErr) {
      if (isSetupError(subErr)) throw new Error(SETUP_MESSAGE);
      throw new Error(subErr.message);
    }
    if (
      ((subs ?? []) as any[]).some(
        (s) => s.estado === "ativo" && new Date(s.data_fim).getTime() > Date.now(),
      )
    )
      throw new Error("Já tem um plano ativo.");

    const { data: existing, error: exError } = await supabaseAdmin
      .from("subscription_orders")
      .select("*")
      .eq("user_id", context.userId)
      .eq("plano", data.plano)
      .eq("status", "pendente")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (exError) {
      if (isSetupError(exError)) throw new Error(SETUP_MESSAGE);
      throw new Error(exError.message);
    }

    const plan = PLAN_PRICES[data.plano];
    let order = existing as any;
    if (!order) {
      const { data: created, error: insError } = await supabaseAdmin
        .from("subscription_orders")
        .insert({
          user_id: context.userId,
          plano: data.plano,
          amount_cents: plan.price_cents,
          currency: "AOA",
          payment_method: "referencia",
          provider: PAYPAY_REFERENCE.provider,
          payment_ref: `${PAYPAY_REFERENCE.entity}/${PAYPAY_REFERENCE.reference}`,
        })
        .select("*")
        .single();
      if (insError) {
        if (isSetupError(insError)) throw new Error(SETUP_MESSAGE);
        throw new Error(insError.message);
      }
      order = created as any;
    }

    return {
      token: order.access_token as string,
      plano: data.plano,
      plano_label: plan.label,
      amount_cents: plan.price_cents,
      amount_label: plan.price_label,
      receipt_status: (order.receipt_status as string) ?? "sem_comprovativo",
      status: order.status as string,
      reference: PAYPAY_REFERENCE,
    };
  });

/** Estado do pedido de plano (só o próprio dono consegue ler). */
export const getPlanOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ token: z.string().min(10).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const { data: order, error } = await supabaseAdmin
      .from("subscription_orders")
      .select(
        "id, plano, status, amount_cents, receipt_status, receipt_kind, receipt_note, receipt_submitted_at, created_at, user_id",
      )
      .eq("access_token", data.token)
      .maybeSingle();
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }
    if (!order || order.user_id !== context.userId) return null;
    return {
      plano: order.plano as string,
      plano_label: labelFor(order.plano),
      status: order.status as string,
      amount_cents: order.amount_cents as number,
      receipt_status: (order.receipt_status as string) ?? "sem_comprovativo",
      receipt_kind: (order.receipt_kind as string) ?? null,
      receipt_note: (order.receipt_note as string) ?? null,
      receipt_submitted_at: (order.receipt_submitted_at as string) ?? null,
      created_at: order.created_at as string,
    };
  });

async function planOrderByToken(token: string, userId: string) {
  const supabaseAdmin = await adminClient();
  const { data, error } = await supabaseAdmin
    .from("subscription_orders")
    .select("id, user_id, status, receipt_status, plano")
    .eq("access_token", token)
    .maybeSingle();
  if (error) {
    if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
    throw new Error(error.message);
  }
  if (!data || data.user_id !== userId) throw new Error("Pedido não encontrado.");
  return data as any;
}

/** URL assinada de upload do comprovativo do plano. */
export const createPlanReceiptUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        token: z.string().min(10).max(120),
        file_name: z.string().min(1).max(160),
        content_type: z.string().min(1).max(120),
        size: z.number().int().positive(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const kind = ALLOWED_TYPES[data.content_type];
    if (!kind)
      throw new Error("Formato não suportado. Envie uma imagem (PNG, JPG ou WEBP) ou PDF.");
    if (data.size > MAX_BYTES) throw new Error("O ficheiro deve ter menos de 10 MB.");

    const order = await planOrderByToken(data.token, context.userId);
    if (order.status !== "pendente") throw new Error("Este pedido já foi pago ou cancelado.");
    if (order.receipt_status === "enviado")
      throw new Error("Já enviou um comprovativo. Aguarde a verificação.");

    const path = `plan-${order.id}/${Date.now()}-${safeName(data.file_name)}`;
    const supabaseAdmin = await adminClient();
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed?.token)
      throw new Error(error?.message ?? "Não foi possível preparar o envio.");
    return { path: signed.path, token: signed.token, kind };
  });

/** Confirma o ficheiro enviado e regista o comprovativo do plano. */
export const submitPlanReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ token: z.string().min(10).max(120), path: z.string().min(3).max(300) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const order = await planOrderByToken(data.token, context.userId);
    if (order.status !== "pendente") throw new Error("Este pedido já foi pago ou cancelado.");
    if (order.receipt_status === "enviado")
      throw new Error("Já enviou um comprovativo. Aguarde a verificação.");
    if (!data.path.startsWith(`plan-${order.id}/`)) throw new Error("Ficheiro inválido.");

    const supabaseAdmin = await adminClient();
    const fileName = data.path.slice(`plan-${order.id}/`.length);
    const { data: objects, error: listError } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(`plan-${order.id}`, { search: fileName, limit: 20 });
    if (listError) throw new Error(listError.message);
    const object = (objects ?? []).find((o) => o.name === fileName);
    if (!object) throw new Error("O ficheiro não chegou a ser carregado. Tente novamente.");

    const meta = (object.metadata ?? {}) as { mimetype?: string; size?: number };
    const realKind = ALLOWED_TYPES[meta.mimetype ?? ""];
    const size = typeof meta.size === "number" ? meta.size : 0;
    if (!realKind || size <= 0 || size > MAX_BYTES) {
      await supabaseAdmin.storage.from(BUCKET).remove([data.path]);
      throw new Error("O ficheiro enviado não é uma imagem nem um PDF válido até 10 MB.");
    }

    const { data: updated, error } = await supabaseAdmin
      .from("subscription_orders")
      .update({
        receipt_path: data.path,
        receipt_kind: realKind,
        receipt_status: "enviado",
        receipt_submitted_at: new Date().toISOString(),
        receipt_note: null,
      })
      .eq("id", order.id)
      .eq("status", "pendente")
      .neq("receipt_status", "enviado")
      .select("id");
    if (error) throw new Error(error.message);
    if (!updated?.length) throw new Error("Este pedido já não aceita comprovativos.");
    return { ok: true as const };
  });

/** Comprovativos de planos por verificar (apenas admin). */
export const listPlanOrdersForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const supabaseAdmin = await adminClient();
    const { data, error } = await supabaseAdmin
      .from("subscription_orders")
      .select(
        "id, created_at, amount_cents, currency, status, plano, payment_ref, receipt_path, receipt_kind, receipt_status, receipt_submitted_at, receipt_note, receipt_reviewed_at, paid_at, user_id",
      )
      .not("receipt_path", "is", null)
      .order("receipt_submitted_at", { ascending: false })
      .limit(30);
    if (error) {
      if (isSetupError(error)) return { items: [], setup_required: true };
      throw new Error(error.message);
    }
    return { items: data ?? [], setup_required: false };
  });

/** URL assinada (10 min) do comprovativo de um plano (apenas admin). */
export const getPlanOrderReceiptUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ order_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = await adminClient();
    const { data: order, error } = await supabaseAdmin
      .from("subscription_orders")
      .select("receipt_path, receipt_kind")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order?.receipt_path) throw new Error("Este pedido ainda não tem comprovativo.");
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(order.receipt_path, 600);
    if (signError || !signed?.signedUrl) throw new Error(SETUP_MESSAGE);
    return { url: signed.signedUrl, kind: (order.receipt_kind as string) ?? "imagem" };
  });

/**
 * Aprova ou recusa o comprovativo de um plano (apenas admin).
 * Na aprovação cria a subscrição, somando ao tempo que já estiver ativo.
 */
export const reviewPlanOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        order_id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
        note: z.string().trim().max(300).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const supabaseAdmin = await adminClient();

    const { data: order, error } = await supabaseAdmin
      .from("subscription_orders")
      .select("id, user_id, plano, status, receipt_path, receipt_status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Pedido não encontrado.");
    if (order.status !== "pendente") throw new Error("Este pedido já não está pendente.");
    if (!order.receipt_path || order.receipt_status !== "enviado")
      throw new Error("Este pedido não tem comprovativo pendente de verificação.");

    const now = new Date().toISOString();
    const reviewed = {
      receipt_reviewed_at: now,
      receipt_reviewed_by: context.userId,
      receipt_note: data.note?.trim() || null,
    };

    if (data.action === "reject") {
      const { data: updated, error: upError } = await supabaseAdmin
        .from("subscription_orders")
        .update({ ...reviewed, receipt_status: "rejeitado" })
        .eq("id", order.id)
        .eq("receipt_status", "enviado")
        .select("id");
      if (upError) throw new Error(upError.message);
      if (!updated?.length) throw new Error("Este pedido já foi processado.");
      return { ok: true as const, approved: false };
    }

    const plan = PLAN_PRICES[order.plano as PlanKey];
    if (!plan) throw new Error("Plano inválido.");

    // Tempo restante de um plano ativo é somado ao novo plano.
    const { data: active } = await supabaseAdmin
      .from("subscriptions")
      .select("id, data_fim")
      .eq("user_id", order.user_id)
      .eq("estado", "ativo")
      .order("data_fim", { ascending: false })
      .limit(1)
      .maybeSingle();
    const base =
      active && new Date(active.data_fim).getTime() > Date.now()
        ? new Date(active.data_fim)
        : new Date();
    const fim = new Date(base.getTime() + plan.days * DAY_MS);

    const { data: updated, error: upError } = await supabaseAdmin
      .from("subscription_orders")
      .update({ ...reviewed, receipt_status: "aprovado", status: "pago", paid_at: now })
      .eq("id", order.id)
      .eq("status", "pendente")
      .eq("receipt_status", "enviado")
      .select("id");
    if (upError) throw new Error(upError.message);
    if (!updated?.length) throw new Error("Este pedido já foi processado.");

    const { error: subError } = await supabaseAdmin.from("subscriptions").insert({
      user_id: order.user_id,
      plano: order.plano,
      data_inicio: base.toISOString(),
      data_fim: fim.toISOString(),
      estado: "ativo",
      order_id: order.id,
    });
    if (subError) {
      if (subError.code === "23505")
        throw new Error("O teste grátis já foi utilizado nesta conta.");
      throw new Error(subError.message);
    }

    try {
      const { logAdminAction } = await import("./admin.functions");
      await logAdminAction(
        context.supabase,
        context.userId,
        "plan_order_approved",
        "subscription_order",
        order.id,
        { plano: order.plano, note: data.note ?? null },
      );
    } catch {
      // auditoria best-effort
    }

    return { ok: true as const, approved: true };
  });
