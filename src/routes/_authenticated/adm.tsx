import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ShieldCheck,
  Package,
  Banknote,
  ArrowUpRight,
  Sparkles,
  Users,
  BarChart3,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAdmin, bootstrapAdmin } from "@/lib/admin.functions";
import logoMark from "@/assets/infropay-mark.png";

export const Route = createFileRoute("/_authenticated/adm")({
  head: () => ({
    meta: [{ title: "Administração — InfroPay" }, { name: "robots", content: "noindex" }],
  }),
  component: AdmLayout,
});

const items = [
  { to: "/adm", icon: ShieldCheck, label: "Aprovações", exact: true },
  { to: "/adm/produtos", icon: Package, label: "Todos os produtos" },
  { to: "/adm/usuarios", icon: Users, label: "Usuários" },
  { to: "/adm/relatorios", icon: BarChart3, label: "Relatórios" },
  { to: "/adm/logs", icon: ScrollText, label: "Logs" },
  { to: "/adm/saques", icon: Banknote, label: "Saques" },
];

function AdmLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const adminFn = useServerFn(isAdmin);
  const bootFn = useServerFn(bootstrapAdmin);
  const {
    data: admin,
    isLoading,
    refetch,
  } = useQuery({ queryKey: ["is-admin"], queryFn: () => adminFn() });

  async function claim() {
    try {
      const r = await bootFn();
      if (r.promoted) {
        toast.success("Você é agora administrador!");
        refetch();
      } else toast.error("Já existe um administrador. Peça-lhe para lhe conceder acesso.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (isLoading) return <div className="p-10 text-muted-foreground">A verificar permissões...</div>;

  if (!admin) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gold/15 grid place-items-center mx-auto">
            <ShieldCheck className="h-7 w-7 text-gold" />
          </div>
          <h1 className="font-display text-2xl font-bold mt-4">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Esta área é apenas para administradores. Se este projeto ainda não tem administrador,
            pode tornar-se o primeiro.
          </p>
          <Button
            onClick={claim}
            className="mt-6 gradient-brand text-primary-foreground shadow-glow"
          >
            <Sparkles className="h-4 w-4 mr-1" /> Tornar-me administrador
          </Button>
          <Link
            to="/produtor"
            className="block mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 border-r border-border bg-card/40 flex-col">
        <Link to="/" className="p-5 flex items-center gap-2.5 border-b border-border">
          <img
            src={logoMark}
            alt=""
            width={512}
            height={512}
            className="h-9 w-9 rounded-lg object-contain"
          />
          <div>
            <div className="text-lg font-bold leading-none">
              Infro<span className="text-gradient-gold">Pay</span>
            </div>
            <div className="text-[10px] text-gold mt-0.5 font-semibold uppercase tracking-widest">
              Admin
            </div>
          </div>
        </Link>
        <nav className="p-3 space-y-1 flex-1">
          {items.map((i) => {
            const active = i.exact
              ? pathname === i.to
              : pathname === i.to || pathname.startsWith(i.to + "/");
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${active ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"}`}
              >
                <i.icon className="h-4 w-4" />
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <Link
            to="/produtor"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowUpRight className="h-4 w-4" /> Painel do produtor
          </Link>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
