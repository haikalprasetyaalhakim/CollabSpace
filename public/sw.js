self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const options = {
      body: payload.body,
      icon: payload.icon || "/icon.png",
      badge: payload.badge || "/badge.png",
      data: {
        url: payload.url,
      },
      tag: payload.tag || "collabspace-msg",
      renotify: true,
    };

    event.waitUntil(self.registration.showNotification(payload.title, options));
  } catch (error) {
    console.error("Error parsing push payload", error);
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const relativeUrl = event.notification.data?.url || "/dashboard";
  const targetUrl = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus().then(() => client.navigate(targetUrl));
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
