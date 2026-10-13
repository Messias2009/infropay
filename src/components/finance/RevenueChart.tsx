import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { kz } from "@/components/finance/FeeBanner";

type Bucket = { label: string; gross: number; net: number; count: number };

const RANGES = [
  { key: "daily", label: "Diário" },
  { key: "weekly", label: "Semanal" },
  { key: "monthly", label: "Mensal" },
  { key: "yearly", label: "Anual" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

export function RevenueChart({
  daily,
  weekly,
  monthly,
  yearly,
}: {
  daily?: Bucket[];
  weekly?: Bucket[];
  monthly?: Bucket[];
  yearly?: Bucket[];
}) {
  const [range, setRange] = useState<RangeKey>("daily");
  const map: Record<RangeKey, Bucket[]> = {
    daily: daily ?? [],
    weekly: weekly ?? [],
    monthly: monthly ?? [],
    yearly: yearly ?? [],
  };
  const data = map[range];
  const total = data.reduce((a, b) => a + b.gross, 0);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 md:px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-lg leading-tight">
            Evolução do faturamento
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Total no período:{" "}
            <span className="text-gold font-semibold">{kz(Math.round(total * 100))}</span>
          </p>
        </div>
        <div className="flex rounded-xl border border-border bg-muted/30 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                range === r.key
                  ? "gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px] p-3 md:p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              stroke="var(--color-border)"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              stroke="var(--color-border)"
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: any, n: any) => [
                kz(Math.round(Number(v) * 100)),
                n === "gross" ? "Bruto" : "Líquido",
              ]}
            />
            <Area
              type="monotone"
              dataKey="gross"
              stroke="var(--color-gold)"
              strokeWidth={2}
              fill="url(#revFill)"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fillOpacity={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
