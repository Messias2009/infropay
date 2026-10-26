import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { QuizRenderer, type QuizResult } from "@/components/quiz/QuizRenderer";
import type { QuizDefinition } from "@/lib/quiz-schema";
import cover from "@/assets/hero-premium.jpg";
import banner from "@/assets/banner-ganhe.jpg";

/**
 * Pré-visualização pública do renderizador do Quiz Funnel (Passo 2).
 * Não exige sessão nem plano: é uma demonstração com dados de exemplo,
 * sem qualquer informação privada de vendedores.
 * Usa um quiz de demonstração para percorrer todos os tipos de etapa:
 * info, escolha múltipla com imagem, sim/não, campo de texto, captura de
 * lead e tela de oferta.
 */

const DEMO: QuizDefinition = {
  version: 1,
  theme: {
    primary: "#2563eb",
    background: "#0b1020",
    surface: "#151d33",
    text: "#f5f7ff",
    muted: "#9aa4c2",
    logo_url: null,
    font: "inter",
    show_progress: true,
    radius: 18,
  },
  start_step_id: "intro",
  steps: [
    {
      id: "intro",
      type: "info_media",
      title: "Em 6 perguntas descobrimos o plano ideal para si",
      description: "Demora menos de 1 minuto e no fim mostramos a solução certa para o seu caso.",
      media: { type: "image", url: cover },
      button_label: "Começar",
    },
    {
      id: "objetivo",
      type: "multi_choice",
      title: "Qual é o seu principal objectivo?",
      description: "Escolha a opção mais próxima da sua situação.",
      options: [
        {
          id: "vender",
          label: "Vender mais online",
          image_url: banner,
          score: 2,
          tags: ["vendedor"],
        },
        {
          id: "aprender",
          label: "Aprender uma nova skill",
          image_url: cover,
          score: 1,
          tags: ["aluno"],
        },
        { id: "ambos", label: "Aprender e depois vender" },
      ],
    },
    {
      id: "experiencia",
      type: "yes_no",
      title: "Já vendeu alguma vez pela internet?",
      description: "Serve para adequarmos a recomendação ao seu nível.",
      options: [
        { id: "sim", label: "Sim, já vendi", score: 2, tags: ["experiente"], next: "canal" },
        { id: "nao", label: "Ainda não", score: 0, tags: ["iniciante"], next: "canal" },
      ],
    },
    {
      id: "canal",
      type: "multi_choice",
      title: "Por onde costuma falar com clientes?",
      options: [
        { id: "whatsapp", label: "WhatsApp", tags: ["whatsapp"] },
        { id: "instagram", label: "Instagram", tags: ["instagram"] },
        { id: "outro", label: "Outro canal" },
      ],
    },
    {
      id: "nome",
      type: "text_input",
      title: "Como devemos chamar-lhe?",
      description: "Personalizamos a recomendação final.",
      placeholder: "Ex.: João Baptista",
      field: "nome",
      button_label: "Continuar",
    },
    {
      id: "contacto",
      type: "lead_capture",
      title: "Onde enviamos o seu plano?",
      description: "Ficamos ao seu dispor no WhatsApp com a recomendação completa.",
      note: "Sem spam. Apenas a resposta ao seu pedido.",
      button_label: "Ver recomendação",
    },
    {
      id: "oferta",
      type: "offer",
      title: "O seu plano recomendado",
      description: "Com base nas suas respostas, este é o passo certo para começar hoje.",
      product_slug: "curso-completo-de-marketing-digital",
      product_title: "Curso Completo de Marketing Digital",
      price_label: "15.000 Kz",
      cta_label: "Quero começar agora",
      testimonials: [
        { name: "Kiala M.", text: "Vendi mais em 2 meses na InfroPay do que num ano sozinho." },
        { name: "Beatriz T.", text: "O checkout Multicaixa mudou tudo. Conversão triplicou." },
      ],
    },
  ],
};

export const Route = createFileRoute("/quiz/preview")({
  head: () => ({
    meta: [
      { title: "Pré-visualização do Quiz — InfroPay" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizPreview,
});

function QuizPreview() {
  const [key, setKey] = useState(0);
  const [lead, setLead] = useState<{ nome: string; whatsapp: string } | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const quiz = useMemo(() => DEMO, []);

  if (result) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-background">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center space-y-4">
          <div className="text-xs uppercase tracking-widest text-gold font-semibold">
            Pré-visualização
          </div>
          <h1 className="font-display text-2xl font-bold">O renderizador chegou à oferta</h1>
          <p className="text-sm text-muted-foreground">
            Em produção, o botão “{result.offer?.cta_label}” abre o checkout da InfroPay com{" "}
            <span className="font-mono text-xs">{result.offer?.product_slug}</span> e os dados do
            lead pré-preenchidos.
          </p>
          <div className="rounded-xl border border-border bg-secondary/50 p-4 text-left text-xs space-y-1.5">
            <Row k="Lead" v={lead ? `${lead.nome} · ${lead.whatsapp}` : "—"} />
            <Row k="Pontuação" v={String(result.score)} />
            <Row k="Tags" v={result.tags.length ? result.tags.join(", ") : "—"} />
            <Row k="Respostas" v={String(Object.keys(result.answers).length)} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setResult(null);
                setLead(null);
                setKey((k) => k + 1);
              }}
            >
              Repetir quiz
            </Button>
            <Link to="/" className="flex-1">
              <Button className="w-full gradient-brand text-primary-foreground">Voltar</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-4 flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-widest text-gold font-semibold">
          Pré-visualização · mobile-first
        </div>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Início
        </Link>
      </div>
      <QuizRenderer
        key={key}
        quiz={quiz}
        preview
        onLead={(l) => setLead({ nome: l.nome, whatsapp: l.whatsapp })}
        onComplete={(r) => setResult(r)}
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right min-w-0 truncate">{v}</span>
    </div>
  );
}
