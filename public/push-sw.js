/* Service Worker para Notificaciones Push de La Compra de la Lista */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escucha eventos Web Push enviados desde un servidor Push (VAPID / Web Push API)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Recordatorio de compra para mañana',
    body: 'Tienes una compra programada para mañana en La Compra de la Lista.',
    tag: 'recordatorio-compra-manana',
    url: '/',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || payload.title,
        body: parsed.body || payload.body,
        tag: parsed.tag || payload.tag,
        url: parsed.url || '/',
      };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: payload.tag,
      renotify: true,
      data: { url: payload.url },
    })
  );
});

// Escucha mensajes enviados desde la aplicación para disparar notificaciones nativas desde el Service Worker
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SHOW_SHOPPING_REMINDER') {
    const title = data.title || 'Recordatorio: Compra para mañana';
    const body =
      data.body ||
      'Recuerda que mañana tienes prevista una compra en La Compra de la Lista.';
    const tag = data.tag || 'recordatorio-compra-' + Date.now();

    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag,
        renotify: true,
        data: { url: '/' },
      })
    );
  }
});

// Al tocar la notificación push, enfoca o abre la aplicación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
