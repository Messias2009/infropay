import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Send, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { listAllWithdrawals, updateWithdrawalStatus } from "@/lib/withdrawals.functions";
import { kz } from "@/components/finance/FeeBanner";

export const Route = createFileRoute("/_authenticated/adm/saques")({
  head: () => ({ meta: [{ title: "Saques — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllWithdrawals);
  const updateFn = useServerFn(updateWithdrawalStatus);
  const [filter, setFilter] = useState<string>("em_analise");
  const { data } = useQuery({
    queryKey: ["adm", "withdrawals", filter],
    queryFn: () => listFn({ data: { status: filter } }),
  });
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  async function act(
    id: string,
    status: "aprovado" | "pago" | "recusado",
    rejection_reason?: string,
  ) {
    try {
      await updateFn({ data: { id, status, rejection_reason } });
      toast.success("Atualizado");
      qc.invalidateQueries({ queryKey: ["adm", "withdrawals"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">
          Administração
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Fila de saques</h1>
        <p className="text-muted-foreground mt-2">
          Aprovar, marcar como pago ou recusar pedidos dos produtores.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          ["em_analise", "Em análise"],
          ["aprovado", "Aprovados"],
          ["pago", "Pagos"],
          ["recusado", "Recusados"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${filter === v ? "bg-gold/15 border-gold/40 text-gold" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {!data?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-sm text-muted-foreground">
          Nada por aqui.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((w: any) => (
            <div
              key={w.id}
              className="rounded-2xl border border-border bg-card p-5 flex flex-wrap items-center gap-5"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center overflow-hidden">
                  {w.producer?.avatar_url ? (
                    <img
                      src={w.producer.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-5 w-5 text-primary-glow" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {w.producer?.full_name ?? w.producer?.username ?? "Produtor"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(w.created_at).toLocaleString("pt-AO")}
                  </div>
                </div>
              </div>
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">Destino</div>
                <div className="font-medium">{w.bank_account?.bank_name}</div>
                <div className="text-xs text-muted-foreground">{w.bank_account?.iban}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">A pagar</div>
                <div className="font-display font-bold text-xl">{kz(w.net_cents)}</div>
                <div className="text-[10px] text-muted-foreground">
                  bruto {kz(w.gross_cents)} · taxa {kz(w.fee_cents)}
                </div>
              </div>
              <div className="flex gap-2">
                {w.status === "em_analise" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => act(w.id, "aprovado")}>
                      <CheckCircle2 className="h-4 w-4 mr-1 text-primary-glow" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejecting(w);
                        setReason("");
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1 text-destructive" />
                      Recusar
                    </Button>
                  </>
                )}
                {w.status === "aprovado" && (
                  <Button
                    size="sm"
                    className="gradient-brand text-primary-foreground"
                    onClick={() => act(w.id, "pago")}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Marcar como pago
                  </Button>
                )}
                {w.status === "recusado" && w.rejection_reason && (
                  <div className="text-xs text-destructive max-w-[240px]">{w.rejection_reason}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar saque</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O valor volta ao saldo disponível do produtor.
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo da recusa..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (reason.trim().length < 3) return toast.error("Motivo obrigatório");
                await act(rejecting.id, "recusado", reason.trim());
                setRejecting(null);
              }}
            >
              Confirmar recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
