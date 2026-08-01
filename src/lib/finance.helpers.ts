type SB = any;

export async function ensureWalletRow(supabase: SB, uid: string) {
  await supabase.from("wallets").upsert({ producer_id: uid }, { onConflict: "producer_id" });
}

export const sumBy = (arr: any[], k: string) => arr.reduce((a, r) => a + (r[k] ?? 0), 0);

export type Bucket = { label: string; gross: number; net: number; count: number };

function bucket(rows: any[], label: string): Bucket {
  return {
    label,
    gross: sumBy(rows, "gross_cents") / 100,
    net: sumBy(rows, "net_cents") / 100,
    count: rows.length,
  };
}

const between = (rows: any[], from: Date, to: Date) =>
  rows.filter((r) => {
    const t = new Date(r.created_at);
    return t >= from && t < to;
  });

/** Daily buckets for the last `days` days. */
export function dailySeries(paid: any[], days = 14): Bucket[] {
  const now = new Date();
  const out: Bucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    out.push(bucket(between(paid, d, next), d.toISOString().slice(5, 10)));
  }
  return out;
}

/** Weekly buckets for the last `weeks` weeks. */
export function weeklySeries(paid: any[], weeks = 8): Bucket[] {
  const now = new Date();
  const out: Bucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const to = new Date(now);
    to.setDate(now.getDate() - i * 7 + 1);
    to.setHours(0, 0, 0, 0);
    const from = new Date(to);
    from.setDate(to.getDate() - 7);
    out.push(bucket(between(paid, from, to), `${from.getDate()}/${from.getMonth() + 1}`));
  }
  return out;
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Monthly buckets for the last `months` months. */
export function monthlySeries(paid: any[], months = 12): Bucket[] {
  const now = new Date();
  const out: Bucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
    out.push(bucket(between(paid, from, to), MONTHS[from.getMonth()]));
  }
  return out;
}

/** Yearly buckets for the last `years` years. */
export function yearlySeries(paid: any[], years = 3): Bucket[] {
  const now = new Date();
  const out: Bucket[] = [];
  for (let i = years - 1; i >= 0; i--) {
    const y = now.getFullYear() - i;
    out.push(bucket(between(paid, new Date(y, 0, 1), new Date(y + 1, 0, 1)), String(y)));
  }
  return out;
}
