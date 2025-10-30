const CACHE_NAME = "tbw-ai-v6";
const ASSETS = [
  "/", "/index.html", "/style.css", "/script.js",
  "/assets/TBW.png",
  "/assets/gentle-ocean-waves-birdsong-and-gull-7109.mp3",
  "/manifest.json"
];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});
