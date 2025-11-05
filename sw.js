const CACHE_NAME = "tbw-cache-v3";
const ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/assets/icons/icon_192.png",
  "/assets/icons/icon_512.png",
  "/assets/TBW.png",
  "/assets/sounds/intro.mp3"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // sigurno dodavanje bez pucanja na 404
      await Promise.allSettled(
        ASSETS.map(u => cache.add(u).catch(() => {}))
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // network-first za HTML, cache-first za ostalo
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
  } else {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});
