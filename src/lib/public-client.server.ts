import { createClient } from "@supabase/supabase-js";

/** Publishable-key Supabase client for public (anon) reads inside server functions. */
export function createServerPublicClient() {
  return createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}
