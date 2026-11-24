// Auto-generated Service Worker by scripts/build-sw.ts
// Cache Name with bundle hash
const CACHE_NAME = "nihongo-v1-" + "50c0368bd2f9";

const CORE_PRECACHE = [
  "/",
  "/learn",
  "/books",
  "/dictionary",
  "/grammar",
  "/stories",
  "/review",
  "/data/v1/manifest.json",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_PRECACHE).catch((err) => {
        console.warn("[SW] Pre-caching core routes warning:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith("nihongo-") && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Cache-First for static assets (/data/v1/, /dict/, /images/, /audio/, /_next/static/, /_next/image)
  const isStaticCacheAsset =
    url.pathname.startsWith("/data/v1/") ||
    url.pathname.startsWith("/dict/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image");

  if (isStaticCacheAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. Navigation & Next.js RSC requests: Network-First with cache fallback
  const isRscRequest = request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (request.mode === "navigate" || isRscRequest) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === "navigate") {
              if (url.pathname.startsWith("/books")) {
                return caches.match("/books").then((booksCached) => booksCached || caches.match("/"));
              }
              return caches.match("/");
            }
            return new Response("", { status: 504, statusText: "Offline" });
          });
        })
    );
    return;
  }
});
