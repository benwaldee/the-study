// The Study: keeps the app on the phone so it opens with no signal.
// Online: always fetches the newest version first (so updates show on the next open).
// Offline or slow signal: opens instantly from the copy saved on the phone.
const VERSION = "study-v15";
const COVERS = "study-covers"; // cover pictures from Open Library / Google Books, kept across updates
const COVER_URL = /^https:\/\/(covers\.openlibrary\.org\/b\/|books\.google\.com\/books\/content|books\.googleusercontent\.com\/)/;
const FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== COVERS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method === "GET" && COVER_URL.test(req.url)) {
    e.respondWith(caches.open(COVERS).then(async cache => {
      const hit = await cache.match(req.url);
      if (hit) return hit;
      const res = await fetch(req.url, { mode: "no-cors" });
      cache.put(req.url, res.clone()).catch(() => {});
      return res;
    }).catch(() => fetch(req)));
    return;
  }
  if (req.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const network = fetch(req, { cache: "no-store" }).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    });
    try {
      return await withTimeout(network, 4000);
    } catch (err) {
      e.waitUntil(network.catch(() => null));
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") { const home = await cache.match("./index.html"); if (home) return home; }
      return Response.error();
    }
  }));
});
