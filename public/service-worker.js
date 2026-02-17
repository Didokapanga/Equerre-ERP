const CACHE_NAME = "equerre-cache-v1";
const OFFLINE_URL = "/index.html";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icone-equerre.png"
];

// INSTALL
self.addEventListener("install", event => {
  console.log("SW install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// ACTIVATE → nettoyage ancien cache
self.addEventListener("activate", event => {
  console.log("SW activate");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).catch(() => caches.match(OFFLINE_URL))
      );
    })
  );
});
