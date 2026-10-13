import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Trash2, Landmark, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { getMyWallet } from "@/lib/finance.functions";
import {
  deleteBankAccount,
  listMyBankAccounts,
  listMyWithdrawals,
  MIN_WITHDRAWAL_CENTS,
  requestWithdrawal,
  upsertBankAccount,
  WITHDRAWAL_FEE,
} from "@/lib/withdrawals.functions";
import { FeeBanner, kz } from "@/components/finance/FeeBanner";

export const Route = createFileRoute("/_authenticated/produtor/saques")({
  head: () => ({ meta: [{ title: "Saques — InfroPay" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const walletFn = useServerFn(getMyWallet);
  const banksFn = useServerFn(listMyBankAccounts);
  const wsFn = useServerFn(listMyWithdrawals);
  const upsertFn = useServerFn(upsertBankAccount);
  const deleteFn = useServerFn(deleteBankAccount);
  const requestFn = useServerFn(requestWithdrawal);

  const { data: wallet } = useQuery({
    queryKey: ["producer", "wallet"],
    queryFn: () => walletFn(),
  });
  const { data: banks } = useQuery({ queryKey: ["banks"], queryFn: () => banksFn() });
  const { data: withdrawals } = useQuery({ queryKey: ["withdrawals"], queryFn: () => wsFn() });

  const [bankOpen, setBankOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [amountKz, setAmountKz] = useState("");
  const [bankId, setBankId] = useState<string>("");

  async function saveBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await upsertFn({
        data: {
          id: editing?.id,
          holder_name: String(fd.get("holder_name")),
          bank_name: String(fd.get("bank_name")),
          iban: String(fd.get("iban")),
          phone: String(fd.get("phone") ?? ""),
          is_default: fd.get("is_default") === "on",
        },
      });
      toast.success("Conta bancária guardada");
      setBankOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["banks"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }
  async function removeBank(id: string) {
    if (!confirm("Remover esta conta?")) return;
    try {
      await deleteFn({ data: { id } });
      qc.invalidateQueries({ queryKey: ["banks"] });
      toast.success("Removida");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function submitWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(amountKz.replace(/\D/g, "")) * 100);
    if (!bankId) return toast.error("Escolha a conta bancária");
    if (cents < MIN_WITHDRAWAL_CENTS) return toast.error("Mínimo 5.000 Kz");
    if (cents > (wallet?.available_cents ?? 0)) return toast.error("Saldo insuficiente");
    try {
      await requestFn({ data: { gross_cents: cents, bank_account_id: bankId } });
      toast.success("Pedido enviado — em análise");
      setAmountKz("");
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
      qc.invalidateQueries({ queryKey: ["producer", "wallet"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const parsedCents = Math.round(Number(amountKz.replace(/\D/g, "")) * 100);
  const feePreview = Math.round(parsedCents * WITHDRAWAL_FEE);
  const netPreview = parsedCents - feePreview;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold font-semibold">Saques</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">
            Solicitação e histórico
          </h1>
        </div>
        <div className="rounded-2xl border border-primary/40 bg-primary/10 px-5 py-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Disponível
          </div>
          <div className="font-display text-2xl font-bold">{kz(wallet?.available_cents ?? 0)}</div>
        </div>
      </div>

      <FeeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* BANCOS */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Landmark className="h-4 w-4 text-gold" />
              Contas bancárias
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(null);
                setBankOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>
          {!banks?.length ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Ainda sem contas. Adicione para poder sacar.
            </div>
          ) : (
            <div className="space-y-2">
              {banks.map((b: any) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-border p-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      {b.holder_name}
                      {b.is_default && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold">
                          padrão
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {b.bank_name} · {b.iban}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(b);
                      setBankOpen(true);
                    }}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => removeBank(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PEDIR SAQUE */}
        <form
          onSubmit={submitWithdrawal}
          className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 space-y-4"
        >
          <h2 className="font-display font-semibold text-lg">Solicitar saque</h2>
          <div>
            <Label>Conta bancária</Label>
            <select
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className="mt-1 w-full h-10 rounded-md bg-background border border-input px-3 text-sm"
            >
              <option value="">Escolha...</option>
              {banks?.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.bank_name} — {b.iban}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Valor (Kz)</Label>
            <Input
              inputMode="numeric"
              value={amountKz}
              onChange={(e) => setAmountKz(e.target.value)}
              placeholder="Ex.: 25000"
            />
          </div>
          {parsedCents >= MIN_WITHDRAWAL_CENTS && (
            <div className="rounded-xl bg-muted/40 border border-border p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bruto</span>
                <span className="font-mono">{kz(parsedCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa 8%</span>
                <span className="font-mono text-destructive">-{kz(feePreview)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sm pt-1 border-t border-border">
                <span>A receber</span>
                <span className="font-mono">{kz(netPreview)}</span>
              </div>
            </div>
          )}
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-gold" />
            Mínimo 5.000 Kz. Processamento em 1-3 dias úteis.
          </div>
          <Button
            type="submit"
            className="w-full gradient-brand text-primary-foreground shadow-glow"
          >
            Enviar pedido
          </Button>
        </form>
      </div>

      {/* HISTÓRICO */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-lg">Histórico de saques</h2>
        </div>
        {!withdrawals?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Sem pedidos ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Banco</th>
                  <th className="px-6 py-3 text-right">Bruto</th>
                  <th className="px-6 py-3 text-right">Taxa</th>
                  <th className="px-6 py-3 text-right">Líquido</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {withdrawals.map((w: any) => (
                  <tr key={w.id}>
                    <td className="px-6 py-3 text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString("pt-AO")}
                    </td>
                    <td className="px-6 py-3 text-xs">
                      {w.bank_account?.bank_name ?? "—"}
                      <div className="text-muted-foreground">{w.bank_account?.iban}</div>
                    </td>
                    <td className="px-6 py-3 text-right font-mono">{kz(w.gross_cents)}</td>
                    <td className="px-6 py-3 text-right font-mono text-muted-foreground">
                      -{kz(w.fee_cents)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono font-semibold">
                      {kz(w.net_cents)}
                    </td>
                    <td className="px-6 py-3">
                      <WStatus s={w.status} r={w.rejection_reason} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog banco */}
      <Dialog
        open={bankOpen}
        onOpenChange={(o) => {
          setBankOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conta" : "Nova conta bancária"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveBank} className="space-y-3">
            <div>
              <Label>Titular</Label>
              <Input name="holder_name" defaultValue={editing?.holder_name} required />
            </div>
            <div>
              <Label>Banco</Label>
              <Input
                name="bank_name"
                defaultValue={editing?.bank_name}
                required
                placeholder="Ex.: BAI, BFA, BIC"
              />
            </div>
            <div>
              <Label>IBAN</Label>
              <Input name="iban" defaultValue={editing?.iban} required placeholder="AO06 ..." />
            </div>
            <div>
              <Label>Telefone (opcional)</Label>
              <Input name="phone" defaultValue={editing?.phone ?? ""} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch name="is_default" defaultChecked={editing?.is_default} /> Definir como padrão
            </label>
            <DialogFooter>
              <Button type="submit" className="gradient-brand text-primary-foreground">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WStatus({ s, r }: { s: string; r?: string | null }) {
  const map: Record<string, string> = {
    em_analise: "bg-warning/15 text-warning",
    aprovado: "bg-primary/15 text-primary-glow",
    pago: "bg-success/15 text-success",
    recusado: "bg-destructive/15 text-destructive",
  };
  const label: Record<string, string> = {
    em_analise: "Em análise",
    aprovado: "Aprovado",
    pago: "Pago",
    recusado: "Recusado",
  };
  return (
    <div>
      <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${map[s]}`}>
        {label[s] ?? s}
      </span>
      {s === "recusado" && r && (
        <div className="text-[10px] text-destructive mt-1 max-w-[200px]">{r}</div>
      )}
    </div>
  );
}
