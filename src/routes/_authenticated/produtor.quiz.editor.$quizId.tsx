import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Eye, Loader2, Save, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMyQuiz, saveQuiz, setQuizStatus } from "@/lib/quizzes.functions";
import { QuizEditor } from "@/components/quiz/QuizEditor";

export const Route = createFileRoute("/_authenticated/produtor/quiz/editor/$quizId")({
  head: () => ({
    meta: [{ title: "Editor de Quiz — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: QuizEditorPage,
});

function QuizEditorPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getQuizFn = useServerFn(getMyQuiz);
  const saveQuizFn = useServerFn(saveQuiz);
  const setStatusFn = useServerFn(setQuizStatus);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["my-quiz", quizId],
    queryFn: () => getQuizFn({ data: { id: quizId } }),
  });

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function save(definition: any, title?: string) {
    setSaving(true);
    try {
      await saveQuizFn({ data: { id: quizId, definition, title } });
      toast.success("Quiz guardado");
      queryClient.invalidateQueries({ queryKey: ["my-quiz", quizId] });
      queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      await setStatusFn({ data: { id: quizId, status: "publicado" } });
      toast.success("Quiz publicado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["my-quiz", quizId] });
      queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish() {
    setPublishing(true);
    try {
      await setStatusFn({ data: { id: quizId, status: "rascunho" } });
      toast.success("Quiz voltou a rascunho");
      queryClient.invalidateQueries({ queryKey: ["my-quiz", quizId] });
      queryClient.invalidateQueries({ queryKey: ["my-quizzes"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Quiz não encontrado</p>
        <Link to="/produtor/quiz">
          <Button variant="outline" className="mt-4">
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/produtor/quiz">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="font-semibold truncate max-w-[200px] sm:max-w-none">
                {quiz.title}
              </span>
              <span
                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  quiz.status === "publicado"
                    ? "border-success/40 text-success bg-success/10"
                    : "border-border text-muted-foreground"
                }`}
              >
                {quiz.status === "publicado" ? "Publicado" : "Rascunho"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/quiz/preview">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Pré-visualizar
              </Button>
            </Link>
            {quiz.status === "publicado" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={unpublish}
                disabled={publishing}
              >
                {publishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Despublicar
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={publish}
                disabled={publishing}
                className="gradient-brand text-primary-foreground"
              >
                {publishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            )}
          </div>
        </div>
      </header>
      <QuizEditor quiz={quiz} onSave={save} saving={saving} />
    </div>
  );
}
