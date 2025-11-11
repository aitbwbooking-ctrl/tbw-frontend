const CACHE = 'tbw-premium-v3';
const ASSETS = ['/', '/index.html','/style.css','/app.js','/manifest.json','/assets/logo-tbw.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch', e=>{
  const {request} = e;
  if (request.method!=='GET') return;
  e.respondWith(
    caches.match(request).then(cached=>{
      const fetcher = fetch(request).then(r=>{
        const copy = r.clone();
        caches.open(CACHE).then(c=>c.put(request,copy));
        return r;
      }).catch(()=>cached);
      return cached || fetcher;
    })
  );
});
