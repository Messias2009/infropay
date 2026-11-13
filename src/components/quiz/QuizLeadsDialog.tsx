import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Download, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listQuizLeads } from "@/lib/quiz-public.functions";
import { copy } from "@/lib/product-links";

type Lead = {
  id: string;
  nome: string | null;
  whatsapp: string;
  tags: string[] | null;
  score: number | null;
  created_at: string;
};

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Leads capturados pelo quiz (nome + WhatsApp), com exportação em CSV. */
export function QuizLeadsDialog({
  open,
  onOpenChange,
  quizId,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string | null;
  title: string;
}) {
  const listFn = useServerFn(listQuizLeads);
  const { data, isLoading, error } = useQuery({
    queryKey: ["quiz-leads", quizId],
    queryFn: () => listFn({ data: { quiz_id: quizId!, limit: 200 } }),
    enabled: open && !!quizId,
  });

  const leads = (data?.items ?? []) as Lead[];

  function exportCsv() {
    if (!leads.length) return;
    const rows = [
      ["nome", "whatsapp", "score", "tags", "data"],
      ...leads.map((lead) => [
        lead.nome ?? "",
        lead.whatsapp,
        String(lead.score ?? 0),
        (lead.tags ?? []).join("|"),
        new Date(lead.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `leads-${quizId}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Leads — {title}</DialogTitle>
          <DialogDescription>
            Contactos capturados neste quiz, prontos para follow-up no WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid place-items-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mb-2 h-5 w-5 animate-spin" /> A carregar leads…
          </div>
        ) : error ? (
          <p className="py-6 text-sm text-destructive">{(error as Error).message}</p>
        ) : leads.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Ainda sem leads. Partilhe o link do quiz para começar a captar contactos.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-[50vh] overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wider text-muted-foreground backdrop-blur">
                  <tr>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">WhatsApp</th>
                    <th className="px-3 py-2">Pontos</th>
                    <th className="px-3 py-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-t border-border/60">
                      <td className="px-3 py-2 font-medium">{lead.nome || "—"}</td>
                      <td className="px-3 py-2">
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {lead.whatsapp}
                        </a>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{lead.score ?? 0}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString("pt-PT")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  const numbers = leads.map((lead) => lead.whatsapp).join(", ");
                  if (numbers && (await copy(numbers))) toast.success("Números copiados");
                }}
              >
                <Copy className="mr-2 h-4 w-4" /> Copiar números
              </Button>
              <Button variant="outline" onClick={exportCsv}>
                <Download className="mr-2 h-4 w-4" /> Exportar CSV
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
