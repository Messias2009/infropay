import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X, ExternalLink, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listPendingProducts,
  approveProduct,
  rejectProduct,
  getAdminStats,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/adm/")({
  component: Aprovacoes,
});

function fmt(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function Aprovacoes() {
  const listFn = useServerFn(listPendingProducts);
  const statsFn = useServerFn(getAdminStats);
  const approveFn = useServerFn(approveProduct);
  const rejectFn = useServerFn(rejectProduct);

  const { data: pending, refetch } = useQuery({
    queryKey: ["admin", "pending"],
    queryFn: () => listFn(),
  });
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => statsFn(),
  });

  async function approve(id: string) {
    try {
      await approveFn({ data: { id } });
      toast.success("Produto aprovado e publicado");
      refetch();
      refetchStats();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <div className="text-xs uppercase tracking-widest text-gold font-semibold">Administração</div>
      <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Fila de aprovação</h1>
      <p className="text-muted-foreground mt-2">
        Reveja os produtos enviados pelos produtores antes de irem para a loja.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard label="Aguardando revisão" value={stats?.pending ?? 0} highlight />
        <StatCard label="Publicados" value={stats?.published ?? 0} />
        <StatCard label="Rascunhos" value={stats?.drafts ?? 0} />
        <StatCard label="Total no sistema" value={stats?.total ?? 0} />
      </div>

      <div className="mt-8">
        {!pending || pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
            <Inbox className="h-12 w-12 text-gold mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold">Fila vazia</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhum produto aguarda aprovação neste momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pending.map((p: any) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col md:flex-row"
              >
                <div className="md:w-56 aspect-video md:aspect-square bg-gradient-to-br from-primary/20 to-gold/10 shrink-0">
                  {p.cover_url && (
                    <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-lg">{p.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary-glow uppercase tracking-wider font-semibold">
                        {p.product_type}
                      </span>
                      {p.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                          {p.category.name}
                        </span>
                      )}
                    </div>
                    {p.short_description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {p.short_description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Por <b className="text-foreground">{p.producer?.full_name ?? "Produtor"}</b>
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-gradient-gold">
                      {fmt(p.price_cents, p.currency)}
                    </span>
                    <span>·</span>
                    <span>{new Date(p.created_at).toLocaleDateString("pt-PT")}</span>
                  </div>
                  <div className="flex gap-2 mt-auto pt-2 flex-wrap">
                    <a href={`/produto/${p.slug}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Pré-visualizar
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      onClick={() => approve(p.id)}
                      className="bg-success text-primary-foreground hover:bg-success/90"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Aprovar e publicar
                    </Button>
                    <RejectDialog
                      onReject={async (reason) => {
                        try {
                          await rejectFn({ data: { id: p.id, reason } });
                          toast.success("Produto rejeitado");
                          refetch();
                          refetchStats();
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${highlight ? "border-gold/40 bg-gold/5" : "border-border bg-card"}`}
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 text-3xl font-display font-bold ${highlight ? "text-gold" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function RejectDialog({ onReject }: { onReject: (reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <X className="h-3.5 w-3.5 mr-1" />
          Rejeitar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeitar produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Motivo (será visível ao produtor)</label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Ex: capa de baixa qualidade, descrição incompleta…"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={loading || reason.trim().length < 3}
            onClick={async () => {
              setLoading(true);
              await onReject(reason.trim());
              setLoading(false);
              setOpen(false);
              setReason("");
            }}
          >
            Confirmar rejeição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
