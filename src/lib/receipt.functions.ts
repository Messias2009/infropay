import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Fluxo de comprovativo por referência (PayPay / EMIS).
 *
 * 1. O comprador paga a Entidade/Referência no ATM, Multicaixa Express ou
 *    Internet Banking.
 * 2. `createReceiptUpload` devolve uma URL assinada de upload — só o servidor
 *    (service role) consegue criar o objecto, o bucket é privado e não existe
 *    política de INSERT para anon/authenticated.
 * 3. `submitReceipt` valida o MIME/tamanho reais do objecto guardado e marca a
 *    venda como `receipt_status = 'enviado'`.
 * 4. Admin ou produtor do produto chamam `listReceiptsForReview`,
 *    `getReceiptUrl` e `reviewReceipt`. A aprovação é feita com a service role
 *    depois de a autorização ter sido verificada com o token do utilizador
 *    (nunca o contrário).
 *
 * A transição pendente → pago continua a ser feita pelo trigger existente
 * `sales_update_wallet`, que credita a carteira exactamente uma vez.
 */

const BUCKET = "payment-receipts";
const MAX_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 600;

const ALLOWED_TYPES: Record<string, "imagem" | "pdf"> = {
  "image/png": "imagem",
  "image/jpeg": "imagem",
  "image/webp": "imagem",
  "application/pdf": "pdf",
};

const SETUP_MESSAGE =
  "A configuração de comprovativos ainda não foi aplicada. Execute a migração " +
  "supabase/migrations/20261026000001_payment_receipts.sql no SQL Editor do Supabase.";

const SALE_COLUMNS =
  "id, created_at, gross_cents, currency, status, payment_ref, buyer_name, buyer_email, " +
  "buyer_phone, receipt_path, receipt_kind, receipt_status, receipt_submitted_at, " +
  "receipt_note, receipt_reviewed_at, producer_id, product:products(title, slug, cover_url)";

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function isSetupError(error: { message?: string } | null | undefined) {
  const m = (error?.message ?? "").toLowerCase();
  return m.includes("receipt_path") || m.includes("receipt_status") || m.includes("schema cache");
}

function safeName(name: string) {
  const cleaned = name.replace(/[^\w.-]+/g, "_").replace(/_{2,}/g, "_");
  return cleaned.slice(-80) || "comprovativo";
}

async function saleByToken(token: string) {
  const supabaseAdmin = await adminClient();
  const { data, error } = await supabaseAdmin
    .from("sales")
    .select(
      "id, status, receipt_path, receipt_status, producer_id, product_id, buyer_user_id, buyer_email, gross_cents, currency",
    )
    .eq("access_token", token)
    .maybeSingle();
  if (error) {
    if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
    throw new Error(error.message);
  }
  return data;
}

/** Cria a URL assinada de upload do comprovativo (imagem ou PDF). */
export const createReceiptUpload = createServerFn({ method: "POST" })
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
  .handler(async ({ data }) => {
    const kind = ALLOWED_TYPES[data.content_type];
    if (!kind)
      throw new Error("Formato não suportado. Envie uma imagem (PNG, JPG ou WEBP) ou PDF.");
    if (data.size > MAX_BYTES) throw new Error("O ficheiro deve ter menos de 10 MB.");

    const sale = await saleByToken(data.token);
    if (!sale) throw new Error("Pedido não encontrado.");
    if (sale.status !== "pendente") throw new Error("Este pedido já foi pago ou cancelado.");
    if (sale.receipt_status === "enviado")
      throw new Error("Já enviou um comprovativo. Aguarde a verificação antes de reenviar.");

    const path = `${sale.id}/${Date.now()}-${safeName(data.file_name)}`;
    const supabaseAdmin = await adminClient();
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !signed?.token) {
      const msg = (error?.message ?? "").toLowerCase();
      if (msg.includes("bucket") || msg.includes("not found") || msg.includes("schema"))
        throw new Error(SETUP_MESSAGE);
      throw new Error(error?.message ?? "Não foi possível preparar o envio do comprovativo.");
    }

    return { path: signed.path, token: signed.token, kind };
  });

/** Confirma o ficheiro enviado e regista o comprovativo na venda. */
export const submitReceipt = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        token: z.string().min(10).max(120),
        path: z.string().min(3).max(300),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sale = await saleByToken(data.token);
    if (!sale) throw new Error("Pedido não encontrado.");
    if (sale.status !== "pendente") throw new Error("Este pedido já foi pago ou cancelado.");
    if (sale.receipt_status === "enviado")
      throw new Error("Já enviou um comprovativo. Aguarde a verificação.");
    if (!data.path.startsWith(`${sale.id}/`)) throw new Error("Ficheiro inválido.");

    const supabaseAdmin = await adminClient();
    const fileName = data.path.slice(sale.id.length + 1);
    const { data: objects, error: listError } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(sale.id, { search: fileName, limit: 20 });
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
      .from("sales")
      .update({
        receipt_path: data.path,
        receipt_kind: realKind,
        receipt_status: "enviado",
        receipt_submitted_at: new Date().toISOString(),
        receipt_note: null,
      })
      .eq("id", sale.id)
      .eq("status", "pendente")
      .neq("receipt_status", "enviado")
      .select("id");

    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }
    if (!updated?.length) throw new Error("Este pedido já não aceita comprovativos.");

    return { ok: true as const };
  });

async function isReviewer(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  return { admin: !!data };
}

/** Comprovativos pendentes de verificação (admin: todos; produtor: os seus). */
export const listReceiptsForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { admin } = await isReviewer(context);
    const supabaseAdmin = await adminClient();

    let query = supabaseAdmin
      .from("sales")
      .select(SALE_COLUMNS)
      .not("receipt_path", "is", null)
      .order("receipt_submitted_at", { ascending: false })
      .limit(40);
    if (!admin) query = query.eq("producer_id", context.userId);

    const { data, error } = await query;
    if (error) {
      return { items: [], admin, setup_required: isSetupError(error) };
    }
    return { items: data ?? [], admin, setup_required: false };
  });

/** URL assinada (10 min) para o revisor ver o comprovativo. */
export const getReceiptUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ sale_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const { data: sale, error } = await supabaseAdmin
      .from("sales")
      .select("id, producer_id, receipt_path, receipt_status")
      .eq("id", data.sale_id)
      .maybeSingle();
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }
    if (!sale) throw new Error("Pedido não encontrado.");

    const { admin } = await isReviewer(context);
    if (!admin && sale.producer_id !== context.userId)
      throw new Error("Acesso restrito a este pedido.");
    if (!sale.receipt_path) throw new Error("Este pedido ainda não tem comprovativo.");

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(sale.receipt_path, SIGNED_URL_TTL_SECONDS);
    if (signError || !signed?.signedUrl) throw new Error(SETUP_MESSAGE);
    return { url: signed.signedUrl, kind: sale.receipt_status };
  });

/**
 * Aprova (→ pago, libera acesso e credita carteira) ou rejeita o comprovativo.
 * Só admin ou o produtor do produto; o produtor não pode aprovar uma compra
 * em que ele próprio é o comprador.
 */
export const reviewReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        sale_id: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
        note: z.string().trim().max(300).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await adminClient();
    const { data: sale, error } = await supabaseAdmin
      .from("sales")
      .select("id, producer_id, status, receipt_path, receipt_status, buyer_user_id, buyer_email")
      .eq("id", data.sale_id)
      .maybeSingle();
    if (error) {
      if (isSetupError(error)) throw new Error(SETUP_MESSAGE);
      throw new Error(error.message);
    }
    if (!sale) throw new Error("Pedido não encontrado.");

    const { admin } = await isReviewer(context);
    const isOwner = sale.producer_id === context.userId;
    if (!admin && !isOwner) throw new Error("Acesso restrito a este pedido.");
    if (sale.status !== "pendente") throw new Error("Este pedido já não está pendente.");
    if (!sale.receipt_path || sale.receipt_status !== "enviado")
      throw new Error("Este pedido não tem comprovativo pendente de verificação.");

    if (!admin) {
      const email = ((context.claims as { email?: string })?.email ?? "").toLowerCase();
      if (
        (sale.buyer_user_id && sale.buyer_user_id === context.userId) ||
        (email && sale.buyer_email?.toLowerCase() === email)
      ) {
        throw new Error("Não pode aprovar uma compra em que é o comprador.");
      }
    }

    const now = new Date().toISOString();
    const reviewedBy = {
      receipt_reviewed_at: now,
      receipt_reviewed_by: context.userId,
      receipt_note: data.note?.trim() || null,
    };

    if (data.action === "approve") {
      const { data: updated, error: upError } = await supabaseAdmin
        .from("sales")
        .update({ ...reviewedBy, receipt_status: "aprovado", status: "pago" })
        .eq("id", sale.id)
        .eq("status", "pendente")
        .eq("receipt_status", "enviado")
        .select("id");
      if (upError) {
        if (isSetupError(upError)) throw new Error(SETUP_MESSAGE);
        throw new Error(upError.message);
      }
      if (!updated?.length) throw new Error("Este pedido já foi processado.");
    } else {
      const { data: updated, error: upError } = await supabaseAdmin
        .from("sales")
        .update({ ...reviewedBy, receipt_status: "rejeitado" })
        .eq("id", sale.id)
        .eq("receipt_status", "enviado")
        .select("id");
      if (upError) {
        if (isSetupError(upError)) throw new Error(SETUP_MESSAGE);
        throw new Error(upError.message);
      }
      if (!updated?.length) throw new Error("Este pedido já foi processado.");
    }

    if (admin) {
      try {
        const { logAdminAction } = await import("./admin.functions");
        await logAdminAction(
          context.supabase,
          context.userId,
          data.action === "approve" ? "sale_approved" : "sale_receipt_rejected",
          "sale",
          sale.id,
          { note: data.note ?? null },
        );
      } catch {
        // auditoria é best-effort: a decisão já está registada na própria venda
      }
    }

    return { ok: true as const, approved: data.action === "approve" };
  });
