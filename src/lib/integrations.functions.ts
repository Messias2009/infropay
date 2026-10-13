import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  meta_pixel_id: z.string().trim().max(60).optional().nullable(),
  meta_capi_token: z.string().trim().max(400).optional().nullable(),
  google_ads_id: z.string().trim().max(60).optional().nullable(),
  google_ads_label: z.string().trim().max(80).optional().nullable(),
  ga_measurement_id: z.string().trim().max(40).optional().nullable(),
  utmify_token: z.string().trim().max(200).optional().nullable(),
});

export const getMyIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as any)
      .from("user_integrations")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return (
      data ?? {
        user_id: context.userId,
        meta_pixel_id: null,
        meta_capi_token: null,
        google_ads_id: null,
        google_ads_label: null,
        ga_measurement_id: null,
        utmify_token: null,
      }
    );
  });

export const upsertMyIntegrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ context, data }) => {
    const payload = { user_id: context.userId, ...data, updated_at: new Date().toISOString() };
    const { data: row, error } = await (context.supabase as any)
      .from("user_integrations")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return row;
  });
