import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120).optional().nullable(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,32}$/)
    .optional()
    .nullable(),
  bio: z.string().trim().max(400).optional().nullable(),
  avatar_url: z.string().url().max(600).optional().nullable(),
  cover_url: z.string().url().max(600).optional().nullable(),
  social_instagram: z.string().trim().max(80).optional().nullable(),
  social_website: z.string().trim().max(160).optional().nullable(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await (context.supabase as any)
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", context.userId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return row;
  });

export const getMyAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: sales } = await (context.supabase as any)
      .from("sales")
      .select("gross_cents, status")
      .eq("producer_id", context.userId)
      .eq("status", "pago");
    const rows = (sales ?? []) as any[];
    const revenue = rows.reduce((a, r) => a + (r.gross_cents ?? 0), 0);
    const count = rows.length;
    return { revenue_cents: revenue, sales_count: count };
  });
