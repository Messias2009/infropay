import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Palette,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Eye,
  Store,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMyProduct, updateProduct } from "@/lib/products.functions";
import { getCheckoutOffers } from "@/lib/funnel.functions";
import { CheckoutImageUpload } from "@/components/checkout/CheckoutImageUpload";
import logoMark from "@/assets/infropay-mark.png";

export const Route = createFileRoute("/_authenticated/produtor/checkout/$id")({
  head: () => ({
    meta: [{ title: "Personalizar Checkout — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: CheckoutCustomizerPage,
});

const THEMES = [
  {
    id: "azul",
    name: "Azul InfroPay",
    desc: "Tema clássico ultramarino com iluminação tecnológica",
    color: "#1565C0",
    badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    btnClass: "gradient-brand text-primary-foreground font-bold shadow-glow",
  },
  {
    id: "dourado",
    name: "Dourado Imperial",
    desc: "Elegância metálica e prestígio premium para alto valor",
    color: "#F9A825",
    badgeClass: "bg-gold/20 text-gold border-gold/40",
    btnClass: "gradient-gold text-gold-foreground font-bold shadow-gold",
  },
  {
    id: "verde",
    name: "Verde Esmeralda",
    desc: "Tom natural de alta conversão e aprovação financeira",
    color: "#059669",
    badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg",
  },
  {
    id: "roxo",
    name: "Roxo Creator",
    desc: "Vibrante e moderno, ideal para criadores e inovadores",
    color: "#7C3AED",
    badgeClass: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    btnClass: "bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg",
  },
  {
    id: "preto",
    name: "Preto Minimalista",
    desc: "Monocromático, sóbrio e focado em sofisticação",
    color: "#0F172A",
    badgeClass: "bg-slate-700/40 text-slate-200 border-slate-600",
    btnClass:
      "bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold shadow-md",
  },
] as const;

function kz(cents: number) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "AOA" }).format(
      cents / 100,
    );
  } catch {
    return `${(cents / 100).toFixed(2)} Kz`;
  }
}

function CheckoutCustomizerPage() {
  const { id } = Route.useParams();
  const getProductFn = useServerFn(getMyProduct);
  const updateProductFn = useServerFn(updateProduct);
  const getOffersFn = useServerFn(getCheckoutOffers);

  const {
    data: product,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductFn({ data: { id } }),
  });

  const { data: offers } = useQuery({
    queryKey: ["product", id, "offers"],
    queryFn: () => getOffersFn({ data: { product_id: id } }),
    enabled: Boolean(product?.id),
  });

  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [theme, setTheme] = useState<string>("azul");
  const [guaranteeDays, setGuaranteeDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState<"desktop" | "mobile">("desktop");
  const [simulatedBump, setSimulatedBump] = useState(false);

  useEffect(() => {
    if (product) {
      setBrandName(product.checkout_brand_name || "");
      setLogoUrl(product.checkout_logo_url || "");
      setBannerUrl(product.checkout_banner_url || "");
      setTheme(product.checkout_theme || "azul");
      setGuaranteeDays(product.guarantee_days ?? 7);
    }
  }, [product]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setSaving(true);
    try {
      await updateProductFn({
        data: {
          id: product.id,
          patch: {
            checkout_brand_name: brandName.trim() || null,
            checkout_logo_url: logoUrl.trim() || null,
            checkout_banner_url: bannerUrl.trim() || null,
            checkout_theme: theme as any,
            guarantee_days: Number(guaranteeDays),
          },
        },
      });
      toast.success("Checkout personalizado salvo com sucesso!");
      refetch();
    } catch (err) {
      toast.error((err as Error).message || "Erro ao salvar checkout");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground animate-pulse">
          A carregar personalizador de checkout...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-bold">Produto não encontrado</h2>
        <Link to="/produtor/produtos">
          <Button variant="outline">Voltar aos produtos</Button>
        </Link>
      </div>
    );
  }

  const selectedThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const orderBumps = (offers ?? []).filter((o: any) => o.kind === "order_bump");
  const basePriceCents =
    product.promo_price_cents && product.promo_price_cents < product.price_cents
      ? product.promo_price_cents
      : product.price_cents;

  const firstBump = orderBumps[0];
  const bumpPriceCents = firstBump?.offer_price_cents || 500000;
  const totalPrice = simulatedBump ? basePriceCents + bumpPriceCents : basePriceCents;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/produtor/produtos" className="hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Produtos
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-xs">{product.title}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Personalizar Checkout
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure a marca, logotipo, cores e gatilhos de conversão do seu produto.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={`/checkout/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center"
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Ver Checkout Real
            </Button>
          </a>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gradient-brand text-primary-foreground shadow-glow gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </div>
      </div>

      {/* Editor & Preview Split Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Customization Controls Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Branding Settings Card */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-2 border-b border-border/60">
                <Palette className="w-4 h-4 text-gold" />
                <span>Identidade & Marca do Vendedor</span>
              </div>

              <div>
                <Label className="text-xs font-semibold">Nome da Marca / Escola</Label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Academia Digital Angola"
                  className="mt-1.5"
                  maxLength={80}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Substitui "InfroPay" no topo do checkout pela sua própria marca.
                </p>
              </div>

              <CheckoutImageUpload
                label="Logótipo da Marca"
                hint="Substitui o logótipo da InfroPay no topo do checkout. Formato quadrado com fundo transparente recomendado."
                value={logoUrl}
                onChange={setLogoUrl}
                aspectRatio="square"
                productKey={id}
              />

              <CheckoutImageUpload
                label="Banner Promocional de Topo"
                hint="Banner panorâmico exibido antes dos detalhes da oferta no checkout (proporção aprox. 3:1)."
                value={bannerUrl}
                onChange={setBannerUrl}
                aspectRatio="banner"
                productKey={id}
              />
            </div>

            {/* Visual Theme Selector Card */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-2 border-b border-border/60">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Tema & Paleta de Cores do Checkout</span>
              </div>

              <div className="space-y-2.5">
                {THEMES.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/70 bg-card/60 hover:bg-accent/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full border border-white/20 shadow-xs shrink-0"
                          style={{ backgroundColor: t.color }}
                        />
                        <div>
                          <div className="text-xs font-bold text-foreground">{t.name}</div>
                          <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversion Triggers Card */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-2 border-b border-border/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Confiança & Garantia</span>
              </div>

              <div>
                <Label className="text-xs font-semibold">Garantia Incondicional de Devolução</Label>
                <Select
                  value={String(guaranteeDays)}
                  onValueChange={(v) => setGuaranteeDays(Number(v))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione o prazo de garantia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sem garantia exibida</SelectItem>
                    <SelectItem value="7">7 Dias de Garantia (Recomendado)</SelectItem>
                    <SelectItem value="15">15 Dias de Garantia</SelectItem>
                    <SelectItem value="30">30 Dias de Garantia Incondicional</SelectItem>
                    <SelectItem value="60">60 Dias de Garantia Total</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Exibe o selo oficial de garantia de satisfação ou reembolso no rodapé do checkout.
                </p>
              </div>

              {/* Order Bump Link info */}
              <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-gold" />
                    Funil & Order Bumps
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {orderBumps.length > 0
                      ? `${orderBumps.length} oferta(s) de bump ativas no checkout`
                      : "Nenhuma oferta de bump ativa configurada"}
                  </div>
                </div>
                <Link to="/produtor/funil">
                  <Button size="sm" variant="ghost" className="text-gold text-xs h-8">
                    Gerenciar Funil &rarr;
                  </Button>
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-11 gradient-brand text-primary-foreground font-semibold shadow-glow cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "A guardar alterações..." : "Guardar Personalização"}
            </Button>
          </form>
        </div>

        {/* Right Side: Interactive Real-Time Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3 sticky top-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gold" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Pré-visualização em Tempo Real
              </span>
            </div>
            <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPreviewTab("desktop")}
                className={`px-2.5 py-1 rounded-md transition ${previewTab === "desktop" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("mobile")}
                className={`px-2.5 py-1 rounded-md transition ${previewTab === "mobile" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Mobile
              </button>
            </div>
          </div>

          {/* Browser / Phone Device Mockup Container */}
          <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-2 shadow-2xl overflow-hidden">
            {/* Browser top pill */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 bg-muted/40 text-xs text-muted-foreground rounded-t-xl mb-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="mx-auto px-4 py-0.5 rounded-md bg-background/80 text-[11px] font-mono text-muted-foreground max-w-xs truncate">
                infropay.ao/checkout/{product.slug}
              </div>
            </div>

            {/* Interactive Checkout Mockup Canvas */}
            <div
              className={`mx-auto bg-background rounded-xl border border-border/80 overflow-y-auto overflow-x-hidden transition-all duration-300 ${
                previewTab === "mobile" ? "max-w-[360px] max-h-[640px]" : "w-full max-h-[720px]"
              }`}
            >
              {/* Checkout Header with Custom Brand & Logo */}
              <div className="border-b border-border/70 bg-card/70 py-3 px-4 flex items-center justify-center sticky top-0 z-20 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                  <img
                    src={logoUrl || logoMark}
                    alt="Logo"
                    className="h-7 w-7 rounded-lg object-contain shadow-xs"
                  />
                  <span className="font-bold text-base tracking-tight text-foreground">
                    {brandName || (
                      <>
                        Infro<span className="text-gold">Pay</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Banner if configured */}
              {bannerUrl && (
                <div className="px-4 pt-4">
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="w-full aspect-[3/1] object-cover rounded-xl border border-border"
                  />
                </div>
              )}

              {/* Checkout Product Details Preview */}
              <div className="p-4 sm:p-6 space-y-5 text-center">
                {product.cover_url && (
                  <div className="w-full max-w-[260px] mx-auto aspect-video rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                    <img
                      src={product.cover_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground leading-snug">
                    {product.title}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Vendedor Verificado
                  </div>
                  <div className="pt-2 text-2xl font-extrabold font-mono text-gold tabular-nums">
                    {kz(basePriceCents)}
                  </div>
                </div>

                {/* Simulated Order Bump Card */}
                <div className="text-left rounded-xl border border-gold/40 bg-gold/5 p-3.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="preview-bump"
                      checked={simulatedBump}
                      onChange={(e) => setSimulatedBump(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gold text-gold cursor-pointer"
                    />
                    <label htmlFor="preview-bump" className="text-xs cursor-pointer flex-1">
                      <div className="font-bold text-foreground">
                        {firstBump?.headline ||
                          "Oferta Especial: Adicionar E-book Exclusivo de Bónus"}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {firstBump?.description ||
                          "Leve o material complementar com desconto especial nesta encomenda."}
                      </div>
                      <div className="text-xs font-bold text-gold font-mono mt-1">
                        + {kz(bumpPriceCents)}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Simulated Payment Summary & Button */}
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Total a Pagar</span>
                    <span className="text-base font-bold font-mono text-gold tabular-nums">
                      {kz(totalPrice)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`w-full py-3 px-4 rounded-xl text-sm transition-all shadow-md ${selectedThemeObj.btnClass}`}
                  >
                    Pagar Agora {kz(totalPrice)}
                  </button>

                  {guaranteeDays > 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Garantia de Satisfação de {guaranteeDays} dias</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
