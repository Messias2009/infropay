import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getMyIntegrations, upsertMyIntegrations } from "@/lib/integrations.functions";

export const Route = createFileRoute("/_authenticated/produtor/integracoes")({
  head: () => ({
    meta: [{ title: "Integrações — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

type Integ = {
  key: string;
  name: string;
  desc: string;
  color: string;
  fields: { id: string; label: string; placeholder: string }[];
  logo: React.ReactNode;
};

const INTEGRATIONS: Integ[] = [
  {
    key: "meta",
    name: "Meta Ads",
    desc: "Facebook & Instagram Pixel + Conversions API",
    color: "#1877F2",
    fields: [
      { id: "meta_pixel_id", label: "Pixel ID", placeholder: "1234567890" },
      { id: "meta_capi_token", label: "CAPI Access Token (opcional)", placeholder: "EAAxxxxx..." },
    ],
    logo: (
      <svg viewBox="0 0 40 40" className="h-8 w-8">
        <path fill="#1877F2" d="M20 4a16 16 0 100 32 16 16 0 000-32z" />
        <path
          fill="#fff"
          d="M22.4 32V22h3.4l.5-4h-3.9v-2.5c0-1.2.3-2 2-2h2.1V9.9c-.4-.1-1.7-.2-3.3-.2-3.2 0-5.4 2-5.4 5.6V18h-3.4v4h3.4v10h4.6z"
        />
      </svg>
    ),
  },
  {
    key: "google_ads",
    name: "Google Ads",
    desc: "Conversion tracking para campanhas",
    color: "#FBBC04",
    fields: [
      { id: "google_ads_id", label: "Conversion ID (AW-...)", placeholder: "AW-123456789" },
      { id: "google_ads_label", label: "Conversion Label", placeholder: "abcDEF123" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" className="h-8 w-8">
        <path fill="#FBBC04" d="M15 6l10 17-5 9L10 15z" />
        <path fill="#4285F4" d="M25 6l10 17-5 9-10-17z" />
        <circle cx="10" cy="30" r="5" fill="#34A853" />
      </svg>
    ),
  },
  {
    key: "ga",
    name: "Google Analytics 4",
    desc: "Medição de tráfego e eventos",
    color: "#F9AB00",
    fields: [
      { id: "ga_measurement_id", label: "Measurement ID (G-...)", placeholder: "G-XXXXXXX" },
    ],
    logo: (
      <svg viewBox="0 0 40 40" className="h-8 w-8">
        <rect x="24" y="6" width="10" height="28" rx="5" fill="#F9AB00" />
        <rect x="14" y="16" width="10" height="18" rx="5" fill="#E37400" />
        <circle cx="9" cy="30" r="5" fill="#E37400" />
      </svg>
    ),
  },
  {
    key: "utmify",
    name: "Utmify",
    desc: "Rastreamento de UTM e atribuição",
    color: "#7C4DFF",
    fields: [{ id: "utmify_token", label: "API Token", placeholder: "utm_xxxxxxxxxx" }],
    logo: (
      <svg viewBox="0 0 40 40" className="h-8 w-8">
        <rect width="40" height="40" rx="10" fill="#7C4DFF" />
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fill="#fff"
          fontFamily="system-ui"
          fontWeight="800"
          fontSize="16"
        >
          U
        </text>
      </svg>
    ),
  },
];

function Page() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyIntegrations);
  const saveFn = useServerFn(upsertMyIntegrations);
  const { data } = useQuery({ queryKey: ["me", "integrations"], queryFn: () => getFn() });
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function save() {
    try {
      await saveFn({
        data: {
          meta_pixel_id: form.meta_pixel_id || null,
          meta_capi_token: form.meta_capi_token || null,
          google_ads_id: form.google_ads_id || null,
          google_ads_label: form.google_ads_label || null,
          ga_measurement_id: form.ga_measurement_id || null,
          utmify_token: form.utmify_token || null,
        },
      });
      toast.success("Integrações guardadas");
      qc.invalidateQueries({ queryKey: ["me", "integrations"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Marketing</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Integrações</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Configuração global — cada produto pode substituir estes valores individualmente.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {INTEGRATIONS.map((i) => {
          const configured = i.fields.some((f) => Boolean(form[f.id]));
          return (
            <div key={i.key} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-12 w-12 rounded-xl grid place-items-center bg-background border border-border">
                  {i.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-display font-semibold text-lg" style={{ color: i.color }}>
                      {i.name}
                    </div>
                    {configured && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success font-semibold">
                        ATIVO
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{i.desc}</div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {i.fields.map((f) => (
                  <div key={f.id}>
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      value={form[f.id] ?? ""}
                      onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                      placeholder={f.placeholder}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} className="gradient-brand text-primary-foreground shadow-glow">
          Guardar integrações
        </Button>
      </div>
    </div>
  );
}
