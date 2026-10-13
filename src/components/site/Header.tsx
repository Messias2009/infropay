import { Link, useRouter } from "@tanstack/react-router";
import { Search, ShoppingBag, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoMark from "@/assets/infropay-mark.png";
import { PWAInstallButton } from "@/components/site/PWAInstallButton";

export function Header() {
  const { user } = useAuth();
  const router = useRouter();

  async function signOut() {
    await router.options.context.queryClient.cancelQueries();
    router.options.context.queryClient.clear();
    await supabase.auth.signOut();
    await router.navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-lg blur-md gradient-brand opacity-50 group-hover:opacity-100 transition" />
            <img
              src={logoMark}
              alt="InfroPay"
              width={512}
              height={512}
              className="relative h-9 w-9 rounded-lg object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">
              Infro<span className="text-gradient-gold">Pay</span>
            </div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">conhecimento em renda</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            to="/loja"
            className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
          >
            Loja
          </Link>
          <Link
            to="/legends"
            className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
          >
            Legends
          </Link>
          <Link
            to="/sobre"
            className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
          >
            Sobre
          </Link>
          <Link
            to="/faq"
            className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
          >
            FAQ
          </Link>
          <Link
            to="/contactos"
            className="px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition"
          >
            Contactos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Search className="h-4 w-4" />
          </Button>
          {user ? (
            <>
              <Link to="/produtor">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  Painel
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem disabled className="text-xs">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/produtor">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Painel do produtor
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button
                  size="sm"
                  className="gradient-brand text-primary-foreground shadow-glow hover:opacity-90"
                >
                  Começar agora
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
