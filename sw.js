const CACHE = 'bombito-v17';
const ASSETS = ['./', './index.html', './manifest.json', './chart.umd.min.js',
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Navigace / index.html: vždy zkus síť první, fallback na cache
  if(e.request.mode === 'navigate' || e.request.url.endsWith('/') || e.request.url.endsWith('index.html')){
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }
  // Ostatní soubory (JS, ikony, manifest): cache first, síť fallback.
  // Pozor: sem se NESMÍ vracet fallback na index.html — jinak prohlížeč
  // dostane HTML tam, kde čeká např. chart.umd.min.js, a spadne na syntax chybě.
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if(!res || res.status !== 200) return res;
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
