import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Headphones } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";

type SiteLayoutProps = {
  children: ReactNode;
  variant?: "default" | "checkout";
};

export function SiteLayout({ children, variant = "default" }: SiteLayoutProps) {
  if (variant === "checkout") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">{children}</main>
        <footer className="mt-8 border-t border-border/50 py-4">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <Link
              to="/contactos"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground/70 hover:text-primary transition-colors"
            >
              <Headphones className="h-3.5 w-3.5" />
              Precisa de ajuda com o pagamento ou com o produto? Contacte o suporte.
            </Link>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
