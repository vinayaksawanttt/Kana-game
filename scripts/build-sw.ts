import fs from "node:fs";
import path from "node:path";
import { buildDataManifest } from "./build-data-manifest";

export function generateServiceWorker(bundleHash: string): string {
  return `// Auto-generated Service Worker by scripts/build-sw.ts
// Cache Name with bundle hash
const CACHE_NAME = "nihongo-v1-" + ${JSON.stringify(bundleHash)};

const CORE_PRECACHE = [
  "/",
  "/learn",
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

  // 1. Cache-First for static assets (/data/v1/, /dict/, /images/learn/, /audio/, /_next/static/)
  const isStaticCacheAsset =
    url.pathname.startsWith("/data/v1/") ||
    url.pathname.startsWith("/dict/") ||
    url.pathname.startsWith("/images/learn/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.startsWith("/_next/static/");

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

  // 2. Navigation requests: Network-First with cache fallback
  if (request.mode === "navigate") {
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
            return caches.match("/");
          });
        })
    );
    return;
  }
});
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const manifestPath = path.resolve(process.cwd(), "public/data/v1/manifest.json");
  let bundleHash = "dev";
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      bundleHash = manifest.bundleHash || "dev";
    } catch {
      bundleHash = "dev";
    }
  } else {
    const manifest = buildDataManifest();
    bundleHash = manifest.bundleHash;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }

  const swContent = generateServiceWorker(bundleHash);
  const outPath = path.resolve(process.cwd(), "public/sw.js");
  fs.writeFileSync(outPath, swContent, "utf8");
  console.log(`Generated public/sw.js with CACHE_NAME="nihongo-v1-${bundleHash}"`);
}

