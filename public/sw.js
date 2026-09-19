// Minimal, conservative service worker for the Weekly Planner PWA.
// - Never caches API responses (always live data).
// - Cache-first for hashed static assets and icons (safe: content-hashed).
// - Network-first for page navigations, falling back to cache when offline.
const CACHE = 'planner-v1';
const PRECACHE = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API calls — always hit the network for fresh data.
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for content-hashed static assets and icons.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Network-first for navigations; fall back to cache when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/dashboard')))
    );
  }
});

// ---------------------------------------------------------------------------
// Web Push: the scheduled worker sends a bare ping; we fetch the queued
// reminders (authenticated by the user's cookie) and show them.
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let items = [];
      try {
        const res = await fetch('/api/notifications/pending', {
          credentials: 'include',
        });
        if (res.ok) items = (await res.json()).notifications || [];
      } catch (e) {
        /* offline or not signed in */
      }

      // If a payload was included, use it as a fallback single notification.
      if (!items.length && event.data) {
        try {
          const p = event.data.json();
          items = [p];
        } catch (e) {
          items = [{ title: 'Weekly Planner', body: event.data.text() }];
        }
      }
      if (!items.length) {
        items = [{ title: 'Weekly Planner', body: 'You have tasks to check.' }];
      }

      await Promise.all(
        items.map((n) =>
          self.registration.showNotification(n.title || 'Weekly Planner', {
            body: n.body || '',
            tag: n.tag || 'planner',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            data: { url: n.url || '/dashboard' },
            renotify: true,
          })
        )
      );
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
