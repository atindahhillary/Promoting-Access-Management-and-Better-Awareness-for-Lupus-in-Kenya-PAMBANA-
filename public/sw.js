// Cache first, updated only as a whole set, so a weak signal can never leave
// mismatched modules. VERSION is a hash of the files: run `npm run stamp`.
const VERSION = 'pambana-333d901a';
const FILES = ['/', '/index.html', '/app.css', '/app.js', '/logic.js', '/content.js', '/companion.js','/inter.woff2', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/img/banner.jpg', '/img/hub.jpg', '/img/learn.jpg', '/img/community.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const key = e.request.mode === 'navigate' ? '/index.html' : e.request;
  e.respondWith(caches.match(key).then(hit => hit || fetch(e.request)));
});
