import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { qrDataUrl, copy, downloadDataUrl } from "@/lib/product-links";
import { toast } from "sonner";

export function QrDialog({
  open,
  onOpenChange,
  url,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open || !url) return;
    setSrc(null);
    qrDataUrl(url)
      .then(setSrc)
      .catch(() => toast.error("Não foi possível gerar o QR Code"));
  }, [open, url]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <div className="grid place-items-center rounded-2xl border border-border bg-card p-4">
          {src ? (
            <img src={src} alt={`QR Code — ${title}`} className="h-56 w-56 rounded-lg" />
          ) : (
            <div className="h-56 w-56 animate-pulse rounded-lg bg-muted" />
          )}
        </div>
        <p className="break-all text-center text-xs text-muted-foreground">{url}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={async () => {
              if (await copy(url)) {
                setDone(true);
                toast.success("Link copiado");
                setTimeout(() => setDone(false), 1500);
              }
            }}
          >
            {done ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />} Copiar
            link
          </Button>
          <Button
            className="flex-1 gradient-brand text-primary-foreground"
            disabled={!src}
            onClick={() => src && downloadDataUrl(src, "qrcode-infropay.png")}
          >
            <Download className="mr-1 h-4 w-4" /> Descarregar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
