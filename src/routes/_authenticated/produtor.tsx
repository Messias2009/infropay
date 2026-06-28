import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, Plus, BarChart3, Settings, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/produtor")({
  head: () => ({ meta: [{ title: "Painel do produtor — InfroPay" }, { name: "robots", content: "noindex" }] }),
  component: ProdutorLayout,
});

const items = [
  { to: "/produtor", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/produtor/produtos", icon: Package, label: "Produtos" },
  { to: "/produtor/novo", icon: Plus, label: "Novo produto" },
];

function ProdutorLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 border-r border-border bg-card/40 flex-col">
        <Link to="/" className="p-5 flex items-center gap-2 border-b border-border">
          <div className="h-8 w-8 rounded-lg gradient-brand grid place-items-center"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
          <div className="text-lg font-bold">Infro<span className="text-gradient-gold">Pay</span></div>
        </Link>
        <nav className="p-3 space-y-1 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2">Produtor</div>
          {items.map((i) => {
            const active = i.exact ? pathname === i.to : pathname.startsWith(i.to);
            return (
              <Link key={i.to} to={i.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active ? "gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}>
                <i.icon className="h-4 w-4" />
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
            <BarChart3 className="h-4 w-4" /> Ver site
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" /> Configurações
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
