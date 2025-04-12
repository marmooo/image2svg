const CACHE_NAME = "2025-04-13 00:00";
const urlsToCache = [
  "/image2svg/",
  "/image2svg/en/",
  "/image2svg/index.js",
  "/image2svg/img/before.webp",
  "/image2svg/img/after.svg",
  "/image2svg/img/anime-64.webp",
  "/image2svg/img/car-64.webp",
  "/image2svg/img/cat-64.webp",
  "/image2svg/img/castle-64.webp",
  "/image2svg/favicon/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
