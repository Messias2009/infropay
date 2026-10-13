import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccountStatus } from "@/lib/admin.functions";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Contas bloqueadas pelo admin são terminadas imediatamente.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyAccountStatus()
      .then((s) => {
        if (cancelled || !s.banned) return;
        void supabase.auth.signOut();
        if (typeof window !== "undefined") {
          window.alert(`A sua conta foi bloqueada. Motivo: ${s.reason ?? "não indicado"}`);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { session, user, loading };
}
