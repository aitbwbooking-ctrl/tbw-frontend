const NAME='tbw-v1';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(NAME).then(c=>c.addAll([
    '/', '/index.html','/style.css','/app.js','/manifest.json','/assets/icons/tbw-neon.png'
  ])));
});
self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request).then(r=> r || fetch(e.request).then(res=>{
      const copy=res.clone(); caches.open(NAME).then(c=>c.put(e.request,copy)); return res;
    }))
  );
});
