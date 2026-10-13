import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type Level = {
  key: string;
  name: string;
  min_cents: number;
  color: string;
  gradient: string;
};

export const LEVELS: Level[] = [
  {
    key: "bronze",
    name: "Bronze",
    min_cents: 0,
    color: "#B87333",
    gradient: "linear-gradient(135deg,#8B4513,#B87333)",
  },
  {
    key: "prata",
    name: "Prata",
    min_cents: 100_000_00,
    color: "#C0C0C0",
    gradient: "linear-gradient(135deg,#7C7C7C,#E8E8E8)",
  },
  {
    key: "ouro",
    name: "Ouro",
    min_cents: 500_000_00,
    color: "#F9A825",
    gradient: "linear-gradient(135deg,#B8860B,#FFD700)",
  },
  {
    key: "platina",
    name: "Platina",
    min_cents: 1_000_000_00,
    color: "#E5E4E2",
    gradient: "linear-gradient(135deg,#8FA6B3,#E5E4E2)",
  },
  {
    key: "diamante",
    name: "Diamante",
    min_cents: 5_000_000_00,
    color: "#B9F2FF",
    gradient: "linear-gradient(135deg,#4FC3F7,#B9F2FF)",
  },
  {
    key: "mestre",
    name: "Mestre",
    min_cents: 10_000_000_00,
    color: "#9C27B0",
    gradient: "linear-gradient(135deg,#6A1B9A,#CE93D8)",
  },
  {
    key: "elite",
    name: "Elite",
    min_cents: 25_000_000_00,
    color: "#F44336",
    gradient: "linear-gradient(135deg,#B71C1C,#FF7043)",
  },
  {
    key: "lenda",
    name: "Lenda",
    min_cents: 50_000_000_00,
    color: "#00BCD4",
    gradient: "linear-gradient(135deg,#006064,#4DD0E1)",
  },
  {
    key: "imortal",
    name: "Imortal",
    min_cents: 100_000_000_00,
    color: "#FFEB3B",
    gradient: "linear-gradient(135deg,#F57F17,#FFF176)",
  },
  {
    key: "infinito",
    name: "Infinito",
    min_cents: 250_000_000_00,
    color: "#7C4DFF",
    gradient: "linear-gradient(135deg,#311B92,#B388FF)",
  },
];

export function levelFor(total: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) if (total >= l.min_cents) current = l;
  return current;
}

export const listLegends = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = pub();
  const { data: sales } = await supabase
    .from("sales")
    .select("producer_id, gross_cents")
    .eq("status", "pago");

  const agg = new Map<string, { revenue: number; count: number }>();
  for (const s of sales ?? []) {
    const cur = agg.get(s.producer_id) ?? { revenue: 0, count: 0 };
    cur.revenue += s.gross_cents ?? 0;
    cur.count += 1;
    agg.set(s.producer_id, cur);
  }

  const ids = [...agg.keys()];
  if (ids.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url")
    .in("id", ids);

  const rows = (profiles ?? []).map((p) => {
    const stats = agg.get(p.id)!;
    const lvl = levelFor(stats.revenue);
    return {
      id: p.id,
      name: p.full_name ?? p.username ?? "Produtor",
      avatar_url: p.avatar_url,
      revenue_cents: stats.revenue,
      sales_count: stats.count,
      level: lvl,
    };
  });
  rows.sort((a, b) => b.revenue_cents - a.revenue_cents);
  return rows.slice(0, 100);
});
