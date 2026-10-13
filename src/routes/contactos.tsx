import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MessageCircle, Phone, MapPin, Send } from "lucide-react";
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
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-semibold uppercase tracking-widest text-gold">Contactos</div>
          <h1 className="mt-2 text-4xl md:text-5xl font-bold">Fale connosco</h1>
          <p className="mt-4 text-muted-foreground">
            Estamos aqui para responder — normalmente em menos de 24 horas.
          </p>
        </div>

        <div className="mt-14 grid lg:grid-cols-[1fr_1.2fr] gap-8">
          <div className="space-y-4">
            {[
              { i: Mail, t: "Email", v: "suporte@infropay.ao", h: "mailto:suporte@infropay.ao" },
              {
                i: MessageCircle,
                t: "WhatsApp",
                v: "+244 900 000 000",
                h: "https://wa.me/244900000000",
              },
              { i: Phone, t: "Telefone", v: "+244 923 000 000", h: "tel:+244923000000" },
              { i: MapPin, t: "Endereço", v: "Luanda, Angola" },
            ].map(({ i: Icon, t, v, h }) => (
              <a
                key={t}
                href={h ?? "#"}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition"
              >
                <div className="h-10 w-10 rounded-lg gradient-brand grid place-items-center shrink-0">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{t}</div>
                  <div className="font-semibold mt-0.5 truncate">{v}</div>
                </div>
              </a>
            ))}
          </div>

          <form
            onSubmit={submit}
            className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input required placeholder="O seu nome" />
              </div>
              <div>
                <Label>Email</Label>
                <Input required type="email" placeholder="voce@email.com" />
              </div>
            </div>
            <div>
              <Label>Assunto</Label>
              <Input required placeholder="Como podemos ajudar?" />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea required rows={6} placeholder="Escreva a sua mensagem..." />
            </div>
            <Button
              disabled={loading}
              type="submit"
              size="lg"
              className="w-full gradient-brand text-primary-foreground shadow-glow h-12"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "A enviar..." : "Enviar mensagem"}
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
