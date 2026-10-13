import { Link } from "@tanstack/react-router";
import { Star, ShoppingBag, Flame } from "lucide-react";

export interface ProductCardData {
  slug: string;
  title: string;
  short_description?: string | null;
  cover_url?: string | null;
  price_cents: number;
  promo_price_cents?: number | null;
  currency: string;
  rating?: number | null;
  reviews_count?: number | null;
  sales_count?: number | null;
  category?: { name: string } | null;
}

function formatPrice(cents: number, currency: string) {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const hasPromo = product.promo_price_cents && product.promo_price_cents < product.price_cents;
  const off = hasPromo
    ? Math.round(100 - (product.promo_price_cents! / product.price_cents) * 100)
    : 0;
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/20 to-gold/10">
        {product.cover_url ? (
          <img
            src={product.cover_url}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground/40">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent opacity-80" />
        {hasPromo && (
          <div className="absolute left-3 top-3 rounded-full gradient-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-foreground shadow-gold">
            -{off}%
          </div>
        )}
        {product.category && (
          <div className="absolute right-3 top-3 rounded-full glass px-2.5 py-1 text-[10px] font-medium">
            {product.category.name}
          </div>
        )}
        {(product.sales_count ?? 0) > 0 && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full glass px-2.5 py-1 text-[10px] font-medium">
            <Flame className="h-3 w-3 text-gold" /> {product.sales_count} vendas
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display font-semibold leading-tight line-clamp-2 transition group-hover:text-primary-glow">
          {product.title}
        </h3>
        {product.short_description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{product.short_description}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {hasPromo ? (
              <>
                <div className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.price_cents, product.currency)}
                </div>
                <div className="text-lg font-bold text-gradient-gold">
                  {formatPrice(product.promo_price_cents!, product.currency)}
                </div>
              </>
            ) : (
              <div className="text-lg font-bold">
                {formatPrice(product.price_cents, product.currency)}
              </div>
            )}
          </div>
          {(product.rating ?? 0) > 0 ? (
            <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-gold text-gold" />
              {Number(product.rating).toFixed(1)}
              <span className="opacity-60">({product.reviews_count ?? 0})</span>
            </div>
          ) : (
            <span className="shrink-0 rounded-full border border-primary/40 px-2.5 py-1 text-[10px] font-semibold text-primary-glow opacity-0 transition group-hover:opacity-100">
              Ver detalhes
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
