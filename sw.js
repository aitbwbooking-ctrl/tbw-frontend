const CACHE = 'tbw-v5';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js', '/manifest.json',
  '/assets/TBW.png', '/assets/sounds/intro.mp3',
  '/assets/icons/icon_192.png', '/assets/icons/icon_512.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))))
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const {request} = e;
  if (request.method!=='GET') return;
  e.respondWith(
    caches.match(request).then(cached=>{
      const fetchP = fetch(request).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put(request, copy));
        return res;
      }).catch(()=>cached);
      return cached || fetchP;
    })
  );
});
