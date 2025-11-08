self.addEventListener('install', e=>{
  e.waitUntil(caches.open('tbw-v2').then(c=>c.addAll([
    '/', '/index.html','/style.css','/app.js','/config.json','/manifest.json'
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', e=> e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request).catch(()=>r)));
});
