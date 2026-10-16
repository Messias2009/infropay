import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { FirstSaleReward } from "@/components/FirstSaleReward";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Algo correu mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente novamente em alguns segundos.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center rounded-md gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "InfroPay — Transformando conhecimento em renda" },
      {
        name: "description",
        content:
          "Plataforma premium para vender e comprar infoprodutos: cursos, ebooks, templates, mentorias e mais.",
      },
      { name: "author", content: "InfroPay" },
      { name: "theme-color", content: "#0F172A" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "InfroPay" },
      { property: "og:title", content: "InfroPay — Transformando conhecimento em renda" },
      {
        property: "og:description",
        content:
          "Plataforma premium para vender e comprar infoprodutos: cursos, ebooks, templates, mentorias e mais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "InfroPay — Transformando conhecimento em renda" },
      {
        name: "twitter:description",
        content:
          "Plataforma premium para vender e comprar infoprodutos: cursos, ebooks, templates, mentorias e mais.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", type: "image/png", href: "/pwa-192x192.png" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => {
            keys.forEach((key) => {
              if (key !== "infropay-cache-v3") {
                caches.delete(key);
              }
            });
          })
          .catch(() => {});
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            reg.update().catch(() => {});
          })
          .catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") {
        queryClient.invalidateQueries();
        if (router.state.location.pathname === "/" || router.state.location.pathname === "/auth")
          void router.navigate({ to: "/produtor", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <html lang="pt" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <Outlet />
          <FirstSaleReward />
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
