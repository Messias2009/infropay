import { copy, downloadDataUrl, origin, qrDataUrl, shareLink } from "./product-links";

/**
 * Links públicos e partilha do Quiz Funnel.
 * O link público é `${origin}/quiz/{slug}` e é válido assim que o quiz
 * estiver publicado (o servidor devolve "indisponível" se for rascunho).
 */

export type QuizLinks = {
  quiz: string;
  qr: boolean;
};

export function quizPublicUrl(slug: string): string {
  const safe = (slug || "").trim().replace(/[^a-z0-9-]/gi, "");
  return `${origin()}/quiz/${safe}`;
}

export function quizLinks(slug: string, ref?: string | null): QuizLinks {
  const base = quizPublicUrl(slug);
  const url = ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
  return { quiz: url, qr: true };
}

export function whatsappShareUrl(url: string, title: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`;
}

export { copy, downloadDataUrl, qrDataUrl, shareLink };

const VISITOR_KEY = "ip_quiz_visitor";

/** Identificador local do visitante (só agrupa sessões; não identifica a pessoa). */
export function visitorId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(VISITOR_KEY, generated);
    return generated;
  } catch {
    return `anon${Date.now().toString(36)}`;
  }
}

/** Guarda o lead do quiz para o checkout pré-preencher (sem PII no URL). */
const LEAD_KEY = "ip_quiz_lead";

export function stashQuizLead(lead: {
  nome: string;
  whatsapp: string;
  product_slug?: string | null;
  quiz_slug?: string | null;
}) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LEAD_KEY, JSON.stringify(lead));
  } catch {
    /* modo privado — o checkout apenas não pré-preenche */
  }
}

export function readQuizLead(): {
  nome: string;
  whatsapp: string;
  product_slug?: string | null;
  quiz_slug?: string | null;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LEAD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      nome: typeof parsed.nome === "string" ? parsed.nome.slice(0, 120) : "",
      whatsapp: typeof parsed.whatsapp === "string" ? parsed.whatsapp.slice(0, 30) : "",
      product_slug: typeof parsed.product_slug === "string" ? parsed.product_slug : null,
      quiz_slug: typeof parsed.quiz_slug === "string" ? parsed.quiz_slug : null,
    };
  } catch {
    return null;
  }
}
