import { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { createReceiptUpload, submitReceipt } from "@/lib/receipt.functions";

const BUCKET = "payment-receipts";
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

type Props = {
  token: string;
  receiptStatus: string;
  receiptKind?: string | null;
  receiptNote?: string | null;
  orderStatus: string;
  onSubmitted: () => void;
};

/**
 * Envio do comprovativo pelo comprador: imagem (PNG/JPG/WEBP) ou PDF.
 * O ficheiro é carregado para um bucket privado através de URL assinada
 * criada no servidor — o cliente nunca escolhe o destino final.
 */
export function ReceiptUpload({
  token,
  receiptStatus,
  receiptKind,
  receiptNote,
  orderStatus,
  onSubmitted,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<null | "preparing" | "uploading" | "confirming">(null);

  if (orderStatus === "pago") {
    if (receiptStatus !== "aprovado") return null;
    return (
      <div className="rounded-2xl border border-success/40 bg-success/5 p-5 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
        <div className="text-sm">
          <div className="font-semibold">Comprovativo aprovado</div>
          <div className="text-muted-foreground text-xs mt-0.5">
            O pagamento foi verificado e o acesso foi liberado.
          </div>
        </div>
      </div>
    );
  }

  const pending = receiptStatus === "enviado";
  const rejected = receiptStatus === "rejeitado";

  function pick(f: File | null) {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      toast.error("Formato não suportado. Envie uma imagem (PNG, JPG, WEBP) ou PDF.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("O ficheiro deve ter menos de 10 MB.");
      return;
    }
    setFile(f);
  }

  async function send() {
    if (!file) return;
    try {
      setBusy("preparing");
      const prepared = await createReceiptUpload({
        data: {
          token,
          file_name: file.name,
          content_type: file.type,
          size: file.size,
        },
      });

      setBusy("uploading");
      const { error: upError } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type });
      if (upError) throw new Error(upError.message);

      setBusy("confirming");
      await submitReceipt({ data: { token, path: prepared.path } });

      setFile(null);
      toast.success("Comprovativo enviado! A aguardar verificação.");
      onSubmitted();
    } catch (err) {
      toast.error((err as Error).message || "Não foi possível enviar o comprovativo.");
    } finally {
      setBusy(null);
    }
  }

  if (pending) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5 flex items-start gap-3">
        <Clock className="h-5 w-5 text-gold shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold">Comprovativo enviado — a aguardar verificação</div>
          <p className="text-muted-foreground text-xs mt-1">
            {receiptKind === "pdf" ? "PDF" : "Imagem"} recebido. O vendedor ou a administração vão
            confirmar o pagamento e o acesso é liberado automaticamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-gold">
          Enviar comprovativo
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Depois de pagar a Entidade/Referência, envie aqui o comprovativo como imagem ou PDF. O
          acesso ao produto é liberado após a verificação.
        </p>
      </div>

      {rejected && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex gap-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <div>
            <span className="font-semibold text-destructive">Comprovativo recusado.</span>{" "}
            {receiptNote ? receiptNote : "Envie novamente um comprovativo válido."}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {file ? (
        <div className="rounded-xl border border-border bg-secondary/50 p-3 flex items-center gap-3">
          {file.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(file)}
              alt="Comprovativo selecionado"
              className="h-14 w-14 rounded-lg object-cover border border-border"
            />
          ) : (
            <div className="h-14 w-14 rounded-lg grid place-items-center bg-destructive/10 border border-destructive/30">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{file.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
              {file.type === "application/pdf" ? "PDF" : "Imagem"}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setFile(null)}
            disabled={!!busy}
          >
            Remover
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-border/80 bg-card/40 hover:border-gold/60 hover:bg-card/80 transition p-5 flex flex-col items-center gap-2 cursor-pointer"
        >
          <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/25 grid place-items-center text-gold">
            <UploadCloud className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold">Clique ou arraste o comprovativo</span>
          <span className="text-[11px] text-muted-foreground">
            Imagem (PNG, JPG, WEBP) ou PDF · até 10 MB
          </span>
        </button>
      )}

      <Button
        type="button"
        onClick={send}
        disabled={!file || !!busy}
        className="w-full gradient-brand text-primary-foreground font-semibold"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {busy === "preparing"
              ? "A preparar o envio…"
              : busy === "uploading"
                ? "A carregar o ficheiro…"
                : "A confirmar…"}
          </>
        ) : (
          <>
            {file?.type === "application/pdf" ? (
              <FileText className="h-4 w-4 mr-2" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            Enviar comprovativo
          </>
        )}
      </Button>

      <p className="text-[11px] text-muted-foreground text-center">
        O comprovativo é verificado pelo vendedor ou pela administração antes de o acesso ser
        liberado.
      </p>
    </div>
  );
}
