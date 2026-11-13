import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { QuizRenderer, type QuizLead, type QuizResult } from "@/components/quiz/QuizRenderer";
import { getPublicQuiz } from "@/lib/quizzes.functions";
import {
  captureQuizLead,
  completeQuizSession,
  startQuizSession,
  trackQuizStep,
} from "@/lib/quiz-public.functions";
import { stashQuizLead, visitorId } from "@/lib/quiz-links";
import type { QuizDefinition } from "@/lib/quiz-schema";

type PublicQuiz = {
  available: true;
  id: string;
  slug: string;
  title: string;
  definition: QuizDefinition;
};

export const Route = createFileRoute("/quiz/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Quiz — ${params.slug.replace(/-/g, " ")} | InfroPay` },
      {
        name: "description",
        content: "Responda a algumas perguntas e descubra a recomendação certa para si.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PublicQuizPage,
});

function PublicQuizPage() {
  const { slug } = Route.useParams() as { slug: string };
  const navigate = useNavigate();
  const getQuizFn = useServerFn(getPublicQuiz);
  const startSessionFn = useServerFn(startQuizSession);
  const trackFn = useServerFn(trackQuizStep);
  const leadFn = useServerFn(captureQuizLead);
  const completeFn = useServerFn(completeQuizSession);

  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const sessionId = useRef<string | null>(null);
  const stepId = useRef<string | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    getQuizFn({ data: { slug } })
      .then((result) => {
        if (!alive) return;
        if (!result) {
          setError("Este quiz não existe ou ainda não foi publicado.");
          return;
        }
        if (result.available === false) {
          setError(result.reason || "Quiz indisponível.");
          return;
        }
        setQuiz(result as PublicQuiz);
        if (typeof document !== "undefined") {
          document.title = `${result.title} — InfroPay`;
        }
      })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [slug, attempt]);

  // Abre/retoma a sessão do visitante assim que o quiz carrega.
  useEffect(() => {
    if (!quiz) return;
    const params = new URLSearchParams(window.location.search);
    sessionId.current = null;
    startSessionFn({
      data: {
        slug: quiz.slug,
        visitor_id: visitorId(),
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
      },
    })
      .then((result) => {
        if (result.ok) sessionId.current = result.session_id;
      })
      .catch(() => {
        /* analytics é opcional: o quiz continua a funcionar */
      });
  }, [quiz, slug, startSessionFn]);

  const onStep = useCallback(
    (info: {
      stepId: string;
      type: "visualizacao" | "resposta" | "avanco" | "oferta";
      value?: string;
    }) => {
      stepId.current = info.stepId;
      if (!sessionId.current) return;
      void trackFn({
        data: {
          slug,
          session_id: sessionId.current,
          step_id: info.stepId,
          type: info.type,
          value: info.value ?? null,
        },
      }).catch(() => {});
    },
    [slug, trackFn],
  );

  const onLead = useCallback(
    async (lead: QuizLead) => {
      if (!sessionId.current) return; // sem sessão (migração pendente) não bloqueia
      const result = await leadFn({
        data: {
          slug,
          session_id: sessionId.current,
          step_id: stepId.current,
          nome: lead.nome,
          whatsapp: lead.whatsapp,
          tags: lead.tags,
          score: lead.score,
        },
      });
      // Guardar o lead é importante mas nunca deve bloquear o funil: se a
      // escrita falhar (ex.: migração pendente), o visitante continua e os
      // dados são-lhe pedidos de novo no checkout.
      if (!result.ok) console.warn("[quiz] lead não guardado:", result.reason ?? "desconhecido");
    },
    [leadFn, slug],
  );

  const onComplete = useCallback(
    async (result: QuizResult) => {
      if (finished.current) return;
      finished.current = true;
      const offerSlug = result.offer?.product_slug ?? null;

      if (sessionId.current) {
        void completeFn({
          data: {
            slug,
            session_id: sessionId.current,
            score: result.score,
            tags: result.tags,
            offer_slug: offerSlug,
          },
        }).catch(() => {});
      }

      // O lead segue para o checkout por sessionStorage — nunca no URL.
      if (result.lead) {
        stashQuizLead({
          nome: result.lead.nome,
          whatsapp: result.lead.whatsapp,
          product_slug: offerSlug,
          quiz_slug: slug,
        });
      }

      if (offerSlug) {
        navigate({ to: "/checkout/$slug", params: { slug: offerSlug } });
      } else {
        finished.current = false;
      }
    },
    [completeFn, navigate, slug],
  );

  if (loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#0b1020]">
        <div className="flex flex-col items-center gap-3 text-sm text-white/60">
          <Loader2 className="h-7 w-7 animate-spin" />A preparar o seu quiz…
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#0b1020] p-6">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
          <h1 className="text-xl font-bold">Quiz indisponível</h1>
          <p className="text-sm text-white/60">{error ?? "Este quiz não está disponível."}</p>
          {error && /indisponível|não existe|publicado/i.test(error) ? null : (
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold transition hover:bg-white/15"
            >
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          )}
          <p className="text-[11px] text-white/40">InfroPay · Quiz Funnel</p>
        </div>
      </div>
    );
  }

  return (
    <QuizRenderer quiz={quiz.definition} onStep={onStep} onLead={onLead} onComplete={onComplete} />
  );
}
