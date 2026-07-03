import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Package, Plus, Wallet, Banknote, Settings, Shield, ArrowUpRight } from "lucide-react";
import logoMark from "@/assets/infropay-mark.png";
import { isAdmin } from "@/lib/admin.functions";

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
];

function ProdutorLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminFn = useServerFn(isAdmin);
  const { data: admin } = useQuery({ queryKey: ["is-admin"], queryFn: () => isAdminFn(), staleTime: 60_000 });

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
        <nav className="p-3 space-y-1 flex-1 overflow-auto">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2">Produtor</div>
          {items.map((i) => {
            const isActive = i.exact ? pathname === i.to : pathname === i.to || pathname.startsWith(i.to + "/");
            return (
              <Link key={i.to} to={i.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive ? "gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}>
                <i.icon className="h-4 w-4" />
                {i.label}
              </Link>
            );
          })}

          {admin && (
            <>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 pt-6 pb-2">Administração</div>
              <Link to="/adm" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${pathname.startsWith("/adm") ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}>
                <Shield className="h-4 w-4" /> Painel admin
              </Link>
            </>
          )}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
            <ArrowUpRight className="h-4 w-4" /> Ver site
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" /> Configurações
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0"><Outlet /></div>
    </div>
  );
}
