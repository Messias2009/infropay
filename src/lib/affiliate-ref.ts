const KEY = "infropay_ref";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Store = Record<string, { code: string; at: number }>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store;
  } catch {
    return {};
  }
}

/** Guarda o código de afiliado associado a um produto (30 dias). */
export function saveRef(slug: string, code: string) {
  if (typeof window === "undefined") return;
  const store = read();
  store[slug] = { code, at: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage indisponível */
  }
}

/** Lê o código de afiliado válido para um produto. */
export function getRef(slug: string): string | null {
  const entry = read()[slug];
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) return null;
  return entry.code;
}
