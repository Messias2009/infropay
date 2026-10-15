// Centralized, fail-safe environment resolver for Supabase.
// Handles client (Vite import.meta.env), server (Node/Nitro process.env),
// and Vercel naming variations (VITE_*, SUPABASE_*, NEXT_PUBLIC_*).

const DEFAULT_SUPABASE_URL = "https://dbiyvmjtxgholatsonbo.supabase.co";
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_NFT-Qg1DBlJ3LBlo9FDM4A_SvxcA8UU";

function cleanValue(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getSupabaseUrl(): string {
  // 1. Vite client-side bundle injection
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      const fromMeta =
        cleanValue(import.meta.env.VITE_SUPABASE_URL) ||
        cleanValue(import.meta.env.SUPABASE_URL) ||
        cleanValue(import.meta.env.NEXT_PUBLIC_SUPABASE_URL);
      if (fromMeta) return fromMeta;
    }
  } catch {
    // import.meta may be unavailable in some runtimes
  }

  // 2. Server-side environment variables (Node, Nitro, Vercel Serverless)
  try {
    if (typeof process !== "undefined" && process.env) {
      const fromProcess =
        cleanValue(process.env.VITE_SUPABASE_URL) ||
        cleanValue(process.env.SUPABASE_URL) ||
        cleanValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
      if (fromProcess) return fromProcess;
    }
  } catch {
    // process may be unavailable in browser runtimes
  }

  // 3. Guaranteed project fallback
  return DEFAULT_SUPABASE_URL;
}

export function getSupabasePublishableKey(): string {
  // 1. Vite client-side bundle injection
  try {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      const fromMeta =
        cleanValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
        cleanValue(import.meta.env.VITE_SUPABASE_ANON_KEY) ||
        cleanValue(import.meta.env.SUPABASE_PUBLISHABLE_KEY) ||
        cleanValue(import.meta.env.SUPABASE_ANON_KEY) ||
        cleanValue(import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      if (fromMeta) return fromMeta;
    }
  } catch {
    // import.meta may be unavailable in some runtimes
  }

  // 2. Server-side environment variables (Node, Nitro, Vercel Serverless)
  try {
    if (typeof process !== "undefined" && process.env) {
      const fromProcess =
        cleanValue(process.env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
        cleanValue(process.env.VITE_SUPABASE_ANON_KEY) ||
        cleanValue(process.env.SUPABASE_PUBLISHABLE_KEY) ||
        cleanValue(process.env.SUPABASE_ANON_KEY) ||
        cleanValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      if (fromProcess) return fromProcess;
    }
  } catch {
    // process may be unavailable in browser runtimes
  }

  // 3. Guaranteed project fallback
  return DEFAULT_SUPABASE_PUBLISHABLE_KEY;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  try {
    if (typeof process !== "undefined" && process.env) {
      return (
        cleanValue(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
        cleanValue(process.env.SERVICE_ROLE_KEY)
      );
    }
  } catch {
    // process may be unavailable in browser
  }
  return undefined;
}
