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
            Estamos disponíveis para apoiar produtores, afiliados e compradores em Angola através
            dos nossos canais oficiais.
          </p>

          {/* Atalhos Rápidos para Instagram e WhatsApp */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4 text-left">
            <a
              href="https://www.instagram.com/infropay.ao/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-border/80 bg-card hover:border-pink-500/50 hover:bg-accent/30 transition flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-pink-400 transition-colors">
                    Instagram Oficial
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">@infropay.ao</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-pink-400">Abrir &rarr;</span>
            </a>

            <a
              href="https://wa.me/?text=Ol%C3%A1%20equipa%20InfroPay%2C%20preciso%20de%20suporte"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl border border-border/80 bg-card hover:border-emerald-500/50 hover:bg-accent/30 transition flex items-center justify-between group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold group-hover:text-emerald-400 transition-colors">
                    WhatsApp Suporte
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold">Online agora</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400">Conversar &rarr;</span>
            </a>
          </div>
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
