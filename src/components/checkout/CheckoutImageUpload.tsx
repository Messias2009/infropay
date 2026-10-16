import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio?: "square" | "banner";
  productKey?: string;
};

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Compresses an image file in-browser to a clean, lightweight data URL or uploads to Supabase.
 */
async function compressImageToDataUrl(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CheckoutImageUpload({
  label,
  hint,
  value,
  onChange,
  aspectRatio = "square",
  productKey = "checkout",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione um ficheiro de imagem válido (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O ficheiro deve ter menos de 10MB");
      return;
    }

    setUploading(true);

    try {
      // 1. Process local image for instant preview & fallback
      const maxW = aspectRatio === "banner" ? 1200 : 500;
      const maxH = aspectRatio === "banner" ? 400 : 500;
      const localDataUrl = await compressImageToDataUrl(file, maxW, maxH, 0.88);

      // Attempt Supabase storage upload if user is authenticated and bucket exists
      let finalUrl = localDataUrl;
      try {
        const { data: sess } = await supabase.auth.getUser();
        const uid = sess.user?.id;
        if (uid) {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${uid}/${productKey}/${aspectRatio}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("product-media").upload(path, file, {
            upsert: true,
            contentType: file.type,
          });

          if (!upErr) {
            const { data: signed } = await supabase.storage
              .from("product-media")
              .createSignedUrl(path, TEN_YEARS);
            if (signed?.signedUrl) {
              finalUrl = signed.signedUrl;
            }
          }
        }
      } catch {
        // Fallback to localDataUrl if storage upload is unavailable
      }

      onChange(finalUrl);
      toast.success("Imagem carregada com sucesso!");
    } catch (err) {
      toast.error("Erro ao processar imagem: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        {value && (
          <span className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
            ✓ Carregado
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="relative rounded-xl border border-border bg-card/80 overflow-hidden group shadow-xs">
          <div
            className={`w-full bg-black/40 flex items-center justify-center overflow-hidden ${
              aspectRatio === "banner" ? "aspect-[3/1]" : "h-36"
            }`}
          >
            <img
              src={value}
              alt={label}
              referrerPolicy="no-referrer"
              className={`object-contain max-h-full ${
                aspectRatio === "banner" ? "w-full object-cover" : "max-w-full p-2"
              }`}
            />
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-lg">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-white hover:text-white hover:bg-white/20 gap-1 cursor-pointer"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <RefreshCw className="h-3 w-3" />
              Substituir
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer"
              onClick={() => onChange("")}
              disabled={uploading}
              title="Remover imagem"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`w-full rounded-xl border-2 border-dashed transition-all p-5 flex flex-col items-center justify-center gap-2 cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-border/80 bg-card/40 hover:border-primary/60 hover:bg-card/70"
          } ${uploading ? "opacity-70 pointer-events-none" : ""}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs font-medium text-foreground">A processar imagem...</span>
            </div>
          ) : (
            <>
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                {aspectRatio === "banner" ? (
                  <ImageIcon className="h-5 w-5" />
                ) : (
                  <UploadCloud className="h-5 w-5" />
                )}
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-foreground block">
                  Clique ou arraste a imagem aqui
                </span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">
                  {aspectRatio === "banner"
                    ? "Formato banner (proporção aprox. 3:1) · PNG, JPG ou WEBP"
                    : "Formato quadrado/ícone · Fundo transparente recomendado"}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
