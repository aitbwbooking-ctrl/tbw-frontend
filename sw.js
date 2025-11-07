const CACHE = "tbw-premium-v1";
const ASSETS = [
  "/", "/index.html", "/style.css", "/app.js",
  "/manifest.json",
  "/assets/TBW.png",
  "/assets/icons/icon_192.png",
  "/assets/icons/icon_512.png",
  "/assets/sounds/intro.mp3"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
    ))
  );
  self.clients.claim();
});
self.addEventListener("fetch", (e)=>{
  const { request } = e;
  if(request.method !== "GET") return;
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
