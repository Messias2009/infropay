import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Search, Ban, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listUsers, toggleUserBan } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/adm/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Admin InfroPay" },
      { name: "description", content: "Gestão de contas de utilizadores da plataforma." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function kz(cents: number) {
  return new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(cents / 100) + " Kz";
}

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listUsers);
  const banFn = useServerFn(toggleUserBan);
  const [search, setSearch] = useState("");
  const [banning, setBanning] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["adm", "users", search],
    queryFn: () => listFn({ data: { search } }),
  });

  async function act(id: string, banned: boolean, r?: string) {
    try {
      await banFn({ data: { id, banned, reason: r } });
      toast.success(banned ? "Conta bloqueada" : "Conta desbloqueada");
      qc.invalidateQueries({ queryKey: ["adm", "users"] });
      setBanning(null);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">
          Administração
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Contas bloqueadas não conseguem entrar, publicar produtos nem receber vendas.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou email"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">A carregar...</div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left p-3">Utilizador</th>
                <th className="text-left p-3">Papel</th>
                <th className="text-right p-3">Vendido</th>
                <th className="text-right p-3">Gasto</th>
                <th className="text-left p-3">Registo</th>
                <th className="text-right p-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u: any) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-secondary grid place-items-center overflow-hidden shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate flex items-center gap-2">
                          {u.full_name ?? u.username ?? "Sem nome"}
                          {u.is_banned && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-semibold">
                              BLOQUEADO
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {u.email || "—"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {u.roles.length ? u.roles.join(", ") : "buyer"}
                  </td>
                  <td className="p-3 text-right font-medium">{kz(u.total_sold_cents)}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {kz(u.total_spent_cents)}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="p-3 text-right">
                    {u.is_banned ? (
                      <Button size="sm" variant="outline" onClick={() => act(u.id, false)}>
                        <ShieldCheck className="h-4 w-4 mr-1" /> Desbloquear
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/40"
                        onClick={() => setBanning(u)}
                      >
                        <Ban className="h-4 w-4 mr-1" /> Bloquear
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!(data ?? []).length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    Nenhum utilizador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!banning} onOpenChange={(o) => !o && setBanning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear {banning?.full_name ?? banning?.email}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo do bloqueio"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanning(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground"
              onClick={() => act(banning.id, true, reason)}
            >
              Bloquear conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
