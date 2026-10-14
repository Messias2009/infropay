import { createFileRoute, Link, useRouter, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import heroBg from "@/assets/hero-banner.jpg";
import logoMark from "@/assets/infropay-mark.png";

const search = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Entrar — InfroPay" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useAuth();
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initial ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Conta criada com sucesso!");
          await router.navigate({ to: "/produtor", replace: true });
        } else {
          toast.success("Confirme o email para aceder ao painel.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        router.navigate({ to: "/produtor", replace: true });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      if (result.redirected) return;
      toast.success("Bem-vindo!");
      router.navigate({ to: "/produtor", replace: true });
    } finally {
      setLoading(false);
    }
  }

  if (sessionLoading)
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        A preparar o seu acesso…
      </div>
    );
  if (user) return <Navigate to="/produtor" replace />;

  return (
    <div className="min-h-screen relative grid lg:grid-cols-2">
      <div className="relative hidden lg:block overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/70 to-background/95" />
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full gradient-gold opacity-20 blur-3xl" />
        <div className="relative h-full p-12 flex flex-col justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img
              src={logoMark}
              alt=""
              width={512}
              height={512}
              className="h-10 w-10 rounded-lg object-contain"
            />
            <span className="text-xl font-bold">
              Infro<span className="text-gradient-gold">Pay</span>
            </span>
          </Link>
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight max-w-md">
              A plataforma onde o seu <span className="text-gradient-gold">conhecimento</span> vira
              renda.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md">
              Checkout de alta conversão, pagamentos locais e internacionais, painel completo. Sem
              complicação técnica.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} InfroPay</div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8">
            <img
              src={logoMark}
              alt=""
              width={512}
              height={512}
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-lg font-bold">
              Infro<span className="text-gradient-gold">Pay</span>
            </span>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">
            {mode === "signup" ? "Criar conta" : "Bem-vindo de volta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? "Comece a vender em minutos." : "Aceda ao seu painel."}
          </p>

          <Button
            onClick={handleGoogle}
            variant="outline"
            className="w-full mt-8 h-11"
            disabled={loading}
          >
            <GoogleIcon className="h-4 w-4 mr-2" />
            Continuar com Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-background px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O seu nome"
                  className="mt-1.5"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Palavra-passe</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
              {mode !== "signup" && (
                <button
                  type="button"
                  className="mt-2 text-xs text-primary hover:underline"
                  onClick={async () => {
                    if (!email) return toast.error("Escreva o seu email primeiro.");
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) toast.error(error.message);
                    else toast.success("Enviámos um link de recuperação para o seu email.");
                  }}
                >
                  Esqueceu a palavra-passe?
                </button>
              )}
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 gradient-brand text-primary-foreground shadow-glow"
            >
              {loading ? "A processar..." : mode === "signup" ? "Criar conta" : "Entrar"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "signup" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-primary-glow hover:underline font-medium"
            >
              {mode === "signup" ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
