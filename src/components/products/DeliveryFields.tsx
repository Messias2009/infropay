import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Smartphone,
  RefreshCw,
  GraduationCap,
  Download,
  ExternalLink,
} from "lucide-react";

export type DeliveryValues = {
  delivery_kind: "digital" | "fisico" | "apk" | "assinatura" | "membros" | "externo";
  stock_quantity: string;
  requires_shipping: boolean;
  shipping_fee: string;
  weight_grams: string;
  app_version: string;
  app_package: string;
  app_requirements: string;
  is_subscription: boolean;
  billing_interval: "mensal" | "trimestral" | "semestral" | "anual";
  subscription_price: string;
  trial_days: string;
  has_members_area: boolean;
};

export const emptyDelivery: DeliveryValues = {
  delivery_kind: "digital",
  stock_quantity: "",
  requires_shipping: false,
  shipping_fee: "",
  weight_grams: "",
  app_version: "",
  app_package: "",
  app_requirements: "",
  is_subscription: false,
  billing_interval: "mensal",
  subscription_price: "",
  trial_days: "0",
  has_members_area: false,
};

/** Maps the form values to the server payload shape. */
export function deliveryPayload(d: DeliveryValues) {
  const num = (v: string) => (v.trim() === "" ? null : Math.round(Number(v)));
  return {
    delivery_kind: d.delivery_kind,
    stock_quantity: d.delivery_kind === "fisico" ? num(d.stock_quantity) : null,
    requires_shipping: d.delivery_kind === "fisico" ? d.requires_shipping : false,
    shipping_fee_cents:
      d.delivery_kind === "fisico" && d.shipping_fee ? Math.round(Number(d.shipping_fee) * 100) : 0,
    weight_grams: d.delivery_kind === "fisico" ? num(d.weight_grams) : null,
    app_version: d.delivery_kind === "apk" ? d.app_version || null : null,
    app_package: d.delivery_kind === "apk" ? d.app_package || null : null,
    app_requirements: d.delivery_kind === "apk" ? d.app_requirements || null : null,
    is_subscription: d.delivery_kind === "assinatura" || d.is_subscription,
    billing_interval:
      d.delivery_kind === "assinatura" || d.is_subscription ? d.billing_interval : null,
    subscription_price_cents:
      (d.delivery_kind === "assinatura" || d.is_subscription) && d.subscription_price
        ? Math.round(Number(d.subscription_price) * 100)
        : null,
    trial_days: Number(d.trial_days || 0),
    has_members_area: d.delivery_kind === "membros" || d.has_members_area,
  };
}

/** Reads a product row back into form values. */
export function deliveryFromRow(row: any): DeliveryValues {
  return {
    delivery_kind: row?.delivery_kind ?? "digital",
    stock_quantity: row?.stock_quantity != null ? String(row.stock_quantity) : "",
    requires_shipping: !!row?.requires_shipping,
    shipping_fee: row?.shipping_fee_cents ? String(row.shipping_fee_cents / 100) : "",
    weight_grams: row?.weight_grams != null ? String(row.weight_grams) : "",
    app_version: row?.app_version ?? "",
    app_package: row?.app_package ?? "",
    app_requirements: row?.app_requirements ?? "",
    is_subscription: !!row?.is_subscription,
    billing_interval: row?.billing_interval ?? "mensal",
    subscription_price: row?.subscription_price_cents
      ? String(row.subscription_price_cents / 100)
      : "",
    trial_days: String(row?.trial_days ?? 0),
    has_members_area: !!row?.has_members_area,
  };
}

const KINDS = [
  {
    v: "digital",
    label: "Digital (download)",
    icon: Download,
    desc: "Ficheiro entregue após pagamento",
  },
  {
    v: "membros",
    label: "Área de membros",
    icon: GraduationCap,
    desc: "Aulas, módulos e certificado",
  },
  { v: "assinatura", label: "Assinatura", icon: RefreshCw, desc: "Cobrança recorrente" },
  { v: "apk", label: "APK / Software", icon: Smartphone, desc: "App Android ou programa" },
  { v: "fisico", label: "Produto físico", icon: Package, desc: "Stock e envio" },
  { v: "externo", label: "Acesso externo", icon: ExternalLink, desc: "Link hospedado fora" },
] as const;

export function DeliveryFields({
  value,
  onChange,
}: {
  value: DeliveryValues;
  onChange: (v: DeliveryValues) => void;
}) {
  const set = <K extends keyof DeliveryValues>(k: K, v: DeliveryValues[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm">Tipo de entrega</Label>
        <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {KINDS.map((k) => {
            const Icon = k.icon;
            const active = value.delivery_kind === k.v;
            return (
              <button
                key={k.v}
                type="button"
                onClick={() => set("delivery_kind", k.v)}
                className={`text-left rounded-xl border p-3 transition ${
                  active
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${active ? "text-primary-glow" : "text-muted-foreground"}`}
                  />
                  <span className="text-sm font-semibold">{k.label}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{k.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {value.delivery_kind === "fisico" && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm">Stock disponível</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={value.stock_quantity}
              onChange={(e) => set("stock_quantity", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm">Taxa de envio (Kz)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              step="0.01"
              value={value.shipping_fee}
              onChange={(e) => set("shipping_fee", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm">Peso (gramas)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              value={value.weight_grams}
              onChange={(e) => set("weight_grams", e.target.value)}
            />
          </div>
          <label className="sm:col-span-3 flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={value.requires_shipping}
              onChange={(e) => set("requires_shipping", e.target.checked)}
            />
            <span className="text-sm">Exigir endereço de entrega no checkout</span>
          </label>
        </div>
      )}

      {value.delivery_kind === "apk" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Versão</Label>
            <Input
              className="mt-1.5"
              value={value.app_version}
              onChange={(e) => set("app_version", e.target.value)}
              placeholder="1.4.2"
            />
          </div>
          <div>
            <Label className="text-sm">Pacote / bundle</Label>
            <Input
              className="mt-1.5"
              value={value.app_package}
              onChange={(e) => set("app_package", e.target.value)}
              placeholder="com.minhaapp.pro"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-sm">Requisitos</Label>
            <Textarea
              className="mt-1.5"
              rows={3}
              value={value.app_requirements}
              onChange={(e) => set("app_requirements", e.target.value)}
              placeholder="Android 8+ · 120 MB livres"
            />
          </div>
        </div>
      )}

      {(value.delivery_kind === "assinatura" || value.is_subscription) && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm">Intervalo de cobrança</Label>
            <div className="mt-1.5">
              <Select
                value={value.billing_interval}
                onValueChange={(v) =>
                  set("billing_interval", v as DeliveryValues["billing_interval"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Valor por ciclo (Kz)</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              step="0.01"
              value={value.subscription_price}
              onChange={(e) => set("subscription_price", e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm">Dias de teste grátis</Label>
            <Input
              className="mt-1.5"
              type="number"
              min={0}
              max={90}
              value={value.trial_days}
              onChange={(e) => set("trial_days", e.target.value)}
            />
          </div>
        </div>
      )}

      {value.delivery_kind !== "membros" && (
        <label className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={value.has_members_area}
            onChange={(e) => set("has_members_area", e.target.checked)}
          />
          <span className="text-sm">Ativar também área de membros para este produto</span>
        </label>
      )}
    </div>
  );
}
