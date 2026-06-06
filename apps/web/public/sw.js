const CACHE_V = "asur-v1";
const PRODUCT_CACHE = "asur-products-v1";
const IMAGE_CACHE = "asur-images-v1";
const MAX_PRODUCT_ENTRIES = 50;
const MAX_IMAGE_ENTRIES = 100;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const current = new Set([CACHE_V, PRODUCT_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !current.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try { url = new URL(request.url); } catch { return; }

  // ── Product & article API — network-first, cache fallback ────────────────
  if (
    url.pathname.startsWith("/api/v1/products") ||
    url.pathname.startsWith("/api/v1/articles") ||
    url.pathname.startsWith("/api/v1/config")
  ) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(PRODUCT_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(PRODUCT_CACHE, MAX_PRODUCT_ENTRIES);
            });
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ── CDN images — cache-first ──────────────────────────────────────────────
  const isImage =
    url.hostname.endsWith(".r2.dev") ||
    url.hostname.endsWith(".r2.cloudflarestorage.com") ||
    url.hostname === "images.unsplash.com";

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
            });
          }
          return res;
        });
      })
    );
    return;
  }

  // ── Next.js static assets — cache-first ──────────────────────────────────
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_V).then((cache) => cache.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }
});
