const CACHE='tbw-final-v1';
const ASSETS=['/','/index.html','/style.css','/script.js','/manifest.json','/assets/TBW.png','/assets/sounds/intro.mp3','/assets/icons/icon-192.png','/assets/icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.pathname.startsWith('/api/'))return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
