const CACHE_NAME = "infropay-cache-v3";
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
