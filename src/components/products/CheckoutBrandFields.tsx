import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CheckoutImageUpload } from "@/components/checkout/CheckoutImageUpload";

export const emptyCheckoutBrand = {
  store_visible: true,
  checkout_brand_name: "",
  checkout_logo_url: "",
  checkout_banner_url: "",
  checkout_theme: "azul" as "azul" | "dourado" | "verde",
};
export type CheckoutBrandValues = typeof emptyCheckoutBrand;

export function CheckoutBrandFields({
  value,
  onChange,
  productKey,
}: {
  value: CheckoutBrandValues;
  onChange: (v: CheckoutBrandValues) => void;
  productKey: string;
}) {
  function set<K extends keyof CheckoutBrandValues>(key: K, next: CheckoutBrandValues[K]) {
    onChange({ ...value, [key]: next });
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
        <div className="min-w-0">
          <Label htmlFor="store-visible">Mostrar na loja</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {value.store_visible
              ? "Público na loja e disponível por link."
              : "Oculto na loja. Continua disponível pelo link de venda."}
          </p>
        </div>
        <Switch
          id="store-visible"
          checked={value.store_visible}
          onCheckedChange={(v) => set("store_visible", v)}
        />
      </div>
      <div>
        <Label htmlFor="checkout-brand">Nome da marca no checkout</Label>
        <Input
          id="checkout-brand"
          className="mt-2"
          maxLength={80}
          placeholder="InfroPay"
          value={value.checkout_brand_name}
          onChange={(e) => set("checkout_brand_name", e.target.value)}
        />
      </div>
      <CheckoutImageUpload
        label="Logótipo da Marca"
        hint="Substitui o logótipo da InfroPay no checkout deste produto."
        value={value.checkout_logo_url}
        onChange={(v) => set("checkout_logo_url", v)}
        aspectRatio="square"
        productKey={productKey}
      />
      <CheckoutImageUpload
        label="Banner Promocional de Topo"
        hint="Banner panorâmico exibido no cabeçalho do checkout."
        value={value.checkout_banner_url}
        onChange={(v) => set("checkout_banner_url", v)}
        aspectRatio="banner"
        productKey={productKey}
      />
      <div>
        <Label>Cor da marca</Label>
        <div className="mt-2 flex gap-3">
          {(
            [
              ["azul", "bg-primary"],
              ["dourado", "bg-gold"],
              ["verde", "bg-success"],
            ] as const
          ).map(([theme, color]) => (
            <Button
              key={theme}
              type="button"
              variant="outline"
              size="icon"
              title={theme}
              aria-label={`Cor ${theme}`}
              aria-pressed={value.checkout_theme === theme}
              onClick={() => set("checkout_theme", theme)}
              className={
                value.checkout_theme === theme
                  ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                  : ""
              }
            >
              <span className={`h-5 w-5 rounded-full ${color}`} />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
