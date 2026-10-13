/**
 * Geração de links públicos, links curtos, partilha e QR Codes de um produto.
 * Puro cliente — usa a origem atual para funcionar em preview e produção.
 */
import QRCode from "qrcode";

const FALLBACK_ORIGIN = "https://infropay.lovable.app";

export function origin(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return FALLBACK_ORIGIN;
}

export type ProductLinks = {
  product: string;
  checkout: string;
  short: string;
  share: string;
};

export function productLinks(slug: string, ref?: string | null): ProductLinks {
  const o = origin();
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const product = `${o}/produto/${slug}${q}`;
  const checkout = `${o}/checkout/${slug}${q}`;
  return {
    product,
    checkout,
    short: `${o}/p/${slug}`,
    share: product,
  };
}

export async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export async function qrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 512,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0F172A", light: "#FFFFFF" },
  });
}

/** Partilha nativa quando disponível; caso contrário copia o link. */
export async function shareLink(
  title: string,
  url: string,
): Promise<"shared" | "copied" | "failed"> {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title, text: title, url });
      return "shared";
    } catch {
      /* utilizador cancelou — tenta copiar */
    }
  }
  return (await copy(url)) ? "copied" : "failed";
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
