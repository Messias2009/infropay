const CACHE_NAME = "infropay-cache-v4";
const ASSETS_TO_CACHE = [
  "/manifest.webmanifest",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// ==========================================
// PUSH & BACKGROUND NOTIFICATIONS
// Permite notificações mesmo com o navegador fechado / em segundo plano
// ==========================================

self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "🎉 Nova Venda Confirmada!", body: event.data.text() };
    }
  }

  const title = data.title || "🎉 Nova Venda no InfroPay!";
  const options = {
    body: data.body || "Recebeste um novo pagamento na tua conta de produtor.",
    icon: data.icon || "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    image: data.image || undefined,
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || "infropay-sale-" + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || "/produtor",
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
    },
    actions: [
      { action: "open_dashboard", title: "Ver Venda" },
      { action: "dismiss", title: "Dispensar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl = event.notification.data?.url || "/produtor";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});

// Listener para mensagens da aplicação para o Service Worker
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SHOW_SALE_NOTIFICATION") {
    const title = data.title || "🎉 Nova Venda Confirmada!";
    const options = {
      body: data.body || "Recebeste um novo pagamento na tua conta de produtor.",
      icon: data.icon || "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      image: data.image || undefined,
      vibrate: [200, 100, 200, 100, 200],
      tag: data.tag || "infropay-sale-" + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: {
        url: data.url || "/produtor",
      },
      actions: [
        { action: "open_dashboard", title: "Ver Venda" },
        { action: "dismiss", title: "Dispensar" },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } else if (data.type === "SCHEDULE_TEST_NOTIFICATION") {
    const delay = data.delayMs || 5000;
    setTimeout(() => {
      self.registration.showNotification(
        data.title || "🎉 [Teste em Segundo Plano] Nova Venda Realizada! (+45.000 Kz)",
        {
          body:
            data.body ||
            "Notificação Push entregue mesmo com o navegador em segundo plano ou fechado!",
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          vibrate: [300, 100, 300],
          tag: "infropay-test-" + Date.now(),
          renotify: true,
          requireInteraction: true,
          data: { url: "/produtor" },
          actions: [
            { action: "open_dashboard", title: "Abrir Painel" },
            { action: "dismiss", title: "Fechar" },
          ],
        },
      );
    }, delay);
  }
});

// ==========================================
// CACHING & FETCH HANDLER
// ==========================================

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Bypass non-http requests or API mutations
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Documents and navigation are always Network-First
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          "<!DOCTYPE html><html><head><meta charset='utf-8'><title>InfroPay</title></head><body style='font-family:sans-serif;background:#0B0F19;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;'><div style='text-align:center;'><h2>Sem ligação à internet</h2><p>Por favor verifique a sua ligação para continuar.</p></div></body></html>",
          { headers: { "Content-Type": "text/html" } },
        );
      }),
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    }),
  );
});
