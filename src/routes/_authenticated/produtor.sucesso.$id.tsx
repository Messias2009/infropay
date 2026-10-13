import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  PartyPopper,
  Eye,
  ShoppingCart,
  Link2,
  CreditCard,
  Share2,
  QrCode,
  Pencil,
  BarChart3,
  Wallet,
  Users,
  CheckCircle2,
  Copy,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrDialog } from "@/components/products/QrDialog";
import { getMyProduct } from "@/lib/products.functions";
import { productLinks, copy, shareLink } from "@/lib/product-links";

export const Route = createFileRoute("/_authenticated/produtor/sucesso/$id")({
  component: Sucesso,
});

function kz(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function Sucesso() {
  const { id } = Route.useParams();
  const router = useRouter();
  const fn = useServerFn(getMyProduct);
  const { data: p, isPending } = useQuery({
    queryKey: ["producer", "product", id],
    queryFn: () => fn({ data: { id } }),
  });
  const [qr, setQr] = useState<{ url: string; title: string } | null>(null);

  if (isPending) {
    return (
      <div className="p-6 md:p-10">
        <div className="h-64 max-w-3xl animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }
  if (!p) {
    return (
      <div className="p-6 md:p-10">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Link to="/produtor/produtos" className="mt-4 inline-block">
          <Button>Voltar aos produtos</Button>
        </Link>
      </div>
    );
  }

  const links = productLinks(p.slug);
  const published = p.status === "publicado";

  async function doCopy(url: string, label: string) {
    if (await copy(url)) toast.success(`${label} copiado`);
    else toast.error("Não foi possível copiar");
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto">
      {/* Cabeçalho de sucesso */}
      <div className="relative overflow-hidden rounded-3xl border border-success/30 bg-card p-6 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full gradient-brand opacity-20 blur-3xl animate-glow-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full gradient-gold opacity-15 blur-3xl animate-floaty" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />{" "}
            {published ? "Publicado e aprovado automaticamente" : "Guardado como rascunho"}
          </div>
          <h1 className="font-display mt-4 flex items-center gap-3 text-2xl font-bold sm:text-3xl md:text-4xl">
            <PartyPopper className="h-7 w-7 shrink-0 text-gold" />
            {published ? "Produto publicado com sucesso!" : "Produto criado com sucesso!"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {published
              ? "Já pode vender agora mesmo: partilhe o link, abra o checkout ou gere um QR Code."
              : "Publique quando estiver pronto — a validação é automática e instantânea."}
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="mt-6 grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-gold/10 sm:w-40">
          {p.cover_url ? (
            <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">
              Sem capa
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-display truncate text-xl font-semibold">{p.title}</h2>
          {p.short_description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.short_description}</p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Meta label="Preço" value={kz(p.promo_price_cents ?? p.price_cents, p.currency)} />
            <Meta label="Estado" value={published ? "Publicado" : "Rascunho"} />
            <Meta
              label="Publicação"
              value={new Date(p.updated_at ?? p.created_at).toLocaleDateString("pt-PT")}
            />
          </div>
        </div>
      </div>

      {/* Links automáticos */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold">Links gerados automaticamente</h3>
        <div className="mt-4 space-y-3">
          <LinkRow
            label="Página do produto"
            url={links.product}
            onCopy={() => doCopy(links.product, "Link do produto")}
          />
          <LinkRow
            label="Checkout"
            url={links.checkout}
            onCopy={() => doCopy(links.checkout, "Link do checkout")}
          />
          <LinkRow
            label="Link curto"
            url={links.short}
            onCopy={() => doCopy(links.short, "Link curto")}
          />
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="mt-6">
        <h3 className="font-display mb-3 text-lg font-semibold">Ações rápidas</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <ActionLink href={links.product} icon={Eye} label="Visualizar produto" />
          <ActionLink href={links.checkout} icon={ShoppingCart} label="Visualizar checkout" />
          <Action
            icon={Link2}
            label="Copiar link do produto"
            onClick={() => doCopy(links.product, "Link do produto")}
          />
          <Action
            icon={CreditCard}
            label="Copiar link do checkout"
            onClick={() => doCopy(links.checkout, "Link do checkout")}
          />
          <Action
            icon={Share2}
            label="Partilhar produto"
            onClick={async () => {
              const r = await shareLink(p.title, links.share);
              if (r === "copied") toast.success("Link copiado para partilhar");
              if (r === "failed") toast.error("Partilha não disponível");
            }}
          />
          <Action
            icon={QrCode}
            label="QR Code do produto"
            onClick={() => setQr({ url: links.product, title: "QR Code do produto" })}
          />
          <Action
            icon={QrCode}
            label="QR Code do checkout"
            onClick={() => setQr({ url: links.checkout, title: "QR Code do checkout" })}
          />
          <Action
            icon={Pencil}
            label="Editar produto"
            onClick={() => router.navigate({ to: "/produtor/editar/$id", params: { id } })}
          />
          <Action
            icon={BarChart3}
            label="Ver estatísticas"
            onClick={() => router.navigate({ to: "/produtor" })}
          />
          <Action
            icon={Wallet}
            label="Ver vendas"
            onClick={() => router.navigate({ to: "/produtor/financeiro" })}
          />
          {p.allow_affiliates && (
            <Action
              icon={Users}
              label="Gerir afiliados"
              onClick={() => router.navigate({ to: "/afiliados" })}
            />
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-border pt-6">
        <Link to="/produtor/produtos">
          <Button variant="outline">Os meus produtos</Button>
        </Link>
        <Link to="/produtor/novo">
          <Button className="gradient-brand text-primary-foreground shadow-glow">
            Criar outro produto <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <QrDialog
        open={!!qr}
        onOpenChange={(v) => !v && setQr(null)}
        url={qr?.url ?? ""}
        title={qr?.title ?? ""}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function LinkRow({ label, url, onCopy }: { label: string; url: string; onCopy: () => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-background/50 p-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="truncate text-sm">{url}</div>
      </div>
      <Button size="sm" variant="outline" className="shrink-0" onClick={onCopy}>
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

type Icon = typeof Eye;

function Action({ icon: I, label, onClick }: { icon: Icon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/60 hover:shadow-glow"
    >
      <I className="h-5 w-5 text-gold" />
      <span className="text-sm font-medium leading-tight">{label}</span>
    </button>
  );
}

function ActionLink({ href, icon: I, label }: { href: string; icon: Icon; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-glow"
    >
      <I className="h-5 w-5 text-gold" />
      <span className="text-sm font-medium leading-tight">{label}</span>
    </a>
  );
}
