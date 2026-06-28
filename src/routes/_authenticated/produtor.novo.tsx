import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct } from "@/lib/products.functions";
import { listCategories } from "@/lib/catalog.functions";

export const Route = createFileRoute("/_authenticated/produtor/novo")({
  component: NovoProduto,
});

const TYPES = [
  ["ebook","Ebook"], ["curso","Curso"], ["pdf","PDF"], ["video","Vídeo"],
  ["software","Software"], ["link_externo","Link externo"], ["streaming","Streaming"],
  ["assinatura","Assinatura"], ["template","Template"], ["ia","IA"],
  ["comunidade","Comunidade"], ["download","Download"],
] as const;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function NovoProduto() {
  const router = useRouter();
  const catsFn = useServerFn(listCategories);
  const createFn = useServerFn(createProduct);
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => catsFn() });

  const [form, setForm] = useState({
    title: "", slug: "", short_description: "", description: "",
    product_type: "ebook" as const, category_id: "" as string,
    cover_url: "", external_url: "",
    price: "", promo_price: "", currency: "AOA",
    status: "rascunho" as "rascunho" | "publicado", tags: "",
    guarantee_days: 7,
  });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: (form.slug || slugify(form.title)),
        short_description: form.short_description || null,
        description: form.description || null,
        product_type: form.product_type,
        category_id: form.category_id || null,
        cover_url: form.cover_url || null,
        external_url: form.external_url || null,
        price_cents: Math.round(Number(form.price || "0") * 100),
        promo_price_cents: form.promo_price ? Math.round(Number(form.promo_price) * 100) : null,
        currency: form.currency.toUpperCase(),
        status: form.status,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        guarantee_days: Number(form.guarantee_days),
      };
      const row = await createFn({ data: payload });
      toast.success("Produto criado!");
      router.navigate({ to: "/produto/$slug", params: { slug: row.slug } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <Link to="/produtor" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
      </Link>
      <div className="text-xs uppercase tracking-widest text-gold font-semibold">Novo produto</div>
      <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Criar produto</h1>
      <p className="text-muted-foreground mt-2">Preencha os detalhes. Pode editar e publicar depois.</p>

      <form onSubmit={submit} className="mt-8 grid gap-6">
        <Section title="Informação principal">
          <Field label="Título" required>
            <Input value={form.title} onChange={(e) => { set("title", e.target.value); if (!form.slug) set("slug", slugify(e.target.value)); }} placeholder="Curso completo de…" required maxLength={160} />
          </Field>
          <Field label="Slug (URL)" hint="apenas letras minúsculas, números e hífens">
            <Input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} placeholder="curso-completo" required />
          </Field>
          <Field label="Descrição curta" hint="máx. 280 caracteres">
            <Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} maxLength={280} />
          </Field>
          <Field label="Descrição completa">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={6} />
          </Field>
        </Section>

        <Section title="Classificação">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Tipo">
              <Select value={form.product_type} onValueChange={(v) => set("product_type", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Categoria">
              <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{(cats ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Tags" hint="separadas por vírgula">
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="marketing, vendas, ia" />
          </Field>
        </Section>

        <Section title="Mídia e ficheiros">
          <Field label="URL da capa"><Input value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://…" /></Field>
          <Field label="URL externa (opcional)"><Input value={form.external_url} onChange={(e) => set("external_url", e.target.value)} placeholder="https://…" /></Field>
        </Section>

        <Section title="Preço e garantia">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Preço"><Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required /></Field>
            <Field label="Preço promocional"><Input type="number" min={0} step="0.01" value={form.promo_price} onChange={(e) => set("promo_price", e.target.value)} /></Field>
            <Field label="Moeda">
              <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AOA">AOA — Kwanza</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="USD">USD — Dólar</SelectItem>
                  <SelectItem value="BRL">BRL — Real</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Dias de garantia"><Input type="number" min={0} max={60} value={form.guarantee_days} onChange={(e) => set("guarantee_days", Number(e.target.value))} /></Field>
        </Section>

        <Section title="Estado">
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="publicado">Publicar imediatamente</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Link to="/produtor"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" disabled={loading} className="gradient-brand text-primary-foreground shadow-glow">
            <Save className="h-4 w-4 mr-1" />
            {loading ? "A guardar..." : "Guardar produto"}
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

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
