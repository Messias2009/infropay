import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const MIN_WITHDRAWAL_CENTS = 500_000; // 5.000 Kz
export const WITHDRAWAL_FEE = 0.08;

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Acesso restrito a administradores");
}

// ---------------- Bank accounts ----------------
export const listMyBankAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context.supabase as any)
      .from("bank_accounts")
      .select("*")
      .eq("producer_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

const bankSchema = z.object({
  id: z.string().uuid().optional(),
  holder_name: z.string().trim().min(2).max(120),
  bank_name: z.string().trim().min(2).max(80),
  iban: z.string().trim().min(10).max(40),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  is_default: z.boolean().optional(),
});

export const upsertBankAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => bankSchema.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, producer_id: context.userId };
    if (payload.is_default) {
      await (context.supabase as any)
        .from("bank_accounts")
        .update({ is_default: false })
        .eq("producer_id", context.userId);
    }
    let res;
    if (data.id) {
      res = await (context.supabase as any)
        .from("bank_accounts")
        .update(payload)
        .eq("id", data.id)
        .eq("producer_id", context.userId)
        .select()
        .maybeSingle();
    } else {
      res = await (context.supabase as any)
        .from("bank_accounts")
        .insert(payload)
        .select()
        .maybeSingle();
    }
    if (res.error) throw res.error;
    return res.data;
  });

export const deleteBankAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await (context.supabase as any)
      .from("bank_accounts")
      .delete()
      .eq("id", data.id)
      .eq("producer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ---------------- Withdrawals ----------------
export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z
      .object({
        gross_cents: z.number().int().min(MIN_WITHDRAWAL_CENTS),
        bank_account_id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error, data: row } = await (context.supabase as any)
      .from("withdrawals")
      .insert({
        producer_id: context.userId,
        bank_account_id: data.bank_account_id,
        gross_cents: data.gross_cents,
        fee_cents: 0,
        net_cents: 0,
      })
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message ?? "Falha ao pedir saque");
    return row;
  });

export const listMyWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("withdrawals")
      .select("*, bank_account:bank_accounts(holder_name, bank_name, iban)")
      .eq("producer_id", context.userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

// ---------------- Admin ----------------
export const listAllWithdrawals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    let q = (context.supabase as any)
      .from("withdrawals")
      .select(
        "*, bank_account:bank_accounts(holder_name, bank_name, iban, phone), producer:profiles!withdrawals_producer_id_fkey(full_name, username, avatar_url)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data?.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const updateWithdrawalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["em_analise", "aprovado", "pago", "recusado"]),
        rejection_reason: z.string().trim().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: any = { status: data.status };
    if (data.status === "recusado")
      patch.rejection_reason = data.rejection_reason ?? "Sem motivo indicado";
    const { error } = await (context.supabase as any)
      .from("withdrawals")
      .update(patch)
      .eq("id", data.id);
    if (error) throw error;
    const { logAdminAction } = await import("./admin.functions");
    await logAdminAction(
      context.supabase,
      context.userId,
      `withdrawal_${data.status}`,
      "withdrawal",
      data.id,
      {
        status: data.status,
        reason: data.rejection_reason ?? null,
      },
    );
    return { ok: true };
  });
