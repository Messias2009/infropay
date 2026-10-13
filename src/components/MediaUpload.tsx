import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  kind?: "image" | "file";
  label?: string;
  hint?: string;
  accept?: string;
  productKey?: string; // e.g. product id or slug for folder grouping
};

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function MediaUpload({
  value,
  onChange,
  kind = "image",
  label,
  hint,
  accept,
  productKey,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const maxMB = kind === "image" ? 8 : 200;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Ficheiro maior que ${maxMB}MB`);
      return;
    }
    setUploading(true);
    setProgress(10);
    try {
      const { data: sess } = await supabase.auth.getUser();
      const uid = sess.user?.id;
      if (!uid) throw new Error("Sessão expirada");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${uid}/${productKey ?? "misc"}/${kind}-${Date.now()}.${ext}`;
      setProgress(30);
      const { error: upErr } = await supabase.storage.from("product-media").upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;
      setProgress(70);
      const { data: signed, error: sErr } = await supabase.storage
        .from("product-media")
        .createSignedUrl(path, TEN_YEARS);
      if (sErr) throw sErr;
      setProgress(100);
      onChange(signed.signedUrl);
      toast.success("Upload concluído");
    } catch (err) {
      toast.error((err as Error).message || "Falha no upload");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 400);
    }
  }

  const isImage = kind === "image";
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <div>
      {label && <div className="text-sm font-medium mb-1.5">{label}</div>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept ?? (isImage ? "image/png,image/jpeg,image/webp,image/gif" : undefined)}
        onChange={pickFile}
      />

      {value ? (
        <div className="relative rounded-xl border border-border bg-card overflow-hidden group">
          {isImage ? (
            <img src={value} alt="" className="w-full h-48 object-cover" />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
                <FileText className="h-5 w-5 text-primary-glow" />
              </div>
              <div className="text-sm truncate flex-1">Ficheiro carregado</div>
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Substituir
            </Button>
            <Button type="button" size="icon" variant="destructive" onClick={() => onChange(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/5 transition p-6 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          {uploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-primary-glow" />
              <span>A carregar... {progress}%</span>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
                <Icon className="h-5 w-5 text-primary-glow" />
              </div>
              <span className="font-medium text-foreground">
                {isImage ? "Clique para enviar imagem" : "Clique para enviar ficheiro"}
              </span>
              <span className="text-xs">
                {isImage ? "PNG, JPG, WEBP · até 8MB" : "Qualquer formato · até 200MB"}
              </span>
            </>
          )}
        </button>
      )}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {uploading && progress > 0 && progress < 100 && (
        <div className="h-1 mt-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-brand transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
