// CyberGuard Ghana - Service Worker for Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
    icon: data.icon || "/logo-mark.svg",
    badge: data.badge || "/favicon.svg",
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || { url: data.url || "/" },
    tag: data.tag || "cyberguard-daily-tip",
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

