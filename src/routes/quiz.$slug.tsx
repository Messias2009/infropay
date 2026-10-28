import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { QuizRenderer } from "@/components/quiz/QuizRenderer";
import { getPublicQuiz } from "@/lib/quizzes.functions";

export const Route = createFileRoute("/quiz/$slug" as any)({
  head: ({ params }) => ({
    meta: [
      { title: `Quiz - InfroPay` },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: PublicQuizPage,
});

function PublicQuizPage() {
  const { slug } = Route.useParams() as { slug: string };
  const getQuizFn = useServerFn(getPublicQuiz);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getQuizFn({ data: { slug } })
      .then((result) => {
        if (!result) {
          setError("Quiz não encontrado ou não publicado.");
          setLoading(false);
          return;
        }
        if (result.available === false) {
          setError(result.reason || "Quiz indisponível.");
          setLoading(false);
          return;
        }
        setQuiz(result);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [slug]);

  const handleComplete = (result: any) => {
    // Se tiver oferta com product_slug, redireciona para o checkout
    if (result.offer?.product_slug) {
      // Passar dados do lead como query params se existirem
      const params = new URLSearchParams();
      if (result.answers?.nome) params.set("nome", result.answers.nome);
      if (result.answers?.whatsapp) params.set("whatsapp", result.answers.whatsapp);
      if (result.answers?.email) params.set("email", result.answers.email);
      const queryString = params.toString();
      navigate({
        to: "/checkout/$slug",
        params: { slug: result.offer.product_slug },
        search: queryString ? Object.fromEntries(params) : undefined,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Quiz indisponível</h1>
          <p className="text-muted-foreground">{error || "Este quiz não está disponível."}</p>
        </div>
      </div>
    );
  }

  return (
    <QuizRenderer
      quiz={quiz.definition}
      onComplete={handleComplete}
    />
  );
}
