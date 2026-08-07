self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};

  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Menui",
      body: event.data.text(),
    };
  }

  const title =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title
      : "Menui";
  const body =
    typeof payload.body === "string" && payload.body.trim()
      ? payload.body
      : "Hay una actualizacion en tu pedido.";
  const tag =
    typeof payload.tag === "string" && payload.tag.trim()
      ? payload.tag
      : "menui-local-order";
  const url =
    typeof payload.url === "string" && payload.url.trim()
      ? payload.url
      : "/";
  const icon =
    typeof payload.icon === "string" && payload.icon.trim()
      ? payload.icon
      : "/logos/menui-logo.svg";
  const badge =
    typeof payload.badge === "string" && payload.badge.trim()
      ? payload.badge
      : "/logos/menui-logo.svg";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon,
      badge,
      data: {
        url,
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl =
    event.notification &&
    event.notification.data &&
    typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/";
  const targetUrl = new URL(rawUrl, self.location.origin).toString();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
