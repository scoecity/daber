// Network first so updates show up right away; fall back to the cached copy offline.
const CACHE = 'daber-v4';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const net = fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  });
  // On a weak connection, don't leave the app on a blank screen: use the cached copy after 4 seconds.
  const timeout = new Promise((_, rej) => setTimeout(rej, e.request.mode === 'navigate' ? 4000 : 15000));
  e.respondWith(Promise.race([net, timeout])
    .catch(() => caches.match(e.request).then(r => r || net))
    .catch(() => caches.match('./')));
});
