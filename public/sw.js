self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "SERJAFAN", body: event.data ? event.data.text() : "Notifikasi baru" };
  }

  const title = payload.title || "SERJAFAN";
  const options = {
    body: payload.body || "Ada aktivitas baru di SERJAFAN.",
    icon: "/serjafan-logo.png",
    badge: "/serjafan-logo.png",
    tag: payload.tag || "serjafan-notification",
    data: { url: payload.url || "/" },
    vibrate: [180, 90, 180]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
