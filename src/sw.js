const cacheName = "2026-05-22 00:00";
const urlsToCache = [
  "/image2svg/index.js",
  "/image2svg/img/before.webp",
  "/image2svg/img/after.svg",
  "/image2svg/img/anime-64.webp",
  "/image2svg/img/car-64.webp",
  "/image2svg/img/cat-64.webp",
  "/image2svg/img/castle-64.webp",
  "/image2svg/favicon/favicon.svg",
];

async function preCache() {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urlsToCache.map((url) =>
      cache.add(url).catch((err) => console.warn("Failed to cache", url, err))
    ),
  );
  self.skipWaiting();
}

async function handleFetch(event) {
  const cached = await caches.match(event.request);
  return cached || fetch(event.request);
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((name) => name !== cacheName ? caches.delete(name) : null),
  );
  self.clients.claim();
}

self.addEventListener("install", (event) => {
  event.waitUntil(preCache());
});
self.addEventListener("fetch", (event) => {
  event.respondWith(handleFetch(event));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(cleanOldCaches());
});
