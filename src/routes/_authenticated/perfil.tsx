import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trophy, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/components/MediaUpload";
import { getMyAchievements, getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { LEVELS, levelFor } from "@/lib/legends.functions";
import { kz } from "@/components/finance/FeeBanner";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [{ title: "Meu perfil — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(updateMyProfile);
  const achFn = useServerFn(getMyAchievements);
  const { data: p } = useQuery({ queryKey: ["me", "profile"], queryFn: () => getFn() });
  const { data: ach } = useQuery({ queryKey: ["me", "achievements"], queryFn: () => achFn() });

  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (p) setForm(p);
  }, [p]);

  const revenue = ach?.revenue_cents ?? 0;
  const level = levelFor(revenue);
  const idx = LEVELS.findIndex((l) => l.key === level.key);
  const next = LEVELS[idx + 1];
  const pct = next
    ? Math.min(
        100,
        Math.round(((revenue - level.min_cents) / (next.min_cents - level.min_cents)) * 100),
      )
    : 100;

  async function save() {
    try {
      await saveFn({
        data: {
          full_name: form.full_name ?? null,
          username: form.username?.trim() ? form.username : null,
          bio: form.bio ?? null,
          avatar_url: form.avatar_url ?? null,
          cover_url: form.cover_url ?? null,
          social_instagram: form.social_instagram ?? null,
          social_website: form.social_website ?? null,
        },
      });
      toast.success("Perfil atualizado");
      qc.invalidateQueries({ queryKey: ["me", "profile"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao guardar");
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="text-xs uppercase tracking-widest text-gold font-semibold">Conta</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Meu perfil</h1>
      </div>

      {/* Nível atual */}
      <div
        className="rounded-2xl border p-5 relative overflow-hidden"
        style={{ borderColor: level.color + "60" }}
      >
        <div className="absolute inset-0 opacity-20" style={{ background: level.gradient }} />
        <div className="relative flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-2xl grid place-items-center shrink-0"
            style={{ background: level.gradient }}
          >
            <Trophy className="h-7 w-7 text-white drop-shadow" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Nível atual
            </div>
            <div className="font-display text-2xl font-bold" style={{ color: level.color }}>
              {level.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Faturamento: <b className="text-foreground">{kz(revenue)}</b> ·{" "}
              {ach?.sales_count ?? 0} vendas
            </div>
            {next && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${pct}%`, background: next.gradient }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Próximo nível: <b>{next.name}</b> — faltam {kz(next.min_cents - revenue)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Foto de perfil</Label>
            <div className="mt-1">
              <MediaUpload
                value={form.avatar_url}
                onChange={(u) => setForm((f: any) => ({ ...f, avatar_url: u }))}
                label=""
                hint="Recomendado 512×512"
              />
            </div>
          </div>
          <div>
            <Label>Capa</Label>
            <div className="mt-1">
              <MediaUpload
                value={form.cover_url}
                onChange={(u) => setForm((f: any) => ({ ...f, cover_url: u }))}
                label=""
                hint="Recomendado 1600×400"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Nome completo</Label>
            <Input
              value={form.full_name ?? ""}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label>Nome de utilizador</Label>
            <div className="flex items-center gap-2 mt-1 h-10 rounded-md border border-input bg-background px-3">
              <span className="text-muted-foreground text-sm">@</span>
              <input
                className="bg-transparent outline-none text-sm flex-1"
                value={form.username ?? ""}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="seunome"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea
            rows={3}
            maxLength={400}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Fale um pouco sobre si..."
          />
          <div className="text-[10px] text-muted-foreground mt-1 text-right">
            {(form.bio ?? "").length}/400
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Instagram</Label>
            <Input
              value={form.social_instagram ?? ""}
              onChange={(e) => setForm({ ...form, social_instagram: e.target.value })}
              placeholder="@handle"
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={form.social_website ?? ""}
              onChange={(e) => setForm({ ...form, social_website: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} className="gradient-brand text-primary-foreground shadow-glow">
            Guardar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
