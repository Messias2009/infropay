import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  Film,
  Image as ImageIcon,
  LayoutTemplate,
  Link2,
  Loader2,
  Palette,
  Plus,
  Save,
  Settings,
  Trash2,
  Type,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MediaUpload } from "@/components/MediaUpload";
import {
  defaultQuizTheme,
  emptyDefinition,
  safeColor,
  type QuizDefinition,
  type QuizStep,
  type QuizStepType,
  type QuizTheme,
} from "@/lib/quiz-schema";
import { QuizRenderer } from "./QuizRenderer";
import { QuizShareDialog } from "./QuizShareDialog";
import { copy, quizPublicUrl } from "@/lib/quiz-links";

const ADD_TYPES: { type: QuizStepType; label: string; icon: typeof Type }[] = [
  { type: "multi_choice", label: "Escolha (texto)", icon: Type },
  { type: "multi_choice", label: "Escolha (imagens)", icon: ImageIcon },
  { type: "yes_no", label: "Sim/Não", icon: Type },
  { type: "text_input", label: "Texto livre", icon: Type },
  { type: "lead_capture", label: "Captura de lead", icon: Users },
  { type: "info_media", label: "Vídeo VSL", icon: Video },
  { type: "offer", label: "Oferta", icon: LayoutTemplate },
];

const TYPE_LABEL: Record<QuizStepType, string> = {
  multi_choice: "Escolha múltipla",
  yes_no: "Sim/Não",
  text_input: "Campo de texto",
  lead_capture: "Captura de lead",
  info_media: "Vídeo / informação",
  offer: "Tela de oferta",
};

const THEME_PRESETS: { name: string; theme: Partial<QuizTheme> }[] = [
  {
    name: "Noite azul",
    theme: {
      primary: "#2563eb",
      background: "#0b1020",
      surface: "#131a2e",
      text: "#f5f7ff",
      muted: "#9aa4c2",
    },
  },
  {
    name: "Dourado",
    theme: {
      primary: "#f59e0b",
      background: "#0a0a0a",
      surface: "#17130a",
      text: "#fff8ec",
      muted: "#c9b48c",
    },
  },
  {
    name: "Verde",
    theme: {
      primary: "#22c55e",
      background: "#071410",
      surface: "#0d211a",
      text: "#effff6",
      muted: "#9dc4b1",
    },
  },
  {
    name: "Rosa",
    theme: {
      primary: "#ec4899",
      background: "#150914",
      surface: "#251024",
      text: "#fff0f8",
      muted: "#c99ab5",
    },
  },
  {
    name: "Claro",
    theme: {
      primary: "#111827",
      background: "#f7f8fb",
      surface: "#ffffff",
      text: "#111827",
      muted: "#5b6478",
    },
  },
  {
    name: "Vinho",
    theme: {
      primary: "#e11d48",
      background: "#170a0e",
      surface: "#281015",
      text: "#fff1f3",
      muted: "#c99aa5",
    },
  },
];

const TEMPLATES = [
  {
    id: "infoproduto",
    name: "Infoproduto",
    desc: "Curso, ebook ou mentoria",
    def: {
      version: 1,
      theme: { ...defaultQuizTheme() },
      start_step_id: "s1",
      steps: [
        {
          id: "s1",
          type: "multi_choice",
          title: "Qual é o seu maior desafio para criar o seu infoproduto?",
          description: "Escolha a opção mais próxima da sua realidade.",
          options: [
            { id: "o1", label: "Não sei por onde começar", next: "s2", tags: ["iniciante"] },
            { id: "o2", label: "Falta de audiência", next: "s2", tags: ["audiência"] },
            { id: "o3", label: "Dúvidas sobre vendas", next: "s2", tags: ["vendas"] },
          ],
        },
        {
          id: "s2",
          type: "lead_capture",
          title: "Descubra o caminho certo para o seu primeiro infoproduto",
          description: "Deixe os seus dados para receber o guia gratuito.",
          button_label: "Ver solução",
          note: "Prometemos não enviar spam.",
          next: "s3",
        },
        {
          id: "s3",
          type: "offer",
          title: "Oferta especial",
          product_title: "Guia Completo: Como Criar e Vender Infoprodutos",
          price_label: "9.990 Kz",
          cta_label: "Comprar agora",
          product_slug: "",
          testimonials: [
            { name: "João M.", text: "Consegui criar o meu primeiro produto em 2 semanas!" },
          ],
        },
      ],
    },
  },
  {
    id: "vsl",
    name: "VSL + Quiz",
    desc: "Vídeo de vendas com perguntas",
    def: {
      version: 1,
      theme: {
        ...defaultQuizTheme(),
        primary: "#f59e0b",
        background: "#0a0a0a",
        surface: "#17130a",
      },
      start_step_id: "s1",
      steps: [
        {
          id: "s1",
          type: "info_media",
          title: "Assista antes de responder",
          description: "Em 3 minutos explico exactamente como funciona.",
          media: {
            type: "video",
            url: "",
            vsl: true,
            autoplay: true,
            caption: "Assista até ao fim",
          },
          button_label: "Já vi, continuar",
        },
        {
          id: "s2",
          type: "yes_no",
          title: "Isto faz sentido para o seu momento?",
          options: [
            { id: "sim", label: "Sim, quero avançar", next: "s3", score: 2 },
            { id: "nao", label: "Ainda tenho dúvidas", next: "s4", score: 0 },
          ],
        },
        {
          id: "s3",
          type: "lead_capture",
          title: "Onde enviamos o acesso?",
          button_label: "Ver oferta",
          next: "s4",
        },
        {
          id: "s4",
          type: "offer",
          title: "O seu acesso",
          product_slug: "",
          price_label: "",
          cta_label: "Garantir acesso",
        },
      ],
    },
  },
  {
    id: "servico",
    name: "Serviço",
    desc: "Consultoria ou prestação",
    def: {
      version: 1,
      theme: { ...defaultQuizTheme(), primary: "#22c55e" },
      start_step_id: "s1",
      steps: [
        {
          id: "s1",
          type: "yes_no",
          title: "Precisa de ajuda com o seu negócio?",
          options: [
            { id: "o1", label: "Sim", next: "s2" },
            { id: "o2", label: "Não", next: "s3" },
          ],
        },
        {
          id: "s2",
          type: "lead_capture",
          title: "Vamos marcar uma conversa gratuita",
          button_label: "Agendar",
          next: "s4",
        },
        { id: "s3", type: "info_media", title: "Quando estiver pronto, estamos aqui", next: "s4" },
        {
          id: "s4",
          type: "offer",
          title: "Consultoria estratégica",
          product_title: "Sessão de consultoria 1h",
          price_label: "25.000 Kz",
          cta_label: "Marcar consulta",
          product_slug: "",
        },
      ],
    },
  },
];

function newId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
}

function isHex(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={isHex(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onChange(safeColor(event.target.value, value))}
          className="font-mono text-xs"
          maxLength={40}
        />
      </div>
    </div>
  );
}

function NextStepSelect({
  value,
  steps,
  currentId,
  onChange,
  allowAuto = true,
}: {
  value: string | null | undefined;
  steps: QuizStep[];
  currentId?: string;
  onChange: (value: string | null) => void;
  allowAuto?: boolean;
}) {
  return (
    <Select
      value={value || "__auto"}
      onValueChange={(next) => onChange(next === "__auto" ? null : next)}
    >
      <SelectTrigger className="h-9 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__auto">
          {allowAuto ? "Automático (etapa seguinte)" : "Escolher…"}
        </SelectItem>
        {steps
          .filter((step) => step.id !== currentId)
          .map((step) => (
            <SelectItem key={step.id} value={step.id}>
              {step.title || step.id}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

function StepItem({
  step,
  index,
  total,
  steps,
  onUpdate,
  onRemove,
  onMove,
  onDuplicate,
}: {
  step: QuizStep;
  index: number;
  total: number;
  steps: QuizStep[];
  onUpdate: (step: QuizStep) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
}) {
  const anyStep = step as any;
  const media = anyStep.media as
    | {
        type: "image" | "video";
        url: string;
        poster?: string | null;
        vsl?: boolean;
        autoplay?: boolean;
        unlock_after?: number | null;
        caption?: string | null;
      }
    | null
    | undefined;

  function setMedia(patch: Record<string, unknown> | null) {
    if (patch === null) {
      onUpdate({ ...step, media: null } as QuizStep);
      return;
    }
    onUpdate({
      ...step,
      media: { type: media?.type ?? "image", url: media?.url ?? "", ...media, ...patch },
    } as QuizStep);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 p-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{step.title || "Sem título"}</div>
          <div className="text-xs text-muted-foreground">
            {TYPE_LABEL[step.type]}
            {media?.type === "video" ? " · VSL" : media?.url ? " · imagem" : ""}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => onDuplicate()} title="Duplicar etapa">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="Subir"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title="Descer"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove} title="Eliminar">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <Label className="text-xs">Título</Label>
          <Input
            value={step.title}
            onChange={(event) => onUpdate({ ...step, title: event.target.value } as QuizStep)}
            className="mt-1"
            maxLength={240}
          />
        </div>

        {"description" in step && (
          <div>
            <Label className="text-xs">Descrição (opcional)</Label>
            <Textarea
              value={anyStep.description || ""}
              onChange={(event) =>
                onUpdate({ ...step, description: event.target.value } as QuizStep)
              }
              className="mt-1"
              rows={2}
              maxLength={1200}
            />
          </div>
        )}

        {/* MÍDIA: imagem ou vídeo (VSL) */}
        <div className="space-y-2 rounded-lg border border-border/70 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mídia</Label>
            <div className="flex rounded-md border border-border p-0.5 text-[11px]">
              {(["image", "video"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setMedia({ type: kind })}
                  className={`rounded px-2 py-1 font-medium transition ${
                    (media?.type ?? "image") === kind
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {kind === "image" ? "Imagem" : "Vídeo (VSL)"}
                </button>
              ))}
            </div>
          </div>

          {media?.url ? (
            <div className="space-y-2">
              {media.type === "video" ? (
                <video
                  src={media.url}
                  className="max-h-44 w-full rounded-lg bg-black object-contain"
                  controls
                />
              ) : (
                <img src={media.url} alt="" className="max-h-44 w-full rounded-lg object-cover" />
              )}
              <div className="flex gap-2">
                <MediaUpload
                  value={null}
                  kind={media.type === "video" ? "video" : "image"}
                  productKey="quiz"
                  label="Substituir"
                  compact
                  onChange={(url) => url && setMedia({ url })}
                />
                <Button variant="outline" size="sm" onClick={() => setMedia(null)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <MediaUpload
              value={null}
              kind={media?.type === "video" ? "video" : "image"}
              productKey="quiz"
              label={media?.type === "video" ? "Carregar vídeo" : "Carregar imagem"}
              onChange={(url) => url && setMedia({ url })}
            />
          )}

          <Input
            value={media?.url ?? ""}
            onChange={(event) => setMedia({ url: event.target.value })}
            placeholder="…ou cole um URL (https://…)"
            className="font-mono text-xs"
          />

          {media?.type === "video" && (
            <div className="space-y-3 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">Modo VSL</div>
                  <p className="text-[11px] text-muted-foreground">
                    Sem controlos de download, botão seguinte só no fim
                  </p>
                </div>
                <Switch
                  checked={media.vsl !== false}
                  onCheckedChange={(vsl) => setMedia({ vsl })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium">Arrancar em silêncio</div>
                  <p className="text-[11px] text-muted-foreground">
                    Autoplay muted ao abrir a etapa
                  </p>
                </div>
                <Switch
                  checked={media.autoplay !== false}
                  onCheckedChange={(autoplay) => setMedia({ autoplay })}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Label className="text-[11px]">Desbloquear aos (segundos)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={3600}
                    value={media.unlock_after ?? 0}
                    onChange={(event) =>
                      setMedia({ unlock_after: Number(event.target.value) || 0 })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">0 = só no fim do vídeo</p>
                </div>
                <div>
                  <Label className="text-[11px]">Etiqueta no vídeo</Label>
                  <Input
                    value={media.caption ?? ""}
                    onChange={(event) => setMedia({ caption: event.target.value })}
                    placeholder="Assista até ao fim"
                    maxLength={120}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px]">Miniatura (poster)</Label>
                <div className="mt-1 flex gap-2">
                  {media.poster ? (
                    <img src={media.poster} alt="" className="h-12 w-20 rounded object-cover" />
                  ) : null}
                  <MediaUpload
                    value={null}
                    kind="image"
                    productKey="quiz"
                    label="Carregar capa"
                    compact
                    onChange={(url) => setMedia({ poster: url })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {(step.type === "multi_choice" || step.type === "yes_no") && (
          <div className="space-y-2">
            <Label className="text-xs">Opções</Label>
            {step.options.map((option, optionIndex) => (
              <div key={option.id} className="space-y-2 rounded-lg border border-border/70 p-2.5">
                <div className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(event) => {
                      const options = [...step.options];
                      options[optionIndex] = { ...option, label: event.target.value };
                      onUpdate({ ...step, options } as QuizStep);
                    }}
                    placeholder="Texto da opção"
                    className="flex-1"
                    maxLength={240}
                  />
                  <Input
                    value={option.score ?? 0}
                    type="number"
                    onChange={(event) => {
                      const options = [...step.options];
                      options[optionIndex] = { ...option, score: Number(event.target.value) || 0 };
                      onUpdate({ ...step, options } as QuizStep);
                    }}
                    title="Pontuação"
                    className="w-16 text-center"
                    min={-999}
                    max={999}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Eliminar opção"
                    onClick={() => {
                      if (step.options.length <= (step.type === "yes_no" ? 2 : 1)) {
                        toast.error("Esta etapa precisa de mais opções.");
                        return;
                      }
                      onUpdate({
                        ...step,
                        options: step.options.filter((_, i) => i !== optionIndex),
                      } as QuizStep);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <NextStepSelect
                      value={option.next ?? null}
                      steps={steps}
                      currentId={step.id}
                      onChange={(next) => {
                        const options = [...step.options];
                        options[optionIndex] = { ...option, next };
                        onUpdate({ ...step, options } as QuizStep);
                      }}
                    />
                  </div>
                  <MediaUpload
                    value={null}
                    kind="image"
                    productKey="quiz"
                    label={option.image_url ? "Trocar foto" : "Foto"}
                    compact
                    onChange={(url) => {
                      const options = [...step.options];
                      options[optionIndex] = { ...option, image_url: url };
                      onUpdate({ ...step, options } as QuizStep);
                    }}
                  />
                  {option.image_url ? (
                    <img src={option.image_url} alt="" className="h-9 w-9 rounded object-cover" />
                  ) : null}
                </div>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={step.type === "yes_no" || step.options.length >= 10}
              onClick={() =>
                onUpdate({
                  ...step,
                  options: [...step.options, { id: newId("opt"), label: "Nova opção", score: 0 }],
                } as QuizStep)
              }
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              {step.type === "yes_no" ? "Sim/Não: duas opções fixas" : "Adicionar opção"}
            </Button>
          </div>
        )}

        {step.type === "text_input" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Texto de exemplo (placeholder)</Label>
              <Input
                value={anyStep.placeholder || ""}
                onChange={(event) =>
                  onUpdate({ ...step, placeholder: event.target.value } as QuizStep)
                }
                className="mt-1"
                maxLength={120}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
              <div>
                <div className="text-xs font-medium">Resposta obrigatória</div>
                <p className="text-[11px] text-muted-foreground">Impede avançar em branco</p>
              </div>
              <Switch
                checked={anyStep.required !== false}
                onCheckedChange={(required) => onUpdate({ ...step, required } as QuizStep)}
              />
            </div>
          </div>
        )}

        {step.type === "lead_capture" && (
          <div>
            <Label className="text-xs">Nota de privacidade (opcional)</Label>
            <Input
              value={anyStep.note || ""}
              onChange={(event) => onUpdate({ ...step, note: event.target.value } as QuizStep)}
              placeholder="Sem spam. Apenas a resposta ao seu pedido."
              className="mt-1"
              maxLength={400}
            />
          </div>
        )}

        {step.type === "offer" && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Slug do produto InfroPay</Label>
                <Input
                  value={anyStep.product_slug || ""}
                  onChange={(event) =>
                    onUpdate({ ...step, product_slug: event.target.value } as QuizStep)
                  }
                  placeholder="ex.: meu-curso"
                  className="mt-1 font-mono text-xs"
                  maxLength={160}
                />
              </div>
              <div>
                <Label className="text-xs">Título mostrado</Label>
                <Input
                  value={anyStep.product_title || ""}
                  onChange={(event) =>
                    onUpdate({ ...step, product_title: event.target.value } as QuizStep)
                  }
                  placeholder="Nome do produto"
                  className="mt-1"
                  maxLength={240}
                />
              </div>
              <div>
                <Label className="text-xs">Preço (exibição)</Label>
                <Input
                  value={anyStep.price_label || ""}
                  onChange={(event) =>
                    onUpdate({ ...step, price_label: event.target.value } as QuizStep)
                  }
                  placeholder="9.990 Kz"
                  className="mt-1"
                  maxLength={60}
                />
              </div>
              <div>
                <Label className="text-xs">Texto do botão</Label>
                <Input
                  value={anyStep.cta_label || ""}
                  onChange={(event) =>
                    onUpdate({ ...step, cta_label: event.target.value } as QuizStep)
                  }
                  placeholder="Comprar agora"
                  className="mt-1"
                  maxLength={80}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border/70 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Provas sociais</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={(anyStep.testimonials?.length ?? 0) >= 6}
                  onClick={() =>
                    onUpdate({
                      ...step,
                      testimonials: [
                        ...((anyStep.testimonials as any[]) ?? []),
                        { name: "", text: "" },
                      ],
                    } as QuizStep)
                  }
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>
              {((anyStep.testimonials as any[]) ?? []).map((testimonial, tIndex) => (
                <div key={tIndex} className="flex items-start gap-2">
                  <Input
                    value={testimonial.name}
                    onChange={(event) => {
                      const list = [...anyStep.testimonials];
                      list[tIndex] = { ...testimonial, name: event.target.value };
                      onUpdate({ ...step, testimonials: list } as QuizStep);
                    }}
                    placeholder="Nome"
                    className="w-28 text-xs"
                    maxLength={120}
                  />
                  <Input
                    value={testimonial.text}
                    onChange={(event) => {
                      const list = [...anyStep.testimonials];
                      list[tIndex] = { ...testimonial, text: event.target.value };
                      onUpdate({ ...step, testimonials: list } as QuizStep);
                    }}
                    placeholder="O que disseram"
                    className="flex-1 text-xs"
                    maxLength={400}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onUpdate({
                        ...step,
                        testimonials: anyStep.testimonials.filter(
                          (_: any, i: number) => i !== tIndex,
                        ),
                      } as QuizStep)
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {step.type !== "offer" && (
            <div>
              <Label className="text-xs">Texto do botão</Label>
              <Input
                value={anyStep.button_label || ""}
                onChange={(event) =>
                  onUpdate({ ...step, button_label: event.target.value } as QuizStep)
                }
                placeholder="Continuar"
                className="mt-1"
                maxLength={60}
              />
            </div>
          )}
          {step.type !== "offer" && step.type !== "lead_capture" && (
            <div>
              <Label className="text-xs">Depois desta etapa, ir para</Label>
              <div className="mt-1">
                <NextStepSelect
                  value={step.next ?? null}
                  steps={steps}
                  currentId={step.id}
                  onChange={(next) => onUpdate({ ...step, next } as QuizStep)}
                />
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground">
          ID da etapa: <span className="font-mono">{step.id}</span>
        </p>
      </div>
    </div>
  );
}

export function QuizEditor({
  quiz,
  onSave,
  saving,
}: {
  quiz: any;
  onSave: (def: QuizDefinition, title?: string) => void;
  saving: boolean;
}) {
  const [definition, setDefinition] = useState<QuizDefinition>(() => normalize(quiz));
  const [title, setTitle] = useState(quiz.title ?? "");
  const [activeTab, setActiveTab] = useState("steps");
  const [preview, setPreview] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    setDefinition(normalize(quiz));
    setTitle(quiz.title ?? "");
  }, [quiz.id, quiz.updated_at]);

  const steps = definition.steps || [];
  const theme = definition.theme ?? defaultQuizTheme();
  const publicUrl = quiz.slug ? quizPublicUrl(quiz.slug) : "";

  function patchTheme(patch: Partial<QuizTheme>) {
    setDefinition((current) => ({
      ...current,
      theme: { ...(current.theme ?? defaultQuizTheme()), ...patch },
    }));
  }

  function addStep(type: QuizStepType, withImages = false) {
    if (steps.length >= 60) {
      toast.error("Este quiz já atingiu o limite de 60 etapas.");
      return;
    }
    const id = newId("step");
    const step: any = { id, type, title: type === "offer" ? "Oferta especial" : "Nova pergunta" };
    if (type === "multi_choice" || type === "yes_no") {
      step.options =
        type === "yes_no"
          ? [
              { id: newId("opt"), label: "Sim", score: 1 },
              { id: newId("opt"), label: "Não", score: 0 },
            ]
          : [
              { id: newId("opt"), label: "Opção 1", score: 0, image_url: withImages ? "" : null },
              { id: newId("opt"), label: "Opção 2", score: 0, image_url: withImages ? "" : null },
            ];
    }
    if (type === "lead_capture") step.button_label = "Continuar";
    if (type === "info_media") {
      step.media = { type: "video", url: "", vsl: true, autoplay: true };
      step.button_label = "Continuar";
    }
    if (type === "offer") {
      Object.assign(step, { product_slug: "", price_label: "", cta_label: "Comprar agora" });
    }

    setDefinition((current) => {
      const currentSteps = Array.isArray(current.steps) ? current.steps : [];
      return {
        ...current,
        steps: [...currentSteps, step as QuizStep],
        start_step_id:
          current.start_step_id && currentSteps.some((s) => s.id === current.start_step_id)
            ? current.start_step_id
            : id,
      };
    });
  }

  function updateStep(index: number, step: QuizStep) {
    setDefinition((current) => {
      const list = [...(current.steps || [])];
      if (index < 0 || index >= list.length) return current;
      list[index] = step;
      return { ...current, steps: list };
    });
  }

  function removeStep(index: number) {
    const removed = steps[index];
    if (!removed || !confirm("Eliminar esta etapa?")) return;
    setDefinition((current) => {
      const list = (current.steps || [])
        .filter((_, i) => i !== index)
        .map((step: any) => ({
          ...step,
          ...(step.next === removed.id ? { next: null } : {}),
          ...(Array.isArray(step.options)
            ? {
                options: step.options.map((option: any) =>
                  option.next === removed.id ? { ...option, next: null } : option,
                ),
              }
            : {}),
        }));
      return {
        ...current,
        steps: list,
        start_step_id: list.some((s) => s.id === current.start_step_id)
          ? current.start_step_id
          : (list[0]?.id ?? ""),
      };
    });
  }

  function duplicateStep(index: number) {
    const source = steps[index];
    if (!source) return;
    if (steps.length >= 60) {
      toast.error("Limite de 60 etapas.");
      return;
    }
    const clone: any = structuredClone({ ...source, id: newId("step") });
    if (Array.isArray(clone.options)) {
      clone.options = clone.options.map((option: any) => ({
        ...option,
        id: newId("opt"),
        next: null,
      }));
    }
    clone.next = null;
    setDefinition((current) => {
      const list = [...(current.steps || [])];
      list.splice(index + 1, 0, clone as QuizStep);
      return { ...current, steps: list };
    });
  }

  function moveStep(index: number, dir: -1 | 1) {
    setDefinition((current) => {
      const list = [...(current.steps || [])];
      const target = index + dir;
      if (target < 0 || target >= list.length) return current;
      const [item] = list.splice(index, 1);
      list.splice(target, 0, item);
      return { ...current, steps: list };
    });
  }

  function applyTemplate(template: (typeof TEMPLATES)[number]) {
    if (!confirm(`Aplicar o template "${template.name}"? Isto substitui o conteúdo atual.`)) return;
    setDefinition(template.def as QuizDefinition);
    toast.success(`Template "${template.name}" aplicado`);
  }

  const completion = useMemo(() => {
    const issues: string[] = [];
    if (steps.length === 0) issues.push("Adicione pelo menos uma etapa.");
    if (steps.length > 0 && !steps.some((s) => s.id === definition.start_step_id))
      issues.push("Escolha a etapa inicial.");
    const offer = steps.find((s) => s.type === "offer") as any;
    if (offer && !String(offer.product_slug ?? "").trim())
      issues.push("A oferta precisa de um produto.");
    const video = steps.find((s) => (s as any).media?.type === "video") as any;
    if (video && !video.media?.url) issues.push("O vídeo VSL ainda não tem ficheiro/link.");
    return issues;
  }, [definition.start_step_id, steps]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="steps">
                <Settings className="mr-2 h-4 w-4" />
                Etapas
              </TabsTrigger>
              <TabsTrigger value="templates">
                <LayoutTemplate className="mr-2 h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="theme">
                <Palette className="mr-2 h-4 w-4" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Link2 className="mr-2 h-4 w-4" />
                Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="steps" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3">
                  <div className="font-semibold">Adicionar etapa</div>
                  <p className="text-sm text-muted-foreground">
                    Perguntas, captura de lead, vídeo VSL e oferta final
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {ADD_TYPES.map((item) => (
                    <Button
                      key={item.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={steps.length >= 60}
                      onClick={() => addStep(item.type, item.label.includes("imagens"))}
                      className="justify-start"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {steps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                  Nenhuma etapa. Comece por uma pergunta ou por um vídeo VSL.
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <StepItem
                      key={step.id}
                      step={step}
                      index={index}
                      total={steps.length}
                      steps={steps}
                      onUpdate={(next) => updateStep(index, next)}
                      onRemove={() => removeStep(index)}
                      onMove={(dir) => moveStep(index, dir)}
                      onDuplicate={() => duplicateStep(index)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                {TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <div className="p-5">
                      <div className="font-semibold">{template.name}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{template.desc}</p>
                      <Button
                        className="mt-4 w-full"
                        variant="outline"
                        onClick={() => applyTemplate(template)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Aplicar template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="theme" className="mt-4 space-y-4">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3">
                  <div className="font-semibold">Paletas prontas</div>
                  <p className="text-sm text-muted-foreground">
                    Um clique para mudar o ambiente do quiz
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => patchTheme(preset.theme)}
                      className="flex items-center gap-2 rounded-lg border border-border p-2 text-left text-xs transition hover:border-primary"
                    >
                      <span
                        className="h-8 w-8 shrink-0 rounded-md"
                        style={{
                          background: `linear-gradient(135deg, ${preset.theme.primary} 50%, ${preset.theme.background} 50%)`,
                        }}
                      />
                      <span className="font-medium">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <div>
                  <div className="font-semibold">Cores</div>
                  <p className="text-sm text-muted-foreground">
                    Personalize cada detalhe da página
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ColorField
                    label="Cor principal (botões e progresso)"
                    value={theme.primary}
                    onChange={(primary) => patchTheme({ primary })}
                  />
                  <ColorField
                    label="Fundo"
                    value={theme.background}
                    onChange={(background) => patchTheme({ background })}
                  />
                  <ColorField
                    label="Cartões / superfícies"
                    value={theme.surface}
                    onChange={(surface) => patchTheme({ surface })}
                  />
                  <ColorField
                    label="Texto"
                    value={theme.text}
                    onChange={(text) => patchTheme({ text })}
                  />
                  <ColorField
                    label="Texto secundário"
                    value={theme.muted}
                    onChange={(muted) => patchTheme({ muted })}
                  />
                  <div>
                    <Label className="text-xs">Tipo de letra</Label>
                    <Select
                      value={theme.font}
                      onValueChange={(font) => patchTheme({ font: font as QuizTheme["font"] })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter (moderna)</SelectItem>
                        <SelectItem value="display">Space Grotesk (títulos)</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Logótipo</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {theme.logo_url ? (
                        <img
                          src={theme.logo_url}
                          alt=""
                          className="h-10 w-10 rounded object-contain"
                        />
                      ) : null}
                      <MediaUpload
                        value={null}
                        kind="image"
                        productKey="quiz"
                        label={theme.logo_url ? "Trocar logótipo" : "Carregar logótipo"}
                        compact
                        onChange={(url) => patchTheme({ logo_url: url })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Imagem de fundo</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {theme.background_url ? (
                        <img
                          src={theme.background_url}
                          alt=""
                          className="h-10 w-14 rounded object-cover"
                        />
                      ) : null}
                      <MediaUpload
                        value={null}
                        kind="image"
                        productKey="quiz"
                        label={theme.background_url ? "Trocar fundo" : "Carregar fundo"}
                        compact
                        onChange={(url) => patchTheme({ background_url: url })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Arredondamento dos cantos: {theme.radius}px</Label>
                    <input
                      type="range"
                      min={0}
                      max={40}
                      value={theme.radius}
                      onChange={(event) => patchTheme({ radius: Number(event.target.value) })}
                      className="mt-2 w-full accent-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <div className="text-sm font-medium">Barra de progresso</div>
                      <p className="text-xs text-muted-foreground">Mostrar passos no topo</p>
                    </div>
                    <Switch
                      checked={theme.show_progress}
                      onCheckedChange={(show_progress) => patchTheme({ show_progress })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <div>
                  <div className="font-semibold">Nome e link</div>
                  <p className="text-sm text-muted-foreground">
                    O link público fica activo quando o quiz está publicado
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Nome do quiz</Label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="mt-1"
                    maxLength={120}
                  />
                </div>
                <div>
                  <Label className="text-xs">Etapa inicial</Label>
                  <div className="mt-1">
                    <Select
                      value={definition.start_step_id || "__none"}
                      onValueChange={(value) =>
                        setDefinition({
                          ...definition,
                          start_step_id: value === "__none" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolher etapa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">Escolher…</SelectItem>
                        {steps.map((step, index) => (
                          <SelectItem key={step.id} value={step.id}>
                            {index + 1}. {step.title || step.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {publicUrl && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Link público
                    </div>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={publicUrl} className="font-mono text-xs" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (await copy(publicUrl)) {
                            setShareCopied(true);
                            toast.success("Link copiado");
                            setTimeout(() => setShareCopied(false), 1500);
                          }
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}>
                        QR / Partilhar
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {shareCopied
                        ? "Copiado!"
                        : quiz.status === "publicado"
                          ? "Pronto a usar nos anúncios."
                          : "Publique o quiz para o link ficar acessível."}
                    </p>
                  </div>
                )}
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {completion.length === 0 ? (
                    <li className="text-success">Tudo pronto para publicar.</li>
                  ) : (
                    completion.map((issue) => <li key={issue}>• {issue}</li>)
                  )}
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="outline" onClick={() => setPreview((value) => !value)}>
              <Eye className="mr-2 h-4 w-4" />
              {preview ? "Fechar pré-visualização" : "Pré-visualizar no telemóvel"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (title.trim().length < 2) {
                  toast.error("O nome do quiz deve ter pelo menos 2 caracteres.");
                  setActiveTab("settings");
                  return;
                }
                if (steps.length === 0) {
                  toast.error("Adicione pelo menos uma etapa antes de guardar.");
                  setActiveTab("steps");
                  return;
                }
                if (!steps.some((step) => step.id === definition.start_step_id)) {
                  toast.error("Escolha uma etapa inicial válida.");
                  setActiveTab("settings");
                  return;
                }
                onSave(definition, title.trim());
              }}
              disabled={saving}
              className="gradient-brand text-primary-foreground"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar quiz
            </Button>
          </div>
        </div>

        {preview && (
          <div className="w-full shrink-0 lg:w-[400px]">
            <div className="sticky top-20">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border p-3 text-xs text-muted-foreground">
                  <span>Pré-visualização</span>
                  <span className="inline-flex items-center gap-1">
                    <Film className="h-3 w-3" /> mobile-first
                  </span>
                </div>
                <div className="h-[640px] overflow-auto">
                  <QuizRenderer quiz={definition} preview chrome />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <QuizShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        slug={quiz.slug ?? ""}
        title={title || quiz.title || "Quiz"}
        published={quiz.status === "publicado"}
      />
    </div>
  );
}

function normalize(quiz: any): QuizDefinition {
  const saved = quiz?.definition && typeof quiz.definition === "object" ? quiz.definition : {};
  return {
    ...emptyDefinition(),
    ...saved,
    theme: { ...defaultQuizTheme(), ...(saved.theme ?? {}) },
    steps: Array.isArray(saved.steps) ? saved.steps : [],
    start_step_id: typeof saved.start_step_id === "string" ? saved.start_step_id : "",
  } as QuizDefinition;
}
