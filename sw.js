const C='tbw-v4';
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll([
    '/', '/index.html','/style.css','/app.js','/manifest.json',
    '/assets/TBW.png','/assets/sounds/intro.mp3'
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==C&&caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const url=new URL(e.request.url);
  if(url.origin===location.origin){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
  }
});
