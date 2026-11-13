import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  copy,
  downloadDataUrl,
  qrDataUrl,
  quizPublicUrl,
  whatsappShareUrl,
} from "@/lib/quiz-links";

/** Link público + QR + partilha do quiz (o mesmo link que os anúncios usam). */
export function QuizShareDialog({
  open,
  onOpenChange,
  slug,
  title,
  published,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  title: string;
  published: boolean;
}) {
  const url = quizPublicUrl(slug);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQr(null);
    setCopied(false);
    qrDataUrl(url)
      .then(setQr)
      .catch(() => toast.error("Não foi possível gerar o QR Code."));
  }, [open, url]);

  async function copyLink() {
    if (await copy(url)) {
      setCopied(true);
      toast.success("Link do quiz copiado");
      setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error("Não foi possível copiar. Copie o link manualmente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Link do quiz</DialogTitle>
          <DialogDescription>
            Partilhe este endereço na bio, nos anúncios ou no WhatsApp. Quem abrir entra
            directamente no quiz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2">
            <Link2 className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input value={url} readOnly className="border-0 bg-transparent font-mono text-xs" />
            <Button size="sm" onClick={copyLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {!published && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              Este quiz ainda é um rascunho. O link só funciona depois de clicar em{" "}
              <span className="font-semibold">Publicar</span>.
            </p>
          )}

          <div className="grid place-items-center rounded-2xl border border-border bg-card p-4">
            {qr ? (
              <img src={qr} alt={`QR Code do quiz ${title}`} className="h-48 w-48 rounded-lg" />
            ) : (
              <div className="grid h-48 w-48 place-items-center">
                {open ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <QrCode className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a href={whatsappShareUrl(url, title)} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
            </a>
            <a href={url} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" /> Abrir quiz
              </Button>
            </a>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            disabled={!qr}
            onClick={() => qr && downloadDataUrl(qr, `quiz-${slug}.png`)}
          >
            <Download className="mr-2 h-4 w-4" /> Descarregar QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
