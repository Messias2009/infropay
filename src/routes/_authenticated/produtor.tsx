import { createFileRoute, Link, Outlet, useRouterState, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Plus,
  Wallet,
  Banknote,
  Settings,
  Shield,
  ArrowUpRight,
  Trophy,
  Plug,
  UserCircle2,
  Menu,
  TrendingUp,
  GraduationCap,
  Handshake,
  LogOut,
  Headphones,
  Palette,
  Receipt,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logoMark from "@/assets/infropay-mark.png";
import { isAdmin } from "@/lib/admin.functions";
import { getMyPlan } from "@/lib/plans.functions";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SupportModal } from "@/components/site/SupportModal";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const Route = createFileRoute("/_authenticated/produtor")({
  head: () => ({
    meta: [{ title: "Painel do produtor — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: ProdutorLayout,
});

const items = [
  { to: "/produtor", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/produtor/produtos", icon: Package, label: "Produtos" },
  { to: "/produtor/novo", icon: Plus, label: "Novo produto" },
  { to: "/produtor/checkout", icon: Palette, label: "Checkout personalizado" },
  { to: "/produtor/funil", icon: TrendingUp, label: "Funil de vendas" },
  { to: "/produtor/quiz", icon: Sparkles, label: "Quiz" },
  { to: "/membros", icon: GraduationCap, label: "Área de membros" },
  { to: "/produtor/financeiro", icon: Wallet, label: "Financeiro" },
  { to: "/produtor/pedidos", icon: Receipt, label: "Pedidos" },
  { to: "/produtor/saques", icon: Banknote, label: "Saques" },
  { to: "/produtor/conquistas", icon: Trophy, label: "Conquistas" },
  { to: "/afiliados", icon: Handshake, label: "Afiliados" },
  { to: "/produtor/integracoes", icon: Plug, label: "Integrações" },
  { to: "/perfil", icon: UserCircle2, label: "Meu perfil" },
];

function NavBody({
  pathname,
  admin,
  premium,
  onNav,
  onOpenSupport,
}: {
  pathname: string;
  admin?: boolean;
  premium?: boolean;
  onNav?: () => void;
  onOpenSupport?: () => void;
}) {
  const router = useRouter();
  async function signOut() {
    await router.options.context.queryClient.cancelQueries();
    router.options.context.queryClient.clear();
    await supabase.auth.signOut();
    await router.navigate({ to: "/", replace: true });
  }
  return (
    <>
      <nav className="p-3 space-y-1 flex-1 overflow-auto">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2">
          Produtor
        </div>
        {items.map((i) => {
          const isActive = i.exact
            ? pathname === i.to
            : pathname === i.to || pathname.startsWith(i.to + "/");
          const locked = i.to === "/produtor/quiz" && premium === false;
          return (
            <Link
              key={i.to}
              to={i.to}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive ? "gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}
            >
              <i.icon className="h-4 w-4" />
              {i.label}
              {locked && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Premium
                </span>
              )}
            </Link>
          );
        })}

        {admin && (
          <>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 pt-6 pb-2">
              Administração
            </div>
            <Link
              to="/adm"
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${pathname.startsWith("/adm") ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}
            >
              <Shield className="h-4 w-4" /> Painel admin
            </Link>
          </>
        )}
      </nav>
      <div className="p-3 border-t border-border space-y-1">
        <button
          type="button"
          onClick={() => {
            onNav?.();
            onOpenSupport?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gold hover:text-gold hover:bg-gold/10 transition text-left cursor-pointer font-medium"
        >
          <Headphones className="h-4 w-4 text-gold" /> Falar com suporte
        </button>
        <Link
          to="/perfil"
          onClick={onNav}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" /> Configurações
        </Link>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground"
        >
          <LogOut className="h-4 w-4" /> Terminar sessão
        </Button>
      </div>
    </>
  );
}

function ProdutorLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminFn = useServerFn(isAdmin);
  const { data: admin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => isAdminFn(),
    staleTime: 60_000,
  });
  // Estado Premium do backend — controla o cadeado do menu "Quiz".
  const planFn = useServerFn(getMyPlan);
  const { data: plan } = useQuery({
    queryKey: ["plan"],
    queryFn: () => planFn(),
    staleTime: 60_000,
  });
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // Ativa o ouvinte global de vendas push para todo o painel do produtor
  usePushNotifications();

  return (
    <div className="producer-shell min-h-screen flex">
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
      <aside className="hidden md:flex shrink-0 w-64 border-r border-border bg-card/40 flex-col">
        <Link to="/" className="p-5 flex items-center gap-2.5 border-b border-border">
          <img
            src={logoMark}
            alt="InfroPay"
            width={512}
            height={512}
            className="h-9 w-9 rounded-lg object-contain"
          />
          <div>
            <div className="text-lg font-bold leading-none">
              Infro<span className="text-gradient-gold">Pay</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">painel do produtor</div>
          </div>
        </Link>
        <NavBody
          pathname={pathname}
          admin={admin}
          premium={plan?.premium}
          onOpenSupport={() => setSupportOpen(true)}
        />
      </aside>

      <div className="flex-1 min-w-0 w-full flex flex-col">
        {/* Top bar with notifications (visible in both mobile and desktop) */}
        <div className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] md:flex items-center justify-between gap-3 px-4 md:px-6 h-14 border-b border-border bg-background/85 backdrop-blur">
          <Link to="/" className="flex min-w-0 items-center gap-2 md:hidden">
            <img src={logoMark} alt="InfroPay" className="h-7 w-7 rounded-md object-contain" />
            <div className="text-sm font-bold leading-none">
              Infro<span className="text-gradient-gold">Pay</span>
            </div>
          </Link>
          <div className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground">
            Painel do produtor
          </div>
          <div className="contents md:flex md:items-center md:gap-2">
            <div className="col-start-3 row-start-1 justify-self-end">
              <NotificationBell />
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Abrir menu"
                  className="col-start-1 row-start-1 md:hidden h-10 w-10 shrink-0"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86%] max-w-sm p-0 flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <img src={logoMark} alt="" className="h-8 w-8 rounded-md" />
                  <div className="text-base font-bold">Menu do produtor</div>
                </div>
                <NavBody
                  pathname={pathname}
                  admin={admin}
                  premium={plan?.premium}
                  onNav={() => setOpen(false)}
                  onOpenSupport={() => setSupportOpen(true)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <main className="min-w-0 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
