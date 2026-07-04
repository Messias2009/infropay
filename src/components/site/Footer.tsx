import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import logoMark from "@/assets/infropay-mark.png";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoMark} alt="InfroPay" width={512} height={512} className="h-9 w-9 rounded-lg object-contain" />
            <div className="text-lg font-bold">Infro<span className="text-gradient-gold">Pay</span></div>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            A plataforma premium de infoprodutos em Angola. Transformando conhecimento em renda desde 2026.
          </p>
          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gold" /> suporte@infropay.ao</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-gold" /> +244 900 000 000</li>
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gold" /> Luanda, Angola</li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold mb-3">Plataforma</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/loja" className="hover:text-foreground">Explorar loja</Link></li>
            <li><Link to="/legends" className="hover:text-foreground">Legends</Link></li>
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
          <div className="text-sm font-semibold mb-3">Institucional</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/sobre" className="hover:text-foreground">Sobre</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link to="/contactos" className="hover:text-foreground">Contactos</Link></li>
            <li><Link to="/termos" className="hover:text-foreground">Termos</Link></li>
            <li><Link to="/privacidade" className="hover:text-foreground">Privacidade</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} InfroPay. Todos os direitos reservados.</div>
          <div>Feito em Angola 🇦🇴 com foco em produtores.</div>
        </div>
      </div>
    </footer>
  );
}
