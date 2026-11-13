import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import {
  getStep,
  progressOf,
  resolveNext,
  sanitizeDefinition,
  themeOf,
  type QuizAnswers,
  type QuizDefinition,
  type QuizMedia,
  type QuizOption,
  type QuizTheme,
} from "@/lib/quiz-schema";
import { QuizVsl } from "./QuizVsl";

export type QuizLead = { nome: string; whatsapp: string; tags: string[]; score: number };

export type QuizResult = {
  answers: QuizAnswers;
  score: number;
  tags: string[];
  lastStepId: string;
  lead: QuizLead | null;
  offer?: { product_slug: string; cta_label: string } | null;
};

type Props = {
  quiz: QuizDefinition;
  /** Etapa inicial (por omissão, `start_step_id` do quiz). */
  startStepId?: string;
  /** Chamado quando o visitante carrega no CTA da oferta. */
  onComplete?: (result: QuizResult) => void | Promise<void>;
  /** Chamado quando o visitante preenche a captura de lead. */
  onLead?: (lead: QuizLead) => void | Promise<void>;
  /** Avanço de etapa (resposta, avanço) — usado pelo analytics. */
  onStep?: (info: {
    stepId: string;
    type: "visualizacao" | "resposta" | "avanco" | "oferta";
    value?: string;
  }) => void;
  /** Modo de demonstração: não navega para fora. */
  preview?: boolean;
  /** Mostra a moldura (logótipo, progresso, voltar). */
  chrome?: boolean;
};

const FONTS: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  system: "system-ui, -apple-system, sans-serif",
};

const LETTERS = "ABCDEFGHIJ";

/**
 * Página do quiz: uma pergunta por ecrã, mobile-first, com tema
 * personalizado pelo produtor.
 *
 * Mídia:
 * * imagem → capa em lazy-load;
 * * vídeo → player VSL (`QuizVsl`): autoplay silencioso, controlos próprios,
 *   e o botão de continuar só aparece no fim do vídeo (ou após o tempo
 *   configurado) — é o comportamento de uma video sales letter.
 */
export function QuizRenderer({
  quiz,
  startStepId,
  onComplete,
  onLead,
  onStep,
  preview,
  chrome = true,
}: Props) {
  const definition = useMemo(() => sanitizeDefinition(quiz), [quiz]);
  const theme = useMemo(() => themeOf(definition), [definition]);
  const initial = startStepId || definition.start_step_id || definition.steps[0]?.id || "";

  const [history, setHistory] = useState<string[]>([initial]);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [score, setScore] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [lead, setLead] = useState<QuizLead | null>(null);
  const [form, setForm] = useState({ nome: "", whatsapp: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [textValue, setTextValue] = useState("");

  const currentId = history[history.length - 1] ?? "";
  const step = getStep(definition, currentId);
  const progress = progressOf(definition, currentId);
  const stepNumber = Math.max(1, definition.steps.findIndex((s) => s.id === currentId) + 1);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    setTextValue("");
    setError(null);
    if (currentId) onStepRef.current?.({ stepId: currentId, type: "visualizacao" });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentId]);

  const go = useCallback((nextId: string | null) => {
    if (!nextId) return;
    setHistory((h) => (h[h.length - 1] === nextId ? h : [...h, nextId]));
  }, []);

  const answerOption = (option: QuizOption) => {
    if (!step) return;
    const points = option.score ?? 0;
    setAnswers((a) => ({ ...a, [step.id]: option.label }));
    if (points) setScore((s) => s + points);
    if (option.tags?.length) setTags((t) => Array.from(new Set([...t, ...option.tags!])));
    onStep?.({ stepId: step.id, type: "resposta", value: option.label });
    onStep?.({ stepId: step.id, type: "avanco", value: option.id });
    go(resolveNext(definition, step, option));
  };

  const submitText = () => {
    if (!step || step.type !== "text_input") return;
    if (step.required !== false && !textValue.trim()) {
      setError("Escreva uma resposta para continuar.");
      return;
    }
    const field = step.field || step.id;
    setAnswers((a) => ({ ...a, [field]: textValue.trim() }));
    onStep?.({ stepId: step.id, type: "resposta", value: textValue.trim() });
    go(resolveNext(definition, step));
  };

  const submitLead = async () => {
    if (!step) return;
    const nome = form.nome.trim();
    const whatsapp = form.whatsapp.trim();
    if (nome.length < 2) {
      setError("Diga-nos o seu nome.");
      return;
    }
    if (whatsapp.replace(/\D/g, "").length < 9) {
      setError("Indique um WhatsApp válido (mínimo 9 dígitos).");
      return;
    }
    const payload: QuizLead = { nome, whatsapp, tags, score };
    setError(null);
    setBusy(true);
    try {
      await onLead?.(payload);
      setLead(payload);
      setAnswers((a) => ({ ...a, nome, whatsapp }));
      onStep?.({ stepId: step.id, type: "resposta", value: whatsapp });
      go(resolveNext(definition, step));
    } catch (e) {
      setError((e as Error).message || "Não foi possível guardar os seus dados. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const finishOffer = async () => {
    if (!step || step.type !== "offer") return;
    const payload: QuizResult = {
      answers,
      score,
      tags,
      lastStepId: step.id,
      lead,
      offer: { product_slug: step.product_slug, cta_label: step.cta_label || "Comprar agora" },
    };
    onStep?.({ stepId: step.id, type: "oferta", value: step.product_slug });
    setBusy(true);
    try {
      await onComplete?.(payload);
    } finally {
      // Se a navegação para o checkout falhar, o botão volta a ficar activo.
      setTimeout(() => setBusy(false), 1500);
    }
  };

  const canGoBack = history.length > 1;
  const goBack = () => {
    setError(null);
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };

  const shellStyle: React.CSSProperties = {
    background: theme.background,
    color: theme.text,
    fontFamily: FONTS[theme.font] ?? FONTS.inter,
  };

  if (!step) {
    return (
      <div className="min-h-[70vh] grid place-items-center p-6 text-center" style={shellStyle}>
        <div>
          <Sparkles className="mx-auto h-8 w-8 opacity-60" style={{ color: theme.primary }} />
          <div className="mt-3 font-semibold">Este quiz ainda não tem etapas.</div>
          <p className="mt-1 text-sm" style={{ color: theme.muted }}>
            Volte mais tarde.
          </p>
        </div>
      </div>
    );
  }

  const isVslStep = step.media?.type === "video" && step.media.url;
  const gatesVideo = Boolean(isVslStep && step.type === "info_media" && step.media?.vsl !== false);

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden" style={shellStyle}>
      {theme.background_url ? (
        <div className="pointer-events-none absolute inset-0">
          <img
            src={theme.background_url}
            alt=""
            className="h-full w-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${theme.background}dd 0%, ${theme.background}f5 60%, ${theme.background} 100%)`,
            }}
          />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(120% 60% at 50% 0%, ${theme.primary}22 0%, transparent 60%)`,
          }}
        />
      )}

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-4 pb-6 pt-4 sm:px-5 sm:pt-6">
        {chrome && (
          <header className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {theme.logo_url ? (
                <img
                  src={theme.logo_url}
                  alt=""
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Sparkles className="h-4 w-4" style={{ color: theme.primary }} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              {theme.show_progress ? (
                <>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full"
                    style={{ background: "rgba(255,255,255,.12)" }}
                    role="progressbar"
                    aria-valuenow={Math.round(progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progresso do quiz"
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.round(progress * 100)}%`, background: theme.primary }}
                    />
                  </div>
                  <div className="mt-1.5 text-[11px] font-medium" style={{ color: theme.muted }}>
                    Passo {stepNumber} de {definition.steps.length}
                  </div>
                </>
              ) : (
                <div className="text-sm font-semibold">Passo {stepNumber}</div>
              )}
            </div>

            <button
              type="button"
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="Voltar à pergunta anterior"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10 disabled:opacity-30"
              style={{ color: theme.text }}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </header>
        )}

        <main
          key={step.id}
          className="animate-in fade-in slide-in-from-bottom-2 flex-1 duration-300"
        >
          {step.media?.url && (
            <div className="mb-5">
              {step.media.type === "video" ? (
                <QuizVsl
                  src={step.media.url}
                  poster={step.media.poster}
                  caption={step.media.caption}
                  accent={theme.primary}
                  radius={theme.radius}
                  autoplay={step.media.autoplay !== false}
                  unlockAfter={step.media.unlock_after ?? null}
                >
                  {gatesVideo ? (
                    <ContinueButton
                      theme={theme}
                      busy={false}
                      label={step.button_label || "Continuar"}
                      onClick={() => go(resolveNext(definition, step))}
                    />
                  ) : null}
                </QuizVsl>
              ) : (
                <img
                  src={step.media.url}
                  alt=""
                  loading={preview ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full object-cover shadow-xl"
                  style={{ borderRadius: theme.radius }}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          )}

          <h1
            className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl"
            style={{ color: theme.text }}
          >
            {step.title}
          </h1>
          {"description" in step && step.description ? (
            <p
              className="mt-2.5 text-sm leading-relaxed sm:text-[15px]"
              style={{ color: theme.muted }}
            >
              {step.description}
            </p>
          ) : null}

          <div className="mt-5">
            {(step.type === "multi_choice" || step.type === "yes_no") && (
              <div
                className={`grid gap-2.5 ${
                  step.options.some((o) => o.image_url) ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {step.options.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => answerOption(option)}
                    className="group flex items-start gap-3 rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[var(--q-primary)] hover:shadow-lg active:scale-[.99]"
                    style={{
                      background: "rgba(255,255,255,.05)",
                      borderColor: "rgba(255,255,255,.13)",
                      borderRadius: theme.radius,
                    }}
                  >
                    {option.image_url ? (
                      <img
                        src={option.image_url}
                        alt=""
                        loading="lazy"
                        className="mb-1 w-full rounded-xl object-cover"
                        style={{ aspectRatio: "4/3" }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span
                        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                        style={{ background: `${theme.primary}26`, color: theme.primary }}
                      >
                        {LETTERS[index] ?? index + 1}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      {option.image_url && (
                        <span
                          className="mb-1 block text-[11px] font-bold"
                          style={{ color: theme.primary }}
                        >
                          {LETTERS[index] ?? index + 1}
                        </span>
                      )}
                      <span
                        className="flex items-center justify-between gap-2 text-sm font-semibold"
                        style={{ color: theme.text }}
                      >
                        {option.label}
                        <ArrowRight
                          className="h-4 w-4 shrink-0 opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                          style={{ color: theme.primary }}
                        />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step.type === "text_input" && (
              <div className="space-y-3">
                <input
                  value={textValue}
                  onChange={(event) => {
                    setTextValue(event.target.value);
                    setError(null);
                  }}
                  onKeyDown={(event) => event.key === "Enter" && submitText()}
                  placeholder={step.placeholder || "Escreva a sua resposta"}
                  className="h-12 w-full border px-4 text-sm outline-none transition focus:border-[var(--q-primary)]"
                  style={inputStyle(theme)}
                />
                <ContinueButton
                  theme={theme}
                  label={step.button_label || "Continuar"}
                  onClick={submitText}
                />
              </div>
            )}

            {step.type === "lead_capture" && (
              <div className="space-y-3">
                <input
                  value={form.nome}
                  onChange={(event) => {
                    setForm({ ...form, nome: event.target.value });
                    setError(null);
                  }}
                  autoComplete="name"
                  placeholder="O seu nome"
                  className="h-12 w-full border px-4 text-sm outline-none transition focus:border-[var(--q-primary)]"
                  style={inputStyle(theme)}
                />
                <input
                  value={form.whatsapp}
                  onChange={(event) => {
                    setForm({ ...form, whatsapp: event.target.value });
                    setError(null);
                  }}
                  onKeyDown={(event) => event.key === "Enter" && void submitLead()}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="WhatsApp (ex.: 923 000 000)"
                  className="h-12 w-full border px-4 text-sm outline-none transition focus:border-[var(--q-primary)]"
                  style={inputStyle(theme)}
                />
                {"note" in step && step.note ? (
                  <p className="flex items-start gap-1.5 text-xs" style={{ color: theme.muted }}>
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {step.note}
                  </p>
                ) : null}
                <ContinueButton
                  theme={theme}
                  label={step.button_label || "Continuar"}
                  onClick={() => void submitLead()}
                  busy={busy}
                />
              </div>
            )}

            {step.type === "info_media" && !gatesVideo && (
              <ContinueButton
                theme={theme}
                label={step.button_label || "Continuar"}
                onClick={() => go(resolveNext(definition, step))}
              />
            )}

            {step.type === "offer" && (
              <div
                className="space-y-4 border p-4 sm:p-5"
                style={{
                  background: "rgba(255,255,255,.05)",
                  borderColor: "rgba(255,255,255,.12)",
                  borderRadius: theme.radius,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: theme.muted }}
                    >
                      {lead?.nome
                        ? `Recomendado para ${lead.nome.split(" ")[0]}`
                        : "Oferta exclusiva"}
                    </div>
                    <div
                      className="mt-1 text-lg font-bold leading-snug"
                      style={{ color: theme.text }}
                    >
                      {step.product_title || step.title}
                    </div>
                  </div>
                  {step.price_label ? (
                    <div
                      className="shrink-0 rounded-full px-3 py-1 font-mono text-sm font-bold"
                      style={{ background: `${theme.primary}22`, color: theme.primary }}
                    >
                      {step.price_label}
                    </div>
                  ) : null}
                </div>

                {step.testimonials && step.testimonials.length > 0 && (
                  <div className="space-y-2">
                    {step.testimonials.slice(0, 6).map((testimonial, index) => (
                      <figure
                        key={index}
                        className="rounded-xl p-3 text-xs"
                        style={{ background: "rgba(255,255,255,.05)", color: theme.muted }}
                      >
                        “{testimonial.text}”
                        <figcaption className="mt-1 font-semibold" style={{ color: theme.text }}>
                          {testimonial.name}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                {step.product_slug ? (
                  <ContinueButton
                    theme={theme}
                    label={step.cta_label || "Comprar agora"}
                    onClick={() => void finishOffer()}
                    busy={busy}
                    icon
                  />
                ) : (
                  <p className="text-xs" style={{ color: theme.muted }}>
                    Esta oferta ainda não tem um produto associado.
                  </p>
                )}
              </div>
            )}
          </div>

          {error ? (
            <p className="mt-3 text-xs font-semibold" style={{ color: "#f87171" }} role="alert">
              {error}
            </p>
          ) : null}
        </main>

        <footer
          className="mt-6 flex items-center justify-center gap-1.5 text-[10px]"
          style={{ color: theme.muted }}
        >
          <ShieldCheck className="h-3 w-3" />
          Quiz seguro · InfroPay
        </footer>
      </div>
    </div>
  );
}

function inputStyle(theme: QuizTheme): React.CSSProperties {
  return {
    background: "rgba(255,255,255,.06)",
    borderColor: "rgba(255,255,255,.14)",
    color: theme.text,
    borderRadius: theme.radius,
  };
}

function ContinueButton({
  theme,
  label,
  onClick,
  busy,
  icon,
}: {
  theme: QuizTheme;
  label: string;
  onClick: () => void;
  busy?: boolean;
  icon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="inline-flex h-12 w-full items-center justify-center gap-2 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[.99] disabled:opacity-70"
      style={{ background: theme.primary, borderRadius: theme.radius }}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <Check className="h-4 w-4" />
      ) : null}
      {label}
    </button>
  );
}

/** Mantido para compatibilidade com importações antigas de mídia. */
export function QuizMediaView({ media, radius }: { media: QuizMedia; radius: number }) {
  if (media.type === "video") {
    return <QuizVsl src={media.url} poster={media.poster} accent="#2563eb" radius={radius} />;
  }
  return (
    <img
      src={media.url}
      alt=""
      loading="lazy"
      className="w-full object-cover"
      style={{ borderRadius: radius }}
      referrerPolicy="no-referrer"
    />
  );
}
