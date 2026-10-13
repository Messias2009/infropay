import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contactos")({
  head: () => ({
    meta: [
      { title: "Contactos — InfroPay" },
      {
        name: "description",
        content:
          "Fale com a equipa InfroPay: suporte, parcerias, imprensa. Estamos em Luanda, Angola.",
      },
    ],
    links: [{ rel: "canonical", href: "/contactos" }],
  }),
  component: Contactos,
});

function Contactos() {
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Frontend-only para já; enviar via edge function futuramente
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Mensagem enviada! Responderemos em até 24h.");
    (e.target as HTMLFormElement).reset();
    setLoading(false);
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-block rounded-full glass px-4 py-1.5 text-xs font-semibold text-gold border border-gold/30">
            Suporte Oficial
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Fale com a nossa equipa
          </h1>
          <p className="mt-3 text-muted-foreground text-base">
            Envie a sua mensagem ou dúvida. A nossa equipa de suporte responde diretamente para o
            seu email em menos de 24 horas.
          </p>
        </div>

        <div className="mt-10 max-w-2xl mx-auto">
          <form
            onSubmit={submit}
            className="rounded-3xl border border-border bg-card p-6 sm:p-10 space-y-6 shadow-card"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs font-semibold">O seu Nome</Label>
                <Input required placeholder="Ex: Manuel António" className="mt-1.5 h-11" />
              </div>
              <div>
                <Label className="text-xs font-semibold">O seu Email</Label>
                <Input required type="email" placeholder="voce@email.com" className="mt-1.5 h-11" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Assunto</Label>
              <Input
                required
                placeholder="Ex: Dúvida sobre saque, produto ou parceria"
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Mensagem</Label>
              <Textarea
                required
                rows={6}
                placeholder="Descreva a sua solicitação em detalhe para podermos ajudar com rapidez..."
                className="mt-1.5"
              />
            </div>
            <Button
              disabled={loading}
              type="submit"
              size="lg"
              className="w-full gradient-brand text-primary-foreground shadow-glow h-12 text-base font-semibold cursor-pointer"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "A enviar..." : "Enviar mensagem ao suporte"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Atendimento em horário comercial de segunda a sábado.
            </p>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
