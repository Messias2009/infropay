import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-brand grid place-items-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="text-lg font-bold">Infro<span className="text-gradient-gold">Pay</span></div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Transformando conhecimento em renda. A plataforma premium para produtores digitais.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Plataforma</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/loja" className="hover:text-foreground">Explorar loja</Link></li>
            <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">Tornar-se produtor</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Entrar</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Categorias</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/loja" search={{ cat: "cursos" }} className="hover:text-foreground">Cursos</Link></li>
            <li><Link to="/loja" search={{ cat: "ebooks" }} className="hover:text-foreground">Ebooks</Link></li>
            <li><Link to="/loja" search={{ cat: "templates" }} className="hover:text-foreground">Templates</Link></li>
            <li><Link to="/loja" search={{ cat: "mentorias" }} className="hover:text-foreground">Mentorias</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Legal</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Termos de uso</li>
            <li>Política de privacidade</li>
            <li>Centro de ajuda</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} InfroPay. Todos os direitos reservados.</div>
          <div>Feito com cuidado para produtores digitais.</div>
        </div>
      </div>
    </footer>
  );
}
