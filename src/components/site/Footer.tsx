import { Link } from "@tanstack/react-router";
import { ArrowRight, Headphones } from "lucide-react";
import logoMark from "@/assets/infropay-mark.png";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/60 bg-card/30">
      <div className="border-b border-border bg-primary/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div className="flex min-w-0 items-center gap-4">
            <Headphones className="h-8 w-8 shrink-0 text-primary-glow" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Estamos ao seu lado</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Suporte, pagamentos e a sua próxima venda.
              </p>
            </div>
          </div>
          <Link
            to="/contactos"
            className="inline-flex items-center gap-2 text-sm text-primary-glow font-medium hover:underline"
          >
            Falar com a equipa <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoMark}
              alt="InfroPay"
              width={512}
              height={512}
              className="h-9 w-9 rounded-lg object-contain"
            />
            <div className="text-lg font-bold">
              Infro<span className="text-gradient-gold">Pay</span>
            </div>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm leading-relaxed">
            A plataforma premium de infoprodutos em Angola. Transformando conhecimento em renda.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Plataforma</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/loja" className="hover:text-foreground">
                Explorar loja
              </Link>
            </li>
            <li>
              <Link to="/legends" className="hover:text-foreground">
                Legends
              </Link>
            </li>
            <li>
              <Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">
                Tornar-se produtor
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Entrar
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Ajuda & Termos</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/sobre" className="hover:text-foreground">
                Sobre
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-foreground">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/contactos" className="hover:text-foreground">
                Contactos
              </Link>
            </li>
            <li>
              <Link to="/termos" className="hover:text-foreground">
                Termos
              </Link>
            </li>
            <li>
              <Link to="/privacidade" className="hover:text-foreground">
                Privacidade
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} InfroPay. Todos os direitos reservados.</div>
        </div>
      </div>
    </footer>
  );
}
