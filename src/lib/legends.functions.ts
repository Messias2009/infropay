import { createServerFn } from "@tanstack/react-start";
import img_0 from "@/assets/images/infropay_plaque_silver_100k_1792134414511.jpg";
import img_1 from "@/assets/images/infropay_plaque_gold_500k_1792134428623.jpg";
import img_2 from "@/assets/images/infropay_plaque_platinum_1m_1792134441626.jpg";
import img_3 from "@/assets/images/infropay_plaque_diamond_5m_1792134454131.jpg";
import { createServerPublicClient } from "@/lib/public-client.server";

export type Level = {
  key: string;
  name: string;
  min_cents: number;
  goal_label: string;
  color: string;
  gradient: string;
  image: string;
};

export const LEVELS: Level[] = [
  {
    key: "prata",
    name: "Placa de Prata",
    min_cents: 100_000_00,
    goal_label: "100.000 Kz",
    color: "#C0C0C0",
    gradient: "linear-gradient(135deg,#7C7C7C,#E8E8E8)",
    image: img_0,
  },
  {
    key: "ouro",
    name: "Placa de Ouro",
    min_cents: 500_000_00,
    goal_label: "500.000 Kz",
    color: "#F9A825",
    gradient: "linear-gradient(135deg,#B8860B,#FFD700)",
    image: img_1,
  },
  {
    key: "platina",
    name: "Placa de Platina",
    min_cents: 1_000_000_00,
    goal_label: "1.000.000 Kz",
    color: "#E5E4E2",
    gradient: "linear-gradient(135deg,#8FA6B3,#E5E4E2)",
    image: img_2,
  },
  {
    key: "diamante",
    name: "Placa de Diamante",
    min_cents: 5_000_000_00,
    goal_label: "5.000.000 Kz",
    color: "#4FC3F7",
    gradient: "linear-gradient(135deg,#00838F,#4DD0E1)",
    image: img_3,
  },
];

export function levelFor(total: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (total >= l.min_cents) current = l;
  }
  return current;
}

export const listLegends = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createServerPublicClient();
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("producer_id, gross_cents")
    .eq("status", "pago");

  if (salesError) {
    console.error("Error fetching sales for legends:", salesError);
    return [];
  }

  const agg = new Map<string, { revenue: number; count: number }>();
  for (const s of sales ?? []) {
    const cur = agg.get(s.producer_id) ?? { revenue: 0, count: 0 };
    cur.revenue += s.gross_cents ?? 0;
    cur.count += 1;
    agg.set(s.producer_id, cur);
  }

  const producerIds = Array.from(agg.keys());
  if (producerIds.length === 0) return [];

  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, bio")
    .in("id", producerIds);

  if (profError) {
    console.error("Error fetching profiles for legends:", profError);
    return [];
  }

  const list = (profiles ?? []).map((p) => {
    const a = agg.get(p.id) ?? { revenue: 0, count: 0 };
    const lvl = levelFor(a.revenue);
    return {
      id: p.id,
      full_name: p.full_name || p.username || "Produtor InfroPay",
      username: p.username,
      avatar_url: p.avatar_url,
      bio: p.bio,
      total_revenue_cents: a.revenue,
      sales_count: a.count,
      level: lvl,
    };
  });

  list.sort((a, b) => b.total_revenue_cents - a.total_revenue_cents);
  return list.slice(0, 100);
});
