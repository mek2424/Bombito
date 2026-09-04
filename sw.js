const CACHE = 'bombito-v43';
const ASSETS = ['./', './index.html', './manifest.json', './chart.umd.min.js',
  './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  // Cachovat každý soubor ZVLÁŠŤ, ne přes jedno cache.addAll(ASSETS) — addAll je
  // všechno-nebo-nic, takže kdyby chyběl třeba jen jeden z icons/*.png (appka je
  // nedodává v balíčku, spravuje si je uživatel sám ve svém nasazení), celá instalace
  // service workera by selhala a appka by pak nefungovala offline VŮBEC, ani pro
  // index.html/chart.umd.min.js, které appka sama spolehlivě dodává. Selhání jednoho
  // souboru se teď jen zaloguje a zbytek se stejně nacachuje. (Kolo 30, oprava reálně
  // nahlášené chyby "appka nefunguje offline".)
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      ASSETS.map(url => c.add(url).catch(err => console.warn('SW: nepodařilo se nacachovat', url, err)))
    ))
  );
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
