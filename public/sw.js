/* Simple, safe cache for same-origin static assets */
const CACHE_NAME = 'controle-mensal-static-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
    )
  );
  self.clients.claim();
});

function isCacheableRequest(requestUrl, request) {
  if (request.method !== 'GET') return false;
  if (request.mode === 'navigate') return true;
  if (requestUrl.origin !== self.location.origin) return false;
  if (requestUrl.pathname.startsWith('/api')) return false;
  return ['document', 'script', 'style', 'image', 'font'].includes(request.destination);
}

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (!isCacheableRequest(requestUrl, event.request)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && requestUrl.origin === self.location.origin) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('', { status: 504, statusText: 'Offline' });
        });
    })
  );
});
