// The site root used to be Word Imposter itself, which registered a service
// worker scoped to "/". That game now lives at /games/word-imposter/, but
// anyone who visited before still has the old root-scoped worker serving
// stale cached pages. This file replaces it: on activate, it wipes every
// cache and unregisters itself so those clients fall through to the network
// and see the real site again. New visitors never trigger this at all.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
