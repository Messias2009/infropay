import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — InfroPay" },
      {
        name: "description",
        content:
          "Respostas às dúvidas mais comuns sobre a InfroPay: comissões, saques, pagamentos, garantia e mais.",
      },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Faq,
});

const FAQS = [
  {
    q: "Quanto custa vender na InfroPay?",
    a: "Cobramos 2% por venda e 8% por saque. Sem mensalidade, sem taxa de setup.",
  },
  {
    q: "Quando recebo o dinheiro das vendas?",
    a: "O valor fica disponível em no mínimo 1 hora após a aprovação do pagamento.",
  },
  { q: "Qual é o saque mínimo?", a: "O saque mínimo é 5.000 Kz." },
  {
    q: "Quais métodos de pagamento aceitam?",
    a: "Multicaixa Express, Referência Multicaixa e Transferência Bancária.",
  },
  {
    q: "Como funciona a garantia?",
    a: "Cada produtor define entre 0 e 60 dias. Dentro desse período, o comprador pode pedir reembolso.",
  },
  {
    q: "Preciso de conta bancária para vender?",
    a: "Sim, apenas para receber o dinheiro. O cadastro é gratuito na área do produtor.",
  },
  {
    q: "Os meus produtos são aprovados automaticamente?",
    a: "Não. Cada produto passa por curadoria para garantir a qualidade da plataforma.",
  },
  {
    q: "Posso vender fora de Angola?",
    a: "Sim, a plataforma é acessível globalmente. O foco de pagamentos é Angola (AOA).",
  },
];

function Faq() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <div className="text-xs font-semibold uppercase tracking-widest text-gold">Ajuda</div>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold">Perguntas frequentes</h1>
        <p className="mt-4 text-muted-foreground">Tudo o que precisa de saber para começar.</p>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`i-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SiteLayout>
  );
}
