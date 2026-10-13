import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, PlayCircle, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMyCourseTree,
  createModule,
  deleteModule,
  createLesson,
  deleteLesson,
} from "@/lib/members.functions";

export const Route = createFileRoute("/_authenticated/produtor/curso/$id")({
  head: () => ({
    meta: [{ title: "Área de membros — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: CursoEditor,
});

function CursoEditor() {
  const { id } = Route.useParams();
  const treeFn = useServerFn(getMyCourseTree);
  const addModuleFn = useServerFn(createModule);
  const delModuleFn = useServerFn(deleteModule);
  const addLessonFn = useServerFn(createLesson);
  const delLessonFn = useServerFn(deleteLesson);

  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["course-tree", id],
    queryFn: () => treeFn({ data: { product_id: id } }),
  });

  const [moduleTitle, setModuleTitle] = useState("");

  if (isLoading) return <div className="p-10 text-muted-foreground">A carregar...</div>;
  if (error) return <div className="p-10 text-destructive">{(error as Error).message}</div>;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <Link
        to="/produtor/produtos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos produtos
      </Link>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">
          Área de membros
        </div>
        <h1 className="font-display text-3xl font-bold mt-2">{data?.product?.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Organize o conteúdo em módulos e aulas. Os alunos com compra aprovada terão acesso
          automático.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <Label className="text-xs">Novo módulo</Label>
          <Input
            className="mt-1.5"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            placeholder="Módulo 1 — Fundamentos"
          />
        </div>
        <Button
          className="gradient-brand text-primary-foreground shadow-glow"
          disabled={moduleTitle.trim().length < 2}
          onClick={async () => {
            try {
              await addModuleFn({
                data: {
                  product_id: id,
                  title: moduleTitle.trim(),
                  description: null,
                  sort_order: data?.modules?.length ?? 0,
                },
              });
              setModuleTitle("");
              refetch();
              toast.success("Módulo criado");
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        >
          <FolderPlus className="h-4 w-4 mr-1" /> Adicionar módulo
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {!data?.modules?.length && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Ainda não há módulos. Comece por criar o primeiro.
          </div>
        )}
        {data?.modules?.map((m: any) => (
          <ModuleCard
            key={m.id}
            module={m}
            onDelete={async () => {
              await delModuleFn({ data: { id: m.id } });
              refetch();
            }}
            onAddLesson={async (payload) => {
              try {
                await addLessonFn({
                  data: { module_id: m.id, sort_order: m.lessons.length, ...payload },
                });
                refetch();
                toast.success("Aula adicionada");
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            onDeleteLesson={async (lessonId) => {
              await delLessonFn({ data: { id: lessonId } });
              refetch();
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  module: m,
  onDelete,
  onAddLesson,
  onDeleteLesson,
}: {
  module: any;
  onDelete: () => Promise<void>;
  onAddLesson: (p: {
    title: string;
    description: null;
    video_url: string | null;
    attachment_url: null;
    duration_minutes: number | null;
    is_free: boolean;
  }) => Promise<void>;
  onDeleteLesson: (id: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [video, setVideo] = useState("");
  const [minutes, setMinutes] = useState("");

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <h3 className="font-display font-semibold flex-1">{m.title}</h3>
        <span className="text-xs text-muted-foreground">{m.lessons.length} aulas</span>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="divide-y divide-border">
        {m.lessons.map((l: any) => (
          <div key={l.id} className="px-5 py-3 flex items-center gap-3">
            <PlayCircle className="h-4 w-4 text-primary-glow shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm truncate">{l.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {l.duration_minutes ? `${l.duration_minutes} min` : "sem duração"} ·{" "}
                {l.video_url ? "vídeo" : "sem vídeo"}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onDeleteLesson(l.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-border grid gap-3 sm:grid-cols-4 items-end bg-background/40">
        <div className="sm:col-span-2">
          <Label className="text-xs">Título da aula</Label>
          <Input
            className="mt-1.5"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Aula 1 — Introdução"
          />
        </div>
        <div>
          <Label className="text-xs">Link do vídeo</Label>
          <Input
            className="mt-1.5"
            value={video}
            onChange={(e) => setVideo(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Min.</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </div>
          <Button
            className="self-end"
            disabled={title.trim().length < 2}
            onClick={async () => {
              await onAddLesson({
                title: title.trim(),
                description: null,
                video_url: video || null,
                attachment_url: null,
                duration_minutes: minutes ? Number(minutes) : null,
                is_free: false,
              });
              setTitle("");
              setVideo("");
              setMinutes("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
