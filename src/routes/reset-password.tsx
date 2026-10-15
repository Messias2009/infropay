import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Recuperar palavra-passe — InfroPay" },
      { name: "description", content: "Defina uma nova palavra-passe para a sua conta InfroPay." },
      { property: "og:title", content: "Recuperar palavra-passe — InfroPay" },
      {
        property: "og:description",
        content: "Defina uma nova palavra-passe para a sua conta InfroPay.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw !== pw2) return toast.error("As palavras-passe não coincidem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Palavra-passe actualizada.");
    router.navigate({ to: "/produtor", replace: true });
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-glow"
      >
        <h1 className="text-xl font-bold">Nova palavra-passe</h1>
        <p className="text-sm text-muted-foreground">
          Escolha uma nova palavra-passe para a sua conta.
        </p>
        <div>
          <Label htmlFor="pw">Nova palavra-passe</Label>
          <Input
            id="pw"
            type="password"
            minLength={6}
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="pw2">Confirmar</Label>
          <Input
            id="pw2"
            type="password"
            minLength={6}
            required
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full gradient-brand text-primary-foreground"
        >
          {loading ? "A guardar..." : "Guardar palavra-passe"}
        </Button>
      </form>
    </div>
  );
}
