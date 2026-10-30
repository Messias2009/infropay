import { z } from "zod";

/**
 * Estrutura de dados do Quiz Funnel.
 * O quiz inteiro (etapas, opções, regras, pontuação e tema) é guardado como
 * JSON na coluna `quizzes.definition` e validado no servidor antes de gravar.
 */

export type QuizMediaType = "image" | "video";

export type QuizStepType =
  "multi_choice" | "yes_no" | "text_input" | "lead_capture" | "info_media" | "offer";

export type QuizMedia = {
  type: QuizMediaType;
  url: string;
  poster?: string | null;
};

export type QuizTheme = {
  /** Cor principal: botões, barra de progresso e destaques. */
  primary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  logo_url: string | null;
  font: "inter" | "display" | "system";
  show_progress: boolean;
  radius: number;
};

export type QuizOption = {
  id: string;
  label: string;
  image_url?: string | null;
  /** Próxima etapa; null/ausente = seguir a ordem do quiz. */
  next?: string | null;
  score?: number;
  tags?: string[];
};

type BaseStep = {
  id: string;
  title: string;
  description?: string | null;
  media?: QuizMedia | null;
  button_label?: string | null;
  next?: string | null;
};

export type QuizStep =
  | (BaseStep & { type: "multi_choice"; options: QuizOption[] })
  /** Sim/Não — duas opções, mesma mecânica da escolha múltipla. */
  | (BaseStep & { type: "yes_no"; options: QuizOption[] })
  | (BaseStep & {
      type: "text_input";
      field?: string;
      placeholder?: string | null;
      required?: boolean;
    })
  | (BaseStep & { type: "lead_capture"; note?: string | null })
  | (BaseStep & { type: "info_media" })
  | (BaseStep & {
      type: "offer";
      product_slug: string;
      product_title?: string | null;
      price_label?: string | null;
      cta_label?: string | null;
      testimonials?: { name: string; text: string }[];
    });

export type QuizDefinition = {
  version: 1;
  theme: QuizTheme;
  start_step_id: string;
  steps: QuizStep[];
};

export type QuizAnswers = Record<string, string>;

export function defaultQuizTheme(): QuizTheme {
  return {
    primary: "#2563eb",
    background: "#0b1020",
    surface: "#131a2e",
    text: "#f5f7ff",
    muted: "#9aa4c2",
    logo_url: null,
    font: "inter",
    show_progress: true,
    radius: 16,
  };
}

export function emptyDefinition(): QuizDefinition {
  return { version: 1, theme: defaultQuizTheme(), start_step_id: "", steps: [] };
}

const mediaSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().max(2000),
  poster: z.string().max(2000).nullish(),
});

const optionSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().max(240),
  image_url: z.string().max(2000).nullish(),
  next: z.string().max(60).nullish(),
  score: z.number().int().min(-9999).max(9999).optional(),
  tags: z.array(z.string().max(40)).max(12).optional(),
});

const base = {
  id: z.string().min(1).max(60),
  title: z.string().min(1).max(240),
  description: z.string().max(1200).nullish(),
  media: mediaSchema.nullish(),
  button_label: z.string().max(60).nullish(),
  next: z.string().max(60).nullish(),
};

const stepSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("multi_choice"),
    options: z.array(optionSchema).min(1).max(10),
  }),
  z.object({ ...base, type: z.literal("yes_no"), options: z.array(optionSchema).min(2).max(2) }),
  z.object({
    ...base,
    type: z.literal("text_input"),
    field: z.string().max(40).optional(),
    placeholder: z.string().max(120).nullish(),
    required: z.boolean().optional(),
  }),
  z.object({ ...base, type: z.literal("lead_capture"), note: z.string().max(400).nullish() }),
  z.object({ ...base, type: z.literal("info_media") }),
  z.object({
    ...base,
    type: z.literal("offer"),
    product_slug: z.string().max(160),
    product_title: z.string().max(240).nullish(),
    price_label: z.string().max(60).nullish(),
    cta_label: z.string().max(80).nullish(),
    testimonials: z
      .array(z.object({ name: z.string().max(120), text: z.string().max(400) }))
      .max(6)
      .optional(),
  }),
]);

const definitionSchema = z.object({
  version: z.literal(1),
  theme: z.object({
    primary: z.string().max(40),
    background: z.string().max(40),
    surface: z.string().max(40),
    text: z.string().max(40),
    muted: z.string().max(40),
    logo_url: z.string().max(2000).nullish(),
    font: z.enum(["inter", "display", "system"]),
    show_progress: z.boolean(),
    radius: z.number().int().min(0).max(40),
  }),
  start_step_id: z.string().max(60),
  steps: z.array(stepSchema).max(60),
});

/** Valida a estrutura do quiz no servidor. Lança erro legível em PT. */
export function validateDefinition(input: unknown): QuizDefinition {
  const parsed = definitionSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.join(".") || "estrutura";
    throw new Error(
      `Estrutura do quiz inválida (${where}): ${first?.message ?? "dados inválidos"}`,
    );
  }
  const def = parsed.data as QuizDefinition;
  if (def.steps.length === 0) {
    throw new Error("Adicione pelo menos uma etapa antes de publicar o quiz.");
  }
  if (!def.steps.some((s) => s.id === def.start_step_id)) {
    throw new Error("A etapa inicial do quiz não existe.");
  }
  for (const step of def.steps) {
    if (step.type === "offer" && !step.product_slug.trim()) {
      throw new Error(`A etapa "${step.title}" precisa de um produto para a oferta.`);
    }
    const targets = [
      ...(step.next ? [step.next] : []),
      ...("options" in step && Array.isArray(step.options)
        ? step.options.map((o) => o.next).filter((n): n is string => !!n)
        : []),
    ];
    for (const t of targets) {
      if (!def.steps.some((s) => s.id === t)) {
        throw new Error(`A etapa "${step.title}" aponta para uma etapa inexistente (${t}).`);
      }
    }
  }
  return def;
}

export function stepIndex(def: QuizDefinition, stepId: string) {
  return def.steps.findIndex((s) => s.id === stepId);
}

export function getStep(def: QuizDefinition, stepId: string): QuizStep | null {
  return def.steps.find((s) => s.id === stepId) ?? null;
}

/** Próxima etapa: opção → etapa explícita → seguinte na ordem do quiz. */
export function resolveNext(
  def: QuizDefinition,
  step: QuizStep,
  option?: QuizOption,
): string | null {
  if (option?.next) return option.next;
  if (step.next) return step.next;
  const i = stepIndex(def, step.id);
  if (i >= 0 && i + 1 < def.steps.length) return def.steps[i + 1].id;
  return null;
}

/** Progresso entre 0 e 1 consoante a posição da etapa no quiz. */
export function progressOf(def: QuizDefinition, stepId: string) {
  const i = stepIndex(def, stepId);
  if (i < 0 || def.steps.length === 0) return 0;
  return Math.min(1, (i + 1) / def.steps.length);
}

/** Fonte do tema (com valores por omissão se o JSON vier incompleto). */
export function themeOf(def: Partial<QuizDefinition> | null | undefined): QuizTheme {
  return { ...defaultQuizTheme(), ...((def?.theme as Partial<QuizTheme>) ?? {}) };
}

export function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "quiz"
  );
}
