import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Circle, Award, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyCourse, setLessonProgress } from "@/lib/members.functions";

export const Route = createFileRoute("/_authenticated/membros/$slug")({
  head: () => ({
    meta: [{ title: "Assistir — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: CursoAluno,
});

function embedUrl(url: string) {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function CursoAluno() {
  const { slug } = Route.useParams();
  const courseFn = useServerFn(getMyCourse);
  const progressFn = useServerFn(setLessonProgress);
  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["course", slug],
    queryFn: () => courseFn({ data: { slug } }),
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  const lessons = useMemo(
    () =>
      (data?.modules ?? []).flatMap((m: any) =>
        m.lessons.map((l: any) => ({ ...l, moduleTitle: m.title })),
      ),
    [data],
  );
  const active = lessons.find((l: any) => l.id === activeId) ?? lessons[0];

  if (isLoading) return <div className="p-10 text-muted-foreground">A carregar...</div>;
  if (error) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center">
        <h1 className="font-display text-2xl font-bold">Sem acesso</h1>
        <p className="text-sm text-muted-foreground mt-2">{(error as Error).message}</p>
        <Link to="/membros">
          <Button className="mt-5" variant="outline">
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const embed = active?.video_url ? embedUrl(active.video_url) : null;

  return (
    <div className="min-h-screen">
      <div className="border-b border-border px-4 md:px-8 h-14 flex items-center gap-3">
        <Link
          to="/membros"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Meus cursos
        </Link>
        <div className="ml-auto text-xs text-muted-foreground">
          {data?.enrollment?.progress_percent ?? 0}% concluído
          {data?.enrollment?.certificate_issued && (
            <span className="ml-2 inline-flex items-center gap-1 text-gold">
              <Award className="h-3.5 w-3.5" />
              Certificado emitido
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px]">
        <div className="p-4 md:p-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">{data?.product?.title}</h1>
          {!active ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Este curso ainda não tem aulas publicadas.
            </p>
          ) : (
            <>
              <div className="mt-5 rounded-2xl overflow-hidden border border-border bg-card aspect-video">
                {embed ? (
                  <iframe
                    src={embed}
                    title={active.title}
                    allowFullScreen
                    className="h-full w-full"
                  />
                ) : active.video_url ? (
                  <video src={active.video_url} controls className="h-full w-full" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">
                    Aula sem vídeo
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {active.moduleTitle}
                  </div>
                  <h2 className="font-display text-xl font-semibold mt-1">{active.title}</h2>
                  {active.description && (
                    <p className="text-sm text-muted-foreground mt-2">{active.description}</p>
                  )}
                </div>
                <Button
                  className={
                    active.completed ? "" : "gradient-brand text-primary-foreground shadow-glow"
                  }
                  variant={active.completed ? "outline" : "default"}
                  onClick={async () => {
                    try {
                      const r = await progressFn({
                        data: {
                          lesson_id: active.id,
                          product_id: data!.product.id,
                          completed: !active.completed,
                        },
                      });
                      refetch();
                      if (r.progress_percent === 100)
                        toast.success("Curso concluído! Certificado emitido 🎉");
                    } catch (e) {
                      toast.error((e as Error).message);
                    }
                  }}
                >
                  {active.completed ? "Marcar como não concluída" : "Marcar como concluída"}
                </Button>
              </div>
            </>
          )}
        </div>

        <aside className="border-t lg:border-t-0 lg:border-l border-border bg-card/40">
          {data?.modules?.map((m: any) => (
            <div key={m.id}>
              <div className="px-5 py-3 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                {m.title}
              </div>
              {m.lessons.map((l: any) => (
                <button
                  key={l.id}
                  onClick={() => setActiveId(l.id)}
                  className={`w-full text-left px-5 py-3 flex items-center gap-3 border-b border-border/60 text-sm transition ${active?.id === l.id ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent/30"}`}
                >
                  {l.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{l.title}</span>
                  {l.duration_minutes ? (
                    <span className="text-xs">{l.duration_minutes}m</span>
                  ) : (
                    <PlayCircle className="h-3.5 w-3.5" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
