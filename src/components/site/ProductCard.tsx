import { Link } from "@tanstack/react-router";
import { Star, ShoppingBag } from "lucide-react";

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
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group relative flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/60 hover:shadow-glow transition-all duration-300"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/20 to-gold/10">
        {product.cover_url ? (
          <img src={product.cover_url} alt={product.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="h-full w-full grid place-items-center text-muted-foreground/40">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}
        {hasPromo && (
          <div className="absolute top-3 left-3 rounded-full gradient-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gold-foreground shadow-gold">
            Promo
          </div>
        )}
        {product.category && (
          <div className="absolute top-3 right-3 rounded-full glass px-2.5 py-1 text-[10px] font-medium">
            {product.category.name}
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-display font-semibold leading-tight line-clamp-2 group-hover:text-primary-glow transition">{product.title}</h3>
        {product.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.short_description}</p>
        )}
        <div className="mt-auto pt-3 flex items-end justify-between">
          <div>
            {hasPromo ? (
              <>
                <div className="text-xs text-muted-foreground line-through">{formatPrice(product.price_cents, product.currency)}</div>
                <div className="text-lg font-bold text-gradient-gold">{formatPrice(product.promo_price_cents!, product.currency)}</div>
              </>
            ) : (
              <div className="text-lg font-bold">{formatPrice(product.price_cents, product.currency)}</div>
            )}
          </div>
          {(product.rating ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-gold text-gold" />
              {Number(product.rating).toFixed(1)}
              <span className="opacity-60">({product.reviews_count ?? 0})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
