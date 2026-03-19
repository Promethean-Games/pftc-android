// Bump CACHE_VERSION with every production deployment so stale caches clear
// automatically and users always receive fresh assets.
const CACHE_VERSION = "pftc-v5";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/apple-touch-icon-180x180.png",
  "/apple-touch-icon-167x167.png",
];

// ── Install: pre-cache shell ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches, notify clients ────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
      .then(() =>
        self.clients
          .matchAll({ includeUncontrolled: true })
          .then((clients) =>
            clients.forEach((c) => c.postMessage({ type: "SW_UPDATED" }))
          )
      )
  );
});

// ── Fetch: tiered strategy per resource type ──────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept API calls
  if (url.pathname.startsWith("/api/")) return;

  // Only handle GET
  if (request.method !== "GET") return;

  // Google Fonts: cache-first (immutable once fetched)
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Versioned JS/CSS/font bundles (Vite content-hashed /assets/*): cache-first
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Static images & icons: cache-first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // HTML / navigation: network-first → cached shell fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ── Notification: relay action button taps to the app ─────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action || "open";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Prefer the visible client; fall back to any open client
        const target =
          clients.find((c) => c.visibilityState === "visible") || clients[0];
        if (target) {
          // Relay action to app — app handles game logic
          target.postMessage({ type: "NOTIF_ACTION", action });
          if (action === "open" || !action) return target.focus();
        } else {
          // App is fully closed — open it
          return self.clients.openWindow("/");
        }
      })
  );
});

// ── Strategy helpers ──────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached =
      (await caches.match(request)) || (await caches.match("/"));
    return (
      cached ||
      new Response("Offline", { status: 503, statusText: "Offline" })
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return (
    cached ||
    (await networkPromise) ||
    new Response("Offline", { status: 503, statusText: "Offline" })
  );
}
