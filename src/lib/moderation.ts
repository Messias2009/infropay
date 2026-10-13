/**
 * Validação automática de conteúdo (aprovação automática de produtos).
 * Puro, sem dependências — usado no servidor antes de publicar.
 */

export type ModerationResult = { ok: true } | { ok: false; reason: string };

type Rule = { label: string; patterns: RegExp[] };

const RULES: Rule[] = [
  {
    label: "conteúdo ilegal ou proibido",
    patterns: [
      /\b(pornograf\w*|pedofil\w*|zoofil\w*|incesto)\b/i,
      /\b(cocaina|coca[íi]na|heroina|hero[íi]na|metanfetamina|maconha|drogas?\s+(ilegais|pesadas))\b/i,
      /\b(arma de fogo|armas de fogo|munic[õo]es|explosivos?|granada)\b/i,
      /\b(documentos? falsos?|passaporte falso|bi falso|diploma falso|certificado falso)\b/i,
      /\b(dinheiro falso|notas falsas)\b/i,
      /\b(marfim|[óo]rg[ãa]os? humanos?|tr[áa]fico)\b/i,
    ],
  },
  {
    label: "fraude ou esquema financeiro proibido",
    patterns: [
      /\b(esquema (de )?pir[âa]mide|pirâmide financeira|ponzi)\b/i,
      /\b(hack\w*|crack\w*|keygen|nulled|licen[çc]as? pirata\w*|serial crackeado)\b/i,
      /\b(cart[õo]es? clonad\w*|cc full|carding|lavagem de dinheiro)\b/i,
      /\b(rendimento garantido|lucro garantido|ganho garantido|100% de lucro|dinheiro f[áa]cil garantido)\b/i,
      /\b(dobre o seu dinheiro|triplique o seu dinheiro)\b/i,
    ],
  },
  {
    label: "spam ou descrição enganosa",
    patterns: [
      /(?:https?:\/\/\S+\s*){6,}/i,
      /\b(clique aqui agora){2,}/i,
      /(.)\1{14,}/,
      /\b(ganhe \d{5,}\s*kz por dia)\b/i,
    ],
  },
];

/** Domínios de encurtadores/hospedagem opaca frequentemente usados para links maliciosos. */
const BLOCKED_HOSTS = [
  "bit.ly",
  "tinyurl.com",
  "cutt.ly",
  "is.gd",
  "t.co",
  "shorturl.at",
  "adf.ly",
  "shrinkme.io",
  "ouo.io",
  "linkvertise.com",
  "grabify.link",
];

function hosts(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/https?:\/\/([^/\s"'<>)]+)/gi)) {
    out.push(m[1]!.toLowerCase().replace(/^www\./, ""));
  }
  return out;
}

export type ModerationInput = {
  title?: string | null;
  short_description?: string | null;
  description?: string | null;
  external_url?: string | null;
  file_url?: string | null;
  tags?: string[] | null;
  price_cents?: number | null;
};

export function moderateProduct(input: ModerationInput): ModerationResult {
  const title = (input.title ?? "").trim();
  const short = (input.short_description ?? "").trim();
  const desc = (input.description ?? "").trim();

  // Qualidade mínima (evita publicações vazias / de teste no catálogo)
  if (title.length < 5) {
    return {
      ok: false,
      reason: "O título é demasiado curto. Use um título claro com pelo menos 5 caracteres.",
    };
  }
  if (!short && desc.length < 40) {
    return {
      ok: false,
      reason:
        "Adicione uma descrição do produto (mínimo 40 caracteres) ou uma descrição curta antes de publicar.",
    };
  }
  if (/\b(teste|test|asdf|lorem ipsum)\b/i.test(title) && title.length < 20) {
    return { ok: false, reason: "O título parece ser de teste. Use o nome real do produto." };
  }

  const blob = [title, short, desc, (input.tags ?? []).join(" ")].join("\n");

  for (const rule of RULES) {
    for (const re of rule.patterns) {
      if (re.test(blob)) {
        return {
          ok: false,
          reason: `Publicação bloqueada pela validação automática: ${rule.label}. Reveja o título, a descrição e as etiquetas e submeta novamente.`,
        };
      }
    }
  }

  const allHosts = [
    ...hosts(blob),
    ...hosts(input.external_url ?? ""),
    ...hosts(input.file_url ?? ""),
  ];
  const bad = allHosts.find((h) => BLOCKED_HOSTS.some((b) => h === b || h.endsWith("." + b)));
  if (bad) {
    return {
      ok: false,
      reason: `Link não permitido (${bad}). Não são aceites encurtadores de links — use o endereço final e verificável.`,
    };
  }

  for (const url of [input.external_url, input.file_url]) {
    if (url && /^http:\/\//i.test(url)) {
      return { ok: false, reason: "Os links do produto devem usar HTTPS por segurança." };
    }
  }

  return { ok: true };
}
