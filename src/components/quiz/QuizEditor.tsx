import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  GripVertical,
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
  Video,
  Upload,
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
import {
  defaultQuizTheme,
  emptyDefinition,
  type QuizDefinition,
  type QuizStep,
  type QuizStepType,
} from "@/lib/quiz-schema";
import { QuizRenderer } from "./QuizRenderer";

const STEP_TYPES: { value: QuizStepType; label: string; desc: string }[] = [
  { value: "multi_choice", label: "Múltipla escolha (texto)", desc: "Pergunta com várias opções" },
  { value: "multi_choice", label: "Múltipla escolha (imagem)", desc: "Opções com imagem" },
  { value: "yes_no", label: "Sim/Não", desc: "Pergunta binária" },
  { value: "text_input", label: "Campo de texto", desc: "Resposta aberta" },
  { value: "lead_capture", label: "Captura de lead", desc: "Nome + WhatsApp" },
  { value: "info_media", label: "Vídeo/Imagem informativa", desc: "Conteúdo educativo" },
  { value: "offer", label: "Tela de oferta", desc: "Página de checkout" },
];

const TEMPLATES = [
  {
    id: "infoproduto",
    name: "Infoproduto",
    desc: "Curso, ebook ou mentorias",
    def: {
      version: 1,
      theme: { ...defaultQuizTheme() },
      start_step_id: "s1",
      steps: [
        {
          id: "s1",
          type: "multi_choice",
          title: "Qual o seu maior desafio para criar o seu infoproduto?",
          options: [
            { id: "o1", label: "Não sei por onde começar", next: "s2" },
            { id: "o2", label: "Falta de audiência", next: "s2" },
            { id: "o3", label: "Dúvidas sobre vendas", next: "s2" },
          ],
        },
        {
          id: "s2",
          type: "lead_capture",
          title: "Descubra o caminho certo para o seu primeiro infoproduto",
          description: "Deixe os seus dados para receber o guia gratuito",
          button_label: "Ver solução",
          note: "Prometemos não enviar spam",
          next: "s3",
        },
        {
          id: "s3",
          type: "offer",
          title: "Oferta Especial",
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
    id: "moda",
    name: "Moda/Cosméticos",
    desc: "Produtos físicos ou beleza",
    def: {
      version: 1,
      theme: { ...defaultQuizTheme(), primary: "#ec4899" },
      start_step_id: "s1",
      steps: [
        {
          id: "s1",
          type: "multi_choice",
          title: "Qual o seu tipo de pele?",
          options: [
            { id: "o1", label: "Oleosa", next: "s2" },
            { id: "o2", label: "Seca", next: "s2" },
            { id: "o3", label: "Mista", next: "s2" },
          ],
        },
        {
          id: "s2",
          type: "lead_capture",
          title: "Recomendação personalizada para si",
          button_label: "Ver recomendação",
          next: "s3",
        },
        {
          id: "s3",
          type: "offer",
          title: "Kit Perfeito Para Si",
          product_title: "Kit Cuidados Essenciais",
          price_label: "14.990 Kz",
          cta_label: "Comprar agora",
          product_slug: "",
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
          title: "Vamos marcar uma consulta gratuita",
          button_label: "Agendar consulta",
          next: "s4",
        },
        {
          id: "s3",
          type: "info_media",
          title: "Quando estiver pronto, estamos aqui",
          button_label: "Voltar ao início",
          next: "s1",
        },
        {
          id: "s4",
          type: "offer",
          title: "Consultoria Estratégica",
          product_title: "Sessão de Consultoria 1h",
          price_label: "25.000 Kz",
          cta_label: "Marcar consulta",
          product_slug: "",
        },
      ],
    },
  },
];

function StepItem({
  step,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  step: QuizStep;
  index: number;
  total: number;
  onUpdate: (step: QuizStep) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{step.title || "Sem título"}</div>
          <div className="text-xs text-muted-foreground">
            {step.type === "multi_choice" && "Múltipla escolha"}
            {step.type === "yes_no" && "Sim/Não"}
            {step.type === "text_input" && "Campo de texto"}
            {step.type === "lead_capture" && "Captura de lead"}
            {step.type === "info_media" && "Vídeo/Imagem informativa"}
            {step.type === "offer" && "Tela de oferta"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => onMove(-1)} disabled={index === 0}>
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <Label className="text-xs">Título</Label>
          <Input
            value={step.title}
            onChange={(e) => onUpdate({ ...step, title: e.target.value })}
            className="mt-1"
          />
        </div>
        {"description" in step && (
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={(step as any).description || ""}
              onChange={(e) => onUpdate({ ...step, description: e.target.value } as QuizStep)}
              className="mt-1"
              rows={2}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs">Mídia (Imagem ou Vídeo)</Label>
          <div className="flex gap-2">
            <Input
              value={(step as any).media?.url || ""}
              onChange={(e) =>
                onUpdate({
                  ...step,
                  media: e.target.value ? { type: (step as any).media?.type || "image", url: e.target.value } : null,
                } as QuizStep)
              }
              placeholder="URL da imagem ou vídeo (https://...)"
              className="flex-1"
            />
            <Select
              value={(step as any).media?.type || "image"}
              onValueChange={(value) =>
                onUpdate({
                  ...step,
                  media: (step as any).media?.url ? { ...((step as any).media || {}), type: value } : null,
                } as QuizStep)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(step as any).media?.url && (
            <div className="mt-2 p-2 border rounded-lg">
              {(step as any).media.type === "video" ? (
                <video src={(step as any).media.url} className="w-full max-h-40 object-cover rounded" controls />
              ) : (
                <img src={(step as any).media.url} alt="" className="w-full max-h-40 object-cover rounded" />
              )}
            </div>
          )}
        </div>
        {(step.type === "multi_choice" || step.type === "yes_no") && (
          <div className="space-y-2">
            <Label className="text-xs">Opções</Label>
            {step.options.map((opt: any, i: number) => (
              <div key={opt.id} className="space-y-2 p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Input
                    value={opt.label}
                    onChange={(e) => {
                      const opts = [...(step as any).options];
                      opts[i] = { ...opt, label: e.target.value };
                      onUpdate({ ...step, options: opts } as QuizStep);
                    }}
                    placeholder="Texto da opção"
                    className="flex-1"
                  />
                  <Input
                    value={opt.next || ""}
                    onChange={(e) => {
                      const opts = [...(step as any).options];
                      opts[i] = { ...opt, next: e.target.value };
                      onUpdate({ ...step, options: opts } as QuizStep);
                    }}
                    placeholder="Próxima etapa ID"
                    className="w-32"
                  />
                  <Input
                    value={opt.score || 0}
                    type="number"
                    onChange={(e) => {
                      const opts = [...(step as any).options];
                      opts[i] = { ...opt, score: Number(e.target.value) };
                      onUpdate({ ...step, options: opts } as QuizStep);
                    }}
                    placeholder="Pts"
                    className="w-16"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const opts = (step as any).options.filter((_: any, idx: number) => idx !== i);
                      onUpdate({ ...step, options: opts } as QuizStep);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={opt.image_url || ""}
                    onChange={(e) => {
                      const opts = [...(step as any).options];
                      opts[i] = { ...opt, image_url: e.target.value };
                      onUpdate({ ...step, options: opts } as QuizStep);
                    }}
                    placeholder="URL da imagem da opção (opcional)"
                    className="flex-1 text-xs"
                  />
                </div>
                {opt.image_url && (
                  <img src={opt.image_url} alt="" className="w-20 h-20 object-cover rounded" />
                )}
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const opts = [
                  ...((step as any).options || []),
                  { id: `opt_${Date.now()}`, label: "Nova opção", next: "", score: 0, image_url: "" },
                ];
                onUpdate({ ...step, options: opts } as QuizStep);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Adicionar opção
            </Button>
          </div>
        )}
        {step.type === "text_input" && (
          <div>
            <Label className="text-xs">Placeholder</Label>
            <Input
              value={(step as any).placeholder || ""}
              onChange={(e) => onUpdate({ ...step, placeholder: e.target.value } as QuizStep)}
              className="mt-1"
            />
          </div>
        )}
        {step.type === "offer" && (
          <>
            <div>
              <Label className="text-xs">Slug do produto InfroPay</Label>
              <Input
                value={(step as any).product_slug || ""}
                onChange={(e) => onUpdate({ ...step, product_slug: e.target.value } as QuizStep)}
                placeholder="ex.: meu-curso"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Preço (exibição)</Label>
              <Input
                value={(step as any).price_label || ""}
                onChange={(e) => onUpdate({ ...step, price_label: e.target.value } as QuizStep)}
                placeholder="9.990 Kz"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Texto do botão</Label>
              <Input
                value={(step as any).cta_label || ""}
                onChange={(e) => onUpdate({ ...step, cta_label: e.target.value } as QuizStep)}
                placeholder="Comprar agora"
                className="mt-1"
              />
            </div>
          </>
        )}
        <div>
          <Label className="text-xs">Texto do botão</Label>
          <Input
            value={(step as any).button_label || ""}
            onChange={(e) => onUpdate({ ...step, button_label: e.target.value } as QuizStep)}
            placeholder="Continuar"
            className="mt-1"
          />
        </div>
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
  const [definition, setDefinition] = useState<QuizDefinition>(
    quiz.definition || emptyDefinition(),
  );
  const [title, setTitle] = useState(quiz.title);
  const [activeTab, setActiveTab] = useState("steps");
  const [preview, setPreview] = useState(false);

  const steps = definition.steps || [];

  function addStep(type: QuizStepType) {
    const id = `step_${Date.now()}`;
    let newStep: any = { id, type, title: "Nova pergunta" };
    if (type === "multi_choice" || type === "yes_no") {
      newStep.options = [
        { id: `opt_${Date.now()}_1`, label: "Opção 1", next: "", score: 0 },
        { id: `opt_${Date.now()}_2`, label: "Opção 2", next: "", score: 0 },
      ];
    }
    if (type === "lead_capture") {
      newStep = { ...newStep, button_label: "Continuar", note: "" };
    }
    if (type === "offer") {
      newStep = { ...newStep, product_slug: "", price_label: "", cta_label: "Comprar agora" };
    }
    setDefinition({ ...definition, steps: [...steps, newStep] });
  }

  function updateStep(idx: number, step: QuizStep) {
    const arr = [...steps];
    arr[idx] = step;
    setDefinition({ ...definition, steps: arr });
  }

  function removeStep(idx: number) {
    if (!confirm("Eliminar esta etapa?")) return;
    const arr = steps.filter((_, i) => i !== idx);
    setDefinition({ ...definition, steps: arr });
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const arr = [...steps];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    const [item] = arr.splice(idx, 1);
    arr.splice(target, 0, item);
    setDefinition({ ...definition, steps: arr });
  }

  function applyTemplate(tpl: any) {
    if (!confirm("Aplicar este template? Isto substituirá o conteúdo atual.")) return;
    setDefinition(tpl.def);
    toast.success(`Template "${tpl.name}" aplicado`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="steps">
                <Settings className="h-4 w-4 mr-2" />
                Etapas
              </TabsTrigger>
              <TabsTrigger value="templates">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="theme">
                <Palette className="h-4 w-4 mr-2" />
                Personalização
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Link2 className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="steps" className="space-y-4 mt-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold">Adicionar etapa</div>
                    <p className="text-sm text-muted-foreground">Escolha o tipo de pergunta</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {[
                    { type: "multi_choice" as QuizStepType, label: "Múltipla escolha", icon: Type },
                    { type: "yes_no" as QuizStepType, label: "Sim/Não", icon: Type },
                    { type: "text_input" as QuizStepType, label: "Texto", icon: Type },
                    { type: "lead_capture" as QuizStepType, label: "Lead", icon: Type },
                    { type: "info_media" as QuizStepType, label: "Mídia", icon: ImageIcon },
                    { type: "offer" as QuizStepType, label: "Oferta", icon: LayoutTemplate },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      variant="outline"
                      size="sm"
                      onClick={() => addStep(item.type)}
                      className="justify-start"
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {steps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                  Nenhuma etapa adicionada. Comece adicionando uma etapa acima.
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, idx) => (
                    <StepItem
                      key={step.id}
                      step={step}
                      index={idx}
                      total={steps.length}
                      onUpdate={(s) => updateStep(idx, s)}
                      onRemove={() => removeStep(idx)}
                      onMove={(dir) => moveStep(idx, dir)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <div className="grid md:grid-cols-3 gap-4">
                {TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="font-semibold">{tpl.name}</div>
                      <p className="text-sm text-muted-foreground mt-1">{tpl.desc}</p>
                      <Button
                        className="mt-4 w-full"
                        variant="outline"
                        onClick={() => applyTemplate(tpl)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Aplicar template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="theme" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div>
                  <div className="font-semibold mb-1">Cores e aparência</div>
                  <p className="text-sm text-muted-foreground">Personalize o visual do seu quiz</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Cor primária</Label>
                    <Input
                      type="color"
                      value={definition.theme?.primary || "#f59e0b"}
                      onChange={(e) =>
                        setDefinition({
                          ...definition,
                          theme: {
                            ...(definition.theme || defaultQuizTheme()),
                            primary: e.target.value,
                          },
                        })
                      }
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fundo</Label>
                    <Input
                      type="color"
                      value={definition.theme?.background || "#0a0a0a"}
                      onChange={(e) =>
                        setDefinition({
                          ...definition,
                          theme: {
                            ...(definition.theme || defaultQuizTheme()),
                            background: e.target.value,
                          },
                        })
                      }
                      className="mt-1 h-10"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Mostrar barra de progresso</div>
                    <p className="text-xs text-muted-foreground">Exibir progresso no topo</p>
                  </div>
                  <Switch
                    checked={definition.theme?.show_progress ?? true}
                    onCheckedChange={(checked) =>
                      setDefinition({
                        ...definition,
                        theme: {
                          ...(definition.theme || defaultQuizTheme()),
                          show_progress: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div>
                  <div className="font-semibold mb-1">Configurações do quiz</div>
                  <p className="text-sm text-muted-foreground">Nome e informações gerais</p>
                </div>
                <div>
                  <Label className="text-xs">Nome do quiz</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">ID da primeira etapa</Label>
                  <Input
                    value={definition.start_step_id}
                    onChange={(e) =>
                      setDefinition({ ...definition, start_step_id: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setPreview(!preview)}>
              <Eye className="h-4 w-4 mr-2" />
              {preview ? "Fechar pré-visualização" : "Pré-visualizar no telemóvel"}
            </Button>
            <Button
              onClick={() => onSave(definition, title)}
              disabled={saving}
              className="gradient-brand text-primary-foreground"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar quiz
            </Button>
          </div>
        </div>

        {preview && (
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-20">
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
                <div className="p-3 border-b border-border text-center text-xs text-muted-foreground">
                  Pré-visualização (modo telemóvel)
                </div>
                <div className="h-[600px] overflow-auto">
                  <QuizRenderer quiz={definition} preview />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
