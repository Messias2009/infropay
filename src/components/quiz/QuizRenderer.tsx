import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import {
  getStep,
  progressOf,
  resolveNext,
  themeOf,
  type QuizAnswers,
  type QuizDefinition,
  type QuizOption,
  type QuizStep,
} from "@/lib/quiz-schema";

export type QuizResult = {
  answers: QuizAnswers;
  score: number;
  tags: string[];
  lastStepId: string;
  offer?: { product_slug: string; cta_label: string } | null;
};

type Props = {
  quiz: QuizDefinition;
  /** Etapa inicial (por omissão, `start_step_id` do quiz). */
  startStepId?: string;
  /** Chamado quando o visitante chega à tela de oferta e carrega no CTA. */
  onComplete?: (result: QuizResult) => void;
  /** Chamado quando o visitante preenche a captura de lead. */
  onLead?: (lead: { nome: string; whatsapp: string; tags: string[]; score: number }) => void;
  /** Avanço de etapa (resposta, avanço, abandono) — usado pelo analytics. */
  onStep?: (info: {
    stepId: string;
    type: "visualizacao" | "resposta" | "avanco";
    value?: string;
  }) => void;
  /** Modo de demonstração: não emite eventos nem navega para fora. */
  preview?: boolean;
};

const FONTS: Record<string, string> = {
  inter: "'Inter', system-ui, sans-serif",
  display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
  system: "system-ui, -apple-system, sans-serif",
};

/**
 * Renderizador da página do quiz: uma pergunta por ecrã, barra de
 * progresso, transições suaves e lógica condicional por opção
 * (próxima etapa + pontuação/tags). Mobile-first e leve: vídeos só
 * carregam quando o visitante chega à etapa, imagens em lazy-load.
 */
export function QuizRenderer({ quiz, startStepId, onComplete, onLead, onStep, preview }: Props) {
  const theme = useMemo(() => themeOf(quiz), [quiz]);
  const initial = startStepId || quiz.start_step_id || quiz.steps[0]?.id || "";
  const [history, setHistory] = useState<string[]>([initial]);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [score, setScore] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [lead, setLead] = useState({ nome: "", whatsapp: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [textValue, setTextValue] = useState("");

  const currentId = history[history.length - 1];
  const step = getStep(quiz, currentId);
  const progress = progressOf(quiz, currentId);

  useEffect(() => {
    if (step) onStep?.({ stepId: step.id, type: "visualizacao" });
    setTextValue("");
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  if (!step) {
    return (
      <div
        className="min-h-[60vh] grid place-items-center p-6 text-center"
        style={{ background: theme.background, color: theme.text, fontFamily: FONTS[theme.font] }}
      >
        <div>
          <div className="font-semibold">Este quiz não está disponível.</div>
          <p className="text-sm mt-1" style={{ color: theme.muted }}>
            Volte mais tarde.
          </p>
        </div>
      </div>
    );
  }

  const go = (nextId: string | null) => {
    if (!nextId) return;
    setHistory((h) => [...h, nextId]);
  };

  const applyOption = (option: QuizOption) => {
    const points = option.score ?? 0;
    const newTags = option.tags ?? [];
    setAnswers((a) => ({ ...a, [step.id]: option.label }));
    if (points) setScore((s) => s + points);
    if (newTags.length) setTags((t) => Array.from(new Set([...t, ...newTags])));
    onStep?.({ stepId: step.id, type: "resposta", value: option.label });
    onStep?.({ stepId: step.id, type: "avanco", value: option.id });
    go(resolveNext(quiz, step, option));
  };

  const submitText = () => {
    if (step.type !== "text_input") return;
    if (step.required !== false && !textValue.trim()) {
      setError("Escreva uma resposta para continuar.");
      return;
    }
    const field = step.field || step.id;
    setAnswers((a) => ({ ...a, [field]: textValue.trim() }));
    onStep?.({ stepId: step.id, type: "resposta", value: textValue.trim() });
    go(resolveNext(quiz, step));
  };

  const submitLead = () => {
    if (step.type !== "lead_capture") return;
    if (!lead.nome.trim()) {
      setError("Diga-nos o seu nome.");
      return;
    }
    if (lead.whatsapp.replace(/\D/g, "").length < 9) {
      setError("Indique um WhatsApp válido (mínimo 9 dígitos).");
      return;
    }
    setAnswers((a) => ({ ...a, nome: lead.nome.trim(), whatsapp: lead.whatsapp.trim() }));
    onLead?.({ nome: lead.nome.trim(), whatsapp: lead.whatsapp.trim(), tags, score });
    onStep?.({ stepId: step.id, type: "resposta", value: lead.whatsapp.trim() });
    go(resolveNext(quiz, step));
  };

  const finishOffer = () => {
    if (step.type !== "offer") return;
    const payload: QuizResult = {
      answers,
      score,
      tags,
      lastStepId: step.id,
      offer: { product_slug: step.product_slug, cta_label: step.cta_label || "Comprar agora" },
    };
    setBusy(true);
    onComplete?.(payload);
    setTimeout(() => setBusy(false), 600);
  };

  const canGoBack = history.length > 1;
  const goBack = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));

  const style = {
    background: `linear-gradient(180deg, ${theme.surface} 0%, ${theme.background} 60%)`,
    color: theme.text,
    fontFamily: FONTS[theme.font] ?? FONTS.inter,
  } as React.CSSProperties;

  return (
    <div
      className="min-h-[100dvh] w-full"
      style={{ ...style, ["--q-primary" as string]: theme.primary }}
    >
      <div className="mx-auto w-full max-w-lg px-4 py-5 sm:py-8 flex flex-col min-h-[100dvh]">
        {/* Cabeçalho: logótipo + barra de progresso */}
        <div className="flex items-center gap-3 mb-4">
          {theme.logo_url ? (
            <img
              src={theme.logo_url}
              alt=""
              className="h-8 w-8 rounded-lg object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className="flex-1 min-w-0">
            {theme.show_progress && (
              <div
                className="h-2 w-full rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,.12)" }}
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.round(progress * 100)}%`, background: theme.primary }}
                />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            aria-label="Voltar"
            className="h-8 w-8 grid place-items-center rounded-full transition disabled:opacity-30"
            style={{ background: "rgba(255,255,255,.08)", color: theme.text }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo da etapa — uma pergunta por ecrã */}
        <div key={step.id} className="flex-1 animate-fade-in">
          <StepView
            step={step}
            theme={theme}
            textValue={textValue}
            setTextValue={setTextValue}
            lead={lead}
            setLead={setLead}
            error={error}
            onOption={applyOption}
            onText={submitText}
            onLead={submitLead}
            onOffer={finishOffer}
            busy={busy}
          />
        </div>
      </div>
    </div>
  );
}

function StepView({
  step,
  theme,
  textValue,
  setTextValue,
  lead,
  setLead,
  error,
  onOption,
  onText,
  onLead,
  onOffer,
  busy,
}: {
  step: QuizStep;
  theme: ReturnType<typeof themeOf>;
  textValue: string;
  setTextValue: (v: string) => void;
  lead: { nome: string; whatsapp: string };
  setLead: (v: { nome: string; whatsapp: string }) => void;
  error: string | null;
  onOption: (o: QuizOption) => void;
  onText: () => void;
  onLead: () => void;
  onOffer: () => void;
  busy: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,.06)",
    borderColor: "rgba(255,255,255,.14)",
    color: theme.text,
    borderRadius: theme.radius,
  };

  return (
    <div className="flex flex-col gap-4">
      {step.media?.url && <Media media={step.media} radius={theme.radius} />}

      <div>
        <h1 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: theme.text }}>
          {step.title}
        </h1>
        {"description" in step && step.description ? (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.muted }}>
            {step.description}
          </p>
        ) : null}
      </div>

      {step.type === "multi_choice" || step.type === "yes_no" ? (
        <div
          className={`grid gap-2.5 ${step.options.some((o) => o.image_url) ? "grid-cols-2" : "grid-cols-1"}`}
        >
          {step.options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onOption(o)}
              className="group text-left rounded-2xl border p-3.5 sm:p-4 transition active:scale-[.99] hover:border-[var(--q-primary)]"
              style={{
                background: "rgba(255,255,255,.05)",
                borderColor: "rgba(255,255,255,.12)",
                borderRadius: theme.radius,
              }}
            >
              {o.image_url && (
                <img
                  src={o.image_url}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover rounded-xl mb-2.5"
                  referrerPolicy="no-referrer"
                />
              )}
              <span
                className="text-sm font-semibold flex items-center justify-between gap-2"
                style={{ color: theme.text }}
              >
                {o.label}
                <ArrowRight
                  className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition"
                  style={{ color: theme.primary }}
                />
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {step.type === "text_input" ? (
        <div className="space-y-3">
          <input
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onText()}
            placeholder={step.placeholder || "Escreva a sua resposta"}
            className="w-full h-12 px-4 text-sm border outline-none focus:border-[var(--q-primary)] transition"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={onText}
            className="w-full h-12 rounded-xl text-sm font-bold text-white transition active:scale-[.99]"
            style={{ background: theme.primary, borderRadius: theme.radius }}
          >
            {step.button_label || "Continuar"}
          </button>
        </div>
      ) : null}

      {step.type === "lead_capture" ? (
        <div className="space-y-3">
          <input
            value={lead.nome}
            onChange={(e) => setLead({ ...lead, nome: e.target.value })}
            placeholder="O seu nome"
            className="w-full h-12 px-4 text-sm border outline-none focus:border-[var(--q-primary)] transition"
            style={inputStyle}
          />
          <input
            value={lead.whatsapp}
            onChange={(e) => setLead({ ...lead, whatsapp: e.target.value })}
            inputMode="tel"
            placeholder="WhatsApp (ex.: 923 000 000)"
            className="w-full h-12 px-4 text-sm border outline-none focus:border-[var(--q-primary)] transition"
            style={inputStyle}
          />
          {"note" in step && step.note ? (
            <p className="text-xs" style={{ color: theme.muted }}>
              {step.note}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onLead}
            className="w-full h-12 rounded-xl text-sm font-bold text-white transition active:scale-[.99]"
            style={{ background: theme.primary, borderRadius: theme.radius }}
          >
            {step.button_label || "Continuar"}
          </button>
        </div>
      ) : null}

      {step.type === "info_media" ? (
        <button
          type="button"
          onClick={onText}
          className="w-full h-12 rounded-xl text-sm font-bold text-white transition active:scale-[.99] mt-2"
          style={{ background: theme.primary, borderRadius: theme.radius }}
        >
          {step.button_label || "Continuar"}
        </button>
      ) : null}

      {step.type === "offer" ? (
        <div
          className="rounded-2xl border p-4 space-y-4"
          style={{
            background: "rgba(255,255,255,.05)",
            borderColor: "rgba(255,255,255,.12)",
            borderRadius: theme.radius,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest" style={{ color: theme.muted }}>
                Oferta exclusiva
              </div>
              <div className="font-bold text-lg leading-snug" style={{ color: theme.text }}>
                {step.product_title || step.title}
              </div>
            </div>
            {step.price_label ? (
              <div
                className="font-mono font-bold text-lg shrink-0"
                style={{ color: theme.primary }}
              >
                {step.price_label}
              </div>
            ) : null}
          </div>

          {step.testimonials && step.testimonials.length > 0 && (
            <div className="space-y-2">
              {step.testimonials.map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 text-xs"
                  style={{ background: "rgba(255,255,255,.05)", color: theme.muted }}
                >
                  “{t.text}”
                  <div className="mt-1 font-semibold" style={{ color: theme.text }}>
                    {t.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onOffer}
            disabled={busy}
            className="w-full h-12 rounded-xl text-sm font-bold text-white transition active:scale-[.99] inline-flex items-center justify-center gap-2"
            style={{ background: theme.primary, borderRadius: theme.radius }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {step.cta_label || "Comprar agora"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-xs font-medium" style={{ color: "#f87171" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Imagem em lazy-load; vídeo só carrega na etapa (lazy + sem pré-carregamento). */
function Media({
  media,
  radius,
}: {
  media: { type: string; url: string; poster?: string | null };
  radius: number;
}) {
  if (media.type === "video") {
    return (
      <div className="overflow-hidden" style={{ borderRadius: radius }}>
        <video
          src={media.url}
          poster={media.poster || undefined}
          controls
          playsInline
          preload="none"
          className="w-full aspect-video bg-black object-cover"
        />
      </div>
    );
  }
  return (
    <img
      src={media.url}
      alt=""
      loading="lazy"
      decoding="async"
      className="w-full aspect-[16/10] object-cover"
      style={{ borderRadius: radius }}
      referrerPolicy="no-referrer"
    />
  );
}
