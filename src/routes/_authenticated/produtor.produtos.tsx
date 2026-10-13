import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Plus,
  Package,
  Pencil,
  Send,
  Eye,
  ShoppingCart,
  Link2,
  QrCode,
  Share2,
  Trash2,
  Copy as CopyIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductActions } from "@/components/products/ProductActions";
import { QrDialog } from "@/components/products/QrDialog";
import {
  listMyProducts,
  submitProductForApproval,
  duplicateProduct,
  deleteProduct,
} from "@/lib/products.functions";
import { productLinks, copy, shareLink } from "@/lib/product-links";

export const Route = createFileRoute("/_authenticated/produtor/produtos")({
  component: MeusProdutos,
});

function fmt(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

const BADGE: Record<string, string> = {
  publicado: "bg-success/15 text-success",
  em_analise: "bg-gold/15 text-gold",
  rascunho: "bg-muted text-muted-foreground",
  pausado: "bg-warning/15 text-warning",
};
const LABEL: Record<string, string> = {
  publicado: "Publicado",
  em_analise: "Em análise",
  rascunho: "Rascunho",
  pausado: "Pausado",
};

function MeusProdutos() {
  const router = useRouter();
  const fn = useServerFn(listMyProducts);
  const submitFn = useServerFn(submitProductForApproval);
  const dupFn = useServerFn(duplicateProduct);
  const delFn = useServerFn(deleteProduct);
  const { data: products, refetch } = useQuery({
    queryKey: ["producer", "products"],
    queryFn: () => fn(),
  });
  const [qr, setQr] = useState<{ url: string; title: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function submitOne(id: string) {
    setBusy(id);
    try {
      await submitFn({ data: { id } });
      toast.success("Produto publicado!");
      await refetch();
      router.navigate({ to: "/produtor/sucesso/$id", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function dup(id: string) {
    try {
      await dupFn({ data: { id } });
      toast.success("Produto duplicado como rascunho");
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function del(id: string) {
    if (!confirm("Excluir este produto definitivamente?")) return;
    try {
      await delFn({ data: { id } });
      toast.success("Produto excluído");
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function doCopy(url: string, label: string) {
    if (await copy(url)) toast.success(`${label} copiado`);
    else toast.error("Não foi possível copiar");
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 mb-8 sm:flex sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-gold font-semibold">Catálogo</div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2">
            Os meus produtos
          </h1>
        </div>
        <Link to="/produtor/novo" className="shrink-0">
          <Button className="gradient-brand text-primary-foreground shadow-glow">
            <Plus className="h-4 w-4 mr-1" />
            Novo produto
          </Button>
        </Link>
      </div>

      {!products || products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
          <Package className="h-12 w-12 text-gold mx-auto mb-3" />
          <h3 className="font-display text-xl font-semibold">Sem produtos ainda</h3>
          <Link to="/produtor/novo" className="inline-block mt-4">
            <Button className="gradient-brand text-primary-foreground">
              Criar primeiro produto
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => {
            const links = productLinks(p.slug);
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/60 hover:shadow-glow transition"
              >
                <Link to="/produtor/editar/$id" params={{ id: p.id }} className="block">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-gold/10 relative">
                    {p.cover_url && (
                      <img
                        src={p.cover_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${BADGE[p.status] ?? BADGE.rascunho}`}
                      >
                        {LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2">{p.title}</h3>
                    {p.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">
                        Bloqueado: {p.rejection_reason}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="font-bold text-gradient-gold">
                        {fmt(p.promo_price_cents ?? p.price_cents, p.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.sales_count} vendas · {p.views_count} views
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Ações rápidas em linha */}
                <div className="px-4 flex flex-wrap gap-1.5">
                  <IconBtn label="Visualizar produto" href={links.product} icon={Eye} />
                  <IconBtn label="Abrir checkout" href={links.checkout} icon={ShoppingCart} />
                  <IconBtn
                    label="Copiar link do produto"
                    icon={Link2}
                    onClick={() => doCopy(links.product, "Link do produto")}
                  />
                  <IconBtn
                    label="Copiar link do checkout"
                    icon={CopyIcon}
                    onClick={() => doCopy(links.checkout, "Link do checkout")}
                  />
                  <IconBtn
                    label="Partilhar"
                    icon={Share2}
                    onClick={async () => {
                      const r = await shareLink(p.title, links.share);
                      if (r === "copied") toast.success("Link copiado para partilhar");
                      if (r === "failed") toast.error("Partilha não disponível");
                    }}
                  />
                  <IconBtn
                    label="QR Code"
                    icon={QrCode}
                    onClick={() => setQr({ url: links.product, title: "QR Code do produto" })}
                  />
                  <IconBtn label="Excluir" icon={Trash2} destructive onClick={() => del(p.id)} />
                </div>

                <div className="p-4 flex gap-2 flex-wrap">
                  <Link to="/produtor/editar/$id" params={{ id: p.id }} className="flex-1 min-w-24">
                    <Button size="sm" variant="outline" className="w-full">
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  {(p.status === "rascunho" || p.status === "pausado") && (
                    <Button
                      size="sm"
                      disabled={busy === p.id}
                      onClick={() => submitOne(p.id)}
                      className="gradient-brand text-primary-foreground"
                    >
                      <Send className="h-3.5 w-3.5 mr-1" />
                      {busy === p.id ? "A publicar..." : "Publicar"}
                    </Button>
                  )}
                  <ProductActions product={p} onDuplicate={dup} onDelete={del} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QrDialog
        open={!!qr}
        onOpenChange={(v) => !v && setQr(null)}
        url={qr?.url ?? ""}
        title={qr?.title ?? ""}
      />
    </div>
  );
}

function IconBtn({
  label,
  icon: I,
  onClick,
  href,
  destructive,
}: {
  label: string;
  icon: typeof Eye;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
}) {
  const cls = `grid h-8 w-8 place-items-center rounded-lg border border-border transition hover:border-primary/60 ${destructive ? "text-destructive hover:border-destructive/60" : "text-muted-foreground hover:text-foreground"}`;
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        title={label}
        aria-label={label}
        className={cls}
      >
        <I className="h-3.5 w-3.5" />
      </a>
    );
  }
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={cls}>
      <I className="h-3.5 w-3.5" />
    </button>
  );
}
