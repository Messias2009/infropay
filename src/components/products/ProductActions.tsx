import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { QrDialog } from "@/components/products/QrDialog";
import { productLinks, copy, shareLink } from "@/lib/product-links";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  ShoppingCart,
  Link2,
  CreditCard,
  Share2,
  QrCode,
  Pencil,
  Copy as CopyIcon,
  BarChart3,
  Wallet,
  Users,
  Trash2,
  GraduationCap,
} from "lucide-react";

export type ActionProduct = {
  id: string;
  slug: string;
  title: string;
  allow_affiliates?: boolean | null;
  has_members_area?: boolean | null;
};

export function ProductActions({
  product,
  onDuplicate,
  onDelete,
  align = "end",
}: {
  product: ActionProduct;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  align?: "start" | "end";
}) {
  const [qr, setQr] = useState<{ url: string; title: string } | null>(null);
  const links = productLinks(product.slug);

  async function doCopy(url: string, label: string) {
    if (await copy(url)) toast.success(`${label} copiado`);
    else toast.error("Não foi possível copiar");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" aria-label="Ações do produto">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-60">
          <DropdownMenuLabel className="truncate">{product.title}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href={links.product} target="_blank" rel="noreferrer">
              <Eye className="mr-2 h-4 w-4" />
              Visualizar produto
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={links.checkout} target="_blank" rel="noreferrer">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Abrir checkout
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => doCopy(links.product, "Link do produto")}>
            <Link2 className="mr-2 h-4 w-4" />
            Copiar link do produto
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => doCopy(links.checkout, "Link do checkout")}>
            <CreditCard className="mr-2 h-4 w-4" />
            Copiar link do checkout
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const r = await shareLink(product.title, links.share);
              if (r === "copied") toast.success("Link copiado para partilhar");
              if (r === "failed") toast.error("Partilha não disponível");
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Partilhar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setQr({ url: links.product, title: "QR Code do produto" })}
          >
            <QrCode className="mr-2 h-4 w-4" />
            QR Code do produto
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setQr({ url: links.checkout, title: "QR Code do checkout" })}
          >
            <QrCode className="mr-2 h-4 w-4" />
            QR Code do checkout
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/produtor/editar/$id" params={{ id: product.id }}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar produto
            </Link>
          </DropdownMenuItem>
          {product.has_members_area && (
            <DropdownMenuItem asChild>
              <Link to="/produtor/curso/$id" params={{ id: product.id }}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Gerir aulas
              </Link>
            </DropdownMenuItem>
          )}
          {onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
              <CopyIcon className="mr-2 h-4 w-4" />
              Duplicar produto
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/produtor/financeiro">
              <Wallet className="mr-2 h-4 w-4" />
              Ver vendas
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/produtor">
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver estatísticas
            </Link>
          </DropdownMenuItem>
          {product.allow_affiliates && (
            <DropdownMenuItem asChild>
              <Link to="/afiliados">
                <Users className="mr-2 h-4 w-4" />
                Gerir afiliados
              </Link>
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <QrDialog
        open={!!qr}
        onOpenChange={(v) => !v && setQr(null)}
        url={qr?.url ?? ""}
        title={qr?.title ?? ""}
      />
    </>
  );
}
