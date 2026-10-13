import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { GraduationCap, BookOpen, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMyEnrollments, claimMyEnrollments } from "@/lib/members.functions";

export const Route = createFileRoute("/_authenticated/membros/")({
  head: () => ({
    meta: [
      { title: "Área de membros — InfroPay" },
      { name: "description", content: "Acesse os cursos e conteúdos que comprou na InfroPay." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MembrosIndex,
});

function MembrosIndex() {
  const listFn = useServerFn(listMyEnrollments);
  const claimFn = useServerFn(claimMyEnrollments);
  const { data, refetch } = useQuery({ queryKey: ["my-enrollments"], queryFn: () => listFn() });

  useEffect(() => {
    claimFn()
      .then(() => refetch())
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-6xl mx-auto">
      <div className="text-xs uppercase tracking-widest text-gold font-semibold">Aluno</div>
      <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Minha área de membros</h1>
      <p className="text-muted-foreground mt-2">
        Todos os cursos e conteúdos que você comprou, num só lugar.
      </p>

      {!data?.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
          <GraduationCap className="h-12 w-12 text-gold mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold">Nenhum curso ainda</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Compre um produto com área de membros para começar a estudar.
          </p>
          <Link to="/loja">
            <Button className="mt-5 gradient-brand text-primary-foreground shadow-glow">
              Explorar a loja
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((e: any) => (
            <Link
              key={e.id}
              to="/membros/$slug"
              params={{ slug: e.product.slug }}
              className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition"
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-gold/10">
                {e.product.cover_url && (
                  <img
                    src={e.product.cover_url}
                    alt={e.product.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold group-hover:text-primary-glow transition">
                  {e.product.title}
                </h3>
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full gradient-brand"
                    style={{ width: `${e.progress_percent ?? 0}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {e.progress_percent ?? 0}% concluído
                  </span>
                  {e.certificate_issued && (
                    <span className="inline-flex items-center gap-1 text-gold">
                      <Award className="h-3.5 w-3.5" />
                      Certificado
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
