const CACHE = "tbw-v3";
const ASSETS = [
  "/", "/index.html", "/style.css", "/app.js",
  "/assets/TBW.png",
  "/assets/icons/icon_192.png",
  "/assets/icons/icon_512.png",
  "/assets/sounds/intro.mp3",
  "/manifest.json"
];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e)=>{
  const url = new URL(e.request.url);
  if (url.origin===location.origin) {
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
  }
});
