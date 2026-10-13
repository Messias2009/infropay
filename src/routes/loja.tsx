import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { listCategories, listPublishedProducts } from "@/lib/catalog.functions";
import { Sparkles } from "lucide-react";

const search = z.object({ cat: z.string().optional() });

export const Route = createFileRoute("/loja")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Loja — InfroPay" },
      {
        name: "description",
        content: "Explore cursos, ebooks, templates, mentorias e mais na loja InfroPay.",
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ cat: search.cat }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(catsOpt),
      context.queryClient.ensureQueryData(prodsOpt(deps.cat)),
    ]);
  },
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-sm text-destructive">{(error as Error).message}</div>
  ),
  notFoundComponent: () => <div className="p-10">Não encontrado.</div>,
  component: Loja,
});

const catsOpt = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const prodsOpt = (cat?: string) =>
  queryOptions({
    queryKey: ["products", "loja", cat ?? "all"],
    queryFn: () => listPublishedProducts({ data: { category: cat, limit: 60 } }),
  });

function Loja() {
  const { cat } = Route.useSearch();
  const { data: cats } = useSuspenseQuery(catsOpt);
  const { data: products } = useSuspenseQuery(prodsOpt(cat));
  const current = cats.find((c) => c.slug === cat);

  return (
    <SiteLayout>
      <section className="border-b border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">Loja</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold">
            {current?.name ?? "Todos os produtos"}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex gap-2 overflow-x-auto pb-4">
          <Link
            to="/loja"
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${!cat ? "gradient-brand text-primary-foreground border-transparent" : "border-border bg-card hover:bg-accent/40"}`}
          >
            Todos
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              to="/loja"
              search={{ cat: c.slug }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm border ${cat === c.slug ? "gradient-brand text-primary-foreground border-transparent" : "border-border bg-card hover:bg-accent/40"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
            <Sparkles className="h-10 w-10 text-gold mx-auto mb-3" />
            <h3 className="font-display text-xl font-semibold">Sem produtos nesta categoria.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Volte em breve ou explore outras categorias.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-2">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p as any} />
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
