import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { LayoutDashboard, Package, Plus, Wallet, Banknote, Settings, Shield, ArrowUpRight, Trophy, Plug, UserCircle2, Menu } from "lucide-react";
import logoMark from "@/assets/infropay-mark.png";
import { isAdmin } from "@/lib/admin.functions";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export const Route = createFileRoute("/_authenticated/produtor")({
  head: () => ({ meta: [{ title: "Painel do produtor — InfroPay" }, { name: "robots", content: "noindex" }] }),
  component: ProdutorLayout,
});

const items = [
  { to: "/produtor", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/produtor/produtos", icon: Package, label: "Produtos" },
  { to: "/produtor/novo", icon: Plus, label: "Novo produto" },
  { to: "/produtor/financeiro", icon: Wallet, label: "Financeiro" },
  { to: "/produtor/saques", icon: Banknote, label: "Saques" },
  { to: "/produtor/conquistas", icon: Trophy, label: "Conquistas" },
  { to: "/produtor/integracoes", icon: Plug, label: "Integrações" },
  { to: "/perfil", icon: UserCircle2, label: "Meu perfil" },
];

function NavBody({ pathname, admin, onNav }: { pathname: string; admin?: boolean; onNav?: () => void }) {
  return (
    <>
      <nav className="p-3 space-y-1 flex-1 overflow-auto">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2">Produtor</div>
        {items.map((i) => {
          const isActive = i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(i.to + "/");
          return (
            <Link key={i.to} to={i.to} onClick={onNav} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive ? "gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}>
              <i.icon className="h-4 w-4" />
              {i.label}
            </Link>
          );
        })}

        {admin && (
          <>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 pt-6 pb-2">Administração</div>
            <Link to="/adm" onClick={onNav} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${pathname.startsWith("/adm") ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}>
              <Shield className="h-4 w-4" /> Painel admin
            </Link>
          </>
        )}
      </nav>
      <div className="p-3 border-t border-border space-y-1">
        <Link to="/" onClick={onNav} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
          <ArrowUpRight className="h-4 w-4" /> Ver site
        </Link>
        <Link to="/perfil" onClick={onNav} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" /> Configurações
        </Link>
      </div>
    </>
  );
}

function ProdutorLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminFn = useServerFn(isAdmin);
  const { data: admin } = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn(), staleTime: 60_000 });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 border-r border-border bg-card/40 flex-col">
        <Link to="/" className="p-5 flex items-center gap-2.5 border-b border-border">
          <img src={logoMark} alt="InfroPay" width={512} height={512} className="h-9 w-9 rounded-lg object-contain" />
          <div>
            <div className="text-lg font-bold leading-none">Infro<span className="text-gradient-gold">Pay</span></div>
            <div className="text-[10px] text-muted-foreground mt-0.5">painel do produtor</div>
          </div>
        </Link>
        <NavBody pathname={pathname} admin={admin} />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar with notifications (visible in both mobile and desktop) */}
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-6 h-14 border-b border-border bg-background/85 backdrop-blur">
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <img src={logoMark} alt="InfroPay" className="h-7 w-7 rounded-md object-contain" />
            <div className="text-sm font-bold leading-none">Infro<span className="text-gradient-gold">Pay</span></div>
          </Link>
          <div className="hidden md:block text-xs uppercase tracking-widest text-muted-foreground">Painel do produtor</div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button aria-label="Abrir menu" className="md:hidden h-10 w-10 grid place-items-center rounded-lg border border-border bg-card active:scale-95 transition">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86%] max-w-sm p-0 flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <img src={logoMark} alt="" className="h-8 w-8 rounded-md" />
                  <div className="text-base font-bold">Menu do produtor</div>
                </div>
                <NavBody pathname={pathname} admin={admin} onNav={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
        </div>


        <Outlet />
      </div>
    </div>
  );
}
