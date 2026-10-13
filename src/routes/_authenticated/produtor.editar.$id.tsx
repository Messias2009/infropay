import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MediaUpload } from "@/components/MediaUpload";
import {
  DeliveryFields,
  emptyDelivery,
  deliveryPayload,
  deliveryFromRow,
  type DeliveryValues,
} from "@/components/products/DeliveryFields";
import {
  getMyProduct,
  updateProduct,
  deleteProduct,
  submitProductForApproval,
} from "@/lib/products.functions";
import { listCategories } from "@/lib/catalog.functions";

export const Route = createFileRoute("/_authenticated/produtor/editar/$id")({
  component: EditarProduto,
});

const TYPES = [
  ["ebook", "Ebook"],
  ["curso", "Curso"],
  ["pdf", "PDF"],
  ["video", "Vídeo"],
  ["software", "Software"],
  ["link_externo", "Link externo"],
  ["streaming", "Streaming"],
  ["assinatura", "Assinatura"],
  ["template", "Template"],
  ["ia", "IA"],
  ["comunidade", "Comunidade"],
  ["download", "Download"],
] as const;

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  em_analise: "Em análise",
  publicado: "Publicado",
  pausado: "Pausado",
};

function EditarProduto() {
  const { id } = Route.useParams();
  const router = useRouter();
  const getFn = useServerFn(getMyProduct);
  const updateFn = useServerFn(updateProduct);
  const deleteFn = useServerFn(deleteProduct);
  const submitFn = useServerFn(submitProductForApproval);
  const catsFn = useServerFn(listCategories);
  const {
    data: product,
    isLoading,
    refetch,
  } = useQuery({ queryKey: ["my-product", id], queryFn: () => getFn({ data: { id } }) });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => catsFn() });

  const [form, setForm] = useState<any>(null);
  const [delivery, setDelivery] = useState<DeliveryValues>(emptyDelivery);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title,
        slug: product.slug,
        short_description: product.short_description ?? "",
        description: product.description ?? "",
        product_type: product.product_type,
        category_id: product.category_id ?? "",
        cover_url: product.cover_url ?? "",
        banner_url: product.banner_url ?? "",
        file_url: product.file_url ?? "",
        external_url: product.external_url ?? "",
        price: (product.price_cents / 100).toString(),
        promo_price: product.promo_price_cents ? (product.promo_price_cents / 100).toString() : "",
        currency: product.currency,
        tags: (product.tags ?? []).join(", "),
        guarantee_days: product.guarantee_days ?? 7,
        allow_affiliates: (product as any).allow_affiliates ?? false,
        affiliate_commission_percent: Number((product as any).affiliate_commission_percent ?? 30),
        status: product.status,
      });
      setDelivery(deliveryFromRow(product));
    }
  }, [product]);

  if (isLoading || !form) return <div className="p-10 text-muted-foreground">A carregar...</div>;

  function set<K extends string>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateFn({
        data: {
          id,
          patch: {
            title: form.title.trim(),
            slug: form.slug,
            short_description: form.short_description || null,
            description: form.description || null,
            product_type: form.product_type,
            category_id: form.category_id || null,
            cover_url: form.cover_url || null,
            banner_url: form.banner_url || null,
            file_url: form.file_url || null,
            external_url: form.external_url || null,
            price_cents: Math.round(Number(form.price || "0") * 100),
            promo_price_cents: form.promo_price ? Math.round(Number(form.promo_price) * 100) : null,
            currency: form.currency.toUpperCase(),
            tags: form.tags
              ? form.tags
                  .split(",")
                  .map((t: string) => t.trim())
                  .filter(Boolean)
              : [],
            guarantee_days: Number(form.guarantee_days),
            allow_affiliates: !!form.allow_affiliates,
            affiliate_commission_percent: Number(form.affiliate_commission_percent || 0),
            ...deliveryPayload(delivery),
          },
        },
      });
      toast.success("Alterações guardadas");
      refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function submitForApproval() {
    try {
      await submitFn({ data: { id } });
      toast.success("Enviado para aprovação!");
      refetch();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove() {
    try {
      await deleteFn({ data: { id } });
      toast.success("Produto eliminado");
      router.navigate({ to: "/produtor/produtos" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <Link
        to="/produtor/produtos"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold font-semibold">
            Editar produto
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">{form.title}</h1>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold ${
                product?.status === "publicado"
                  ? "bg-success/15 text-success"
                  : product?.status === "em_analise"
                    ? "bg-gold/15 text-gold"
                    : product?.status === "pausado"
                      ? "bg-warning/15 text-warning"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {STATUS_LABEL[product?.status ?? "rascunho"]}
            </span>
            {product?.rejection_reason && (
              <span className="text-xs text-destructive">Motivo: {product.rejection_reason}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {product?.status !== "em_analise" && product?.status !== "publicado" && (
            <Button
              type="button"
              onClick={submitForApproval}
              variant="outline"
              className="border-gold/40 text-gold hover:bg-gold/10"
            >
              <Send className="h-4 w-4 mr-1" /> Enviar para aprovação
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar produto?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={remove}
                  className="bg-destructive text-destructive-foreground"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <form onSubmit={save} className="mt-8 grid gap-6">
        <Section title="Informação principal">
          <Field label="Título">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              maxLength={160}
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(e) =>
                set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
              }
              required
            />
          </Field>
          <Field label="Descrição curta">
            <Input
              value={form.short_description}
              onChange={(e) => set("short_description", e.target.value)}
              maxLength={280}
            />
          </Field>
          <Field label="Descrição completa">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={6}
            />
          </Field>
        </Section>

        <Section title="Classificação">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tipo">
              <Select value={form.product_type} onValueChange={(v) => set("product_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Categoria">
              <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {(cats ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Tags">
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </Field>
        </Section>

        <Section title="Mídia">
          <MediaUpload
            kind="image"
            label="Capa"
            value={form.cover_url}
            onChange={(u) => set("cover_url", u ?? "")}
            productKey={id}
          />
          <MediaUpload
            kind="image"
            label="Banner"
            value={form.banner_url}
            onChange={(u) => set("banner_url", u ?? "")}
            productKey={id}
          />
        </Section>

        <Section title="Ficheiro">
          <MediaUpload
            kind="file"
            label="Ficheiro principal"
            value={form.file_url}
            onChange={(u) => set("file_url", u ?? "")}
            productKey={id}
          />
          <Field label="URL externa">
            <Input
              value={form.external_url}
              onChange={(e) => set("external_url", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Tipo de entrega">
          <DeliveryFields value={delivery} onChange={setDelivery} />
        </Section>

        <Section title="Preço e garantia">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Preço">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
            </Field>
            <Field label="Preço promocional">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.promo_price}
                onChange={(e) => set("promo_price", e.target.value)}
              />
            </Field>
            <Field label="Moeda">
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AOA">AOA</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BRL">BRL</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Dias de garantia">
            <Input
              type="number"
              min={0}
              max={60}
              value={form.guarantee_days}
              onChange={(e) => set("guarantee_days", Number(e.target.value))}
            />
          </Field>
        </Section>

        <Section title="Programa de afiliados">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="text-sm">Permitir afiliados</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Outros utilizadores podem gerar links e promover este produto em troca de comissão.
              </p>
            </div>
            <Switch
              checked={!!form.allow_affiliates}
              onCheckedChange={(v) => set("allow_affiliates", v)}
            />
          </div>
          {form.allow_affiliates && (
            <Field
              label="Comissão do afiliado (%)"
              hint="Descontada do valor que recebe por venda. Máximo 80%."
            >
              <Input
                type="number"
                min={1}
                max={80}
                step="1"
                value={form.affiliate_commission_percent}
                onChange={(e) => set("affiliate_commission_percent", Number(e.target.value))}
              />
            </Field>
          )}
        </Section>

        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Link to="/produtor/produtos">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="gradient-brand text-primary-foreground shadow-glow"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? "A guardar..." : "Guardar alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display font-semibold text-lg mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
