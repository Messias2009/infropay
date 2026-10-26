import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/integrations/supabase/env";

/** Publishable-key Supabase client for public (anon) reads inside server functions. */
export function createServerPublicClient() {
  const { url, key } = requireSupabaseEnv();
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
