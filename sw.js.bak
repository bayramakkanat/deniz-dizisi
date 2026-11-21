/* Sea Stack — service worker (çevrimdışı oynama)
   - index.html, game-core.js ve manifest: önce ağ (güncellemeler hemen gelir), ağ yoksa önbellek
   - görseller/ikonlar: önbellekten (arka planda yenilenir)
   - /api/ istekleri hiç önbelleğe alınmaz (sıralama her zaman canlı)
   Görsel dosyalar (assets/, icons/) değişirse VERSION değerini artırın. */
const VERSION = 'v1';
const CACHE = 'seastack-' + VERSION;
const CORE = [
  './',
  'index.html',
  'game-core.js',
  'manifest.webmanifest',
  'favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
  'assets/balik.png',
  'assets/denizanasi.png',
  'assets/kabuk.png',
  'assets/mercan.png',
  'assets/penguen.png',
  'assets/yengec.png',
  'assets/yildiz.png',
  'assets/yosun.png',
  'assets/yunus.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // Bir dosya eksik olsa bile kurulum bozulmasın
      return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('seastack-') === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isLive(url) {
  var p = url.pathname;
  return p === '/' || p.endsWith('/index.html') || p.endsWith('/game-core.js') || p.endsWith('/manifest.webmanifest');
}

function networkFirst(req) {
  return new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      caches.match(req, { ignoreSearch: true }).then(function (c) { if (c && !done) { done = true; resolve(c); } });
    }, 4000); // yavaş bağlantıda önbelleğe düş
    fetch(req).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(timer);
      if (done) return;
      caches.match(req, { ignoreSearch: true }).then(function (c) {
        if (c) return c;
        return req.mode === 'navigate' ? caches.match('index.html') : null;
      }).then(function (c) { done = true; resolve(c || Response.error()); });
    });
  });
}

function staleWhileRevalidate(req) {
  return caches.match(req).then(function (cached) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () { return cached; });
    return cached || net;
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/api/') === 0) return; // sıralama hep canlı
  if (req.mode === 'navigate' || isLive(url)) {
    e.respondWith(networkFirst(req));
  } else {
    e.respondWith(staleWhileRevalidate(req));
  }
});
