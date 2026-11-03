// Keeps Solam's app files on the phone, so it opens without internet. New versions replace them.
const CACHE = 'solam-app-0.9.6-beta.1';
const SHELL = ["./","index.html","web-config.js","register-sw.js","manifest.webmanifest","icon.png","icon-maskable.png","music-core.js","social-core.js","i18n.js","translations.js","qrcode.js","connectors.js","themes.js","glass.js","app.js","styles.css","mobile.css","web-backend.js","web-bridge.js"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((names) => Promise.all(names.filter((name) => name.startsWith('solam-app-') && name !== CACHE).map((name) => caches.delete(name))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request, { cache: 'no-cache' }).catch(() => caches.match(event.request).then((hit) => hit || caches.match('index.html'))));
});
