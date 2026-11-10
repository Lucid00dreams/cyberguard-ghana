// CyberGuard Ghana - Progressive Web App & Web Push Service Worker
const CACHE_NAME = "cyberguard-pwa-v2";
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Warm cache asynchronously so SW activation and beforeinstallprompt are never delayed
  caches
    .open(CACHE_NAME)
    .then((cache) => cache.addAll(PRECACHE_URLS))
    .catch(() => {});
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      ),
    ])
  );
});

// High-performance caching: Stale-While-Revalidate for static assets, Network-First for navigations
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Skip cross-origin requests and backend API endpoints
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    /\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname);

  if (isStaticAsset) {
    // Stale-While-Revalidate: Instant response from cache, update cache in background
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Network-first for HTML navigations to ensure latest page structure
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return Response.error();
        })
      )
  );
});

// Handle incoming Web Push notifications from CyberGuard backend
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "CyberGuard Ghana", body: event.data.text() };
    }
  }

  const title = data.title || "CyberGuard Ghana · Cyber Safety Alert";
  const options = {
    body: data.body || "New cyber safety briefing available.",
    icon: data.icon || "/pwa-192x192.png",
    badge: data.badge || "/pwa-96x96.png",
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || { url: data.url || "/" },
    tag: data.tag || `cyberguard-tip-${Date.now()}`,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle clicking on a notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || "/";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If app window is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
