import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ScrollText, CheckCircle2, XCircle, Ban, ShieldCheck, Banknote } from "lucide-react";
import { listAdminLogs } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/adm/logs")({
  head: () => ({
    meta: [
      { title: "Logs de auditoria — Admin InfroPay" },
      {
        name: "description",
        content: "Histórico cronológico das ações administrativas da plataforma.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

const FILTERS = [
  { value: "", label: "Todas" },
  { value: "product_approved", label: "Produtos aprovados" },
  { value: "product_rejected", label: "Produtos rejeitados" },
  { value: "user_banned", label: "Bloqueios" },
  { value: "user_unbanned", label: "Desbloqueios" },
  { value: "withdrawal_aprovado", label: "Saques aprovados" },
  { value: "withdrawal_pago", label: "Saques pagos" },
  { value: "withdrawal_recusado", label: "Saques recusados" },
];

function meta(action: string) {
  if (action === "product_approved")
    return { Icon: CheckCircle2, color: "text-success", label: "Produto aprovado" };
  if (action === "product_rejected")
    return { Icon: XCircle, color: "text-destructive", label: "Produto rejeitado" };
  if (action === "user_banned")
    return { Icon: Ban, color: "text-destructive", label: "Conta bloqueada" };
  if (action === "user_unbanned")
    return { Icon: ShieldCheck, color: "text-success", label: "Conta desbloqueada" };
  if (action.startsWith("withdrawal_"))
    return {
      Icon: Banknote,
      color: "text-gold",
      label: `Saque · ${action.replace("withdrawal_", "")}`,
    };
  return { Icon: ScrollText, color: "text-muted-foreground", label: action };
}

function Page() {
  const listFn = useServerFn(listAdminLogs);
  const [action, setAction] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["adm", "logs", action],
    queryFn: () => listFn({ data: { action: action || undefined } }),
  });

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">
          Administração
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Logs de auditoria</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Registo automático de todas as decisões administrativas.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setAction(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${action === f.value ? "bg-gold/15 text-gold" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">A carregar...</div>
      ) : (
        <ol className="relative border-l border-border ml-3 space-y-4">
          {(data ?? []).map((l: any) => {
            const m = meta(l.action);
            return (
              <li key={l.id} className="ml-6">
                <span className="absolute -left-[13px] h-6 w-6 rounded-full bg-card border border-border grid place-items-center">
                  <m.Icon className={`h-3.5 w-3.5 ${m.color}`} />
                </span>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-sm">{m.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("pt-PT")}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    por {l.admin_name ?? "admin"} · {l.target_type}{" "}
                    <span className="font-mono">{String(l.target_id ?? "").slice(0, 8)}</span>
                  </div>
                  {l.details && Object.keys(l.details).length > 0 && (
                    <pre className="mt-2 text-[11px] text-muted-foreground bg-secondary/50 rounded-lg p-2 overflow-x-auto">
                      {JSON.stringify(l.details)}
                    </pre>
                  )}
                </div>
              </li>
            );
          })}
          {!(data ?? []).length && (
            <li className="ml-6 text-sm text-muted-foreground">Nenhum registo ainda.</li>
          )}
        </ol>
      )}
    </div>
  );
}
