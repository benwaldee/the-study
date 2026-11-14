// The Study: keeps the app on the phone so it opens with no signal.
// Online: always fetches the newest version first (so updates show on the next open).
// Offline or slow signal: opens instantly from the copy saved on the phone.
const VERSION = "study-v23";
const COVERS = "study-covers"; // cover pictures from Open Library / Google Books, kept across updates
const COVER_URL = /^https:\/\/(covers\.openlibrary\.org\/b\/|books\.google\.com\/books\/content|books\.googleusercontent\.com\/)/;
const FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  // the three looks: rendered textures and fonts, kept for offline use
  "./look/c-arch.webp",
  "./look/c-back.webp",
  "./look/c-banner.webp",
  "./look/c-ledge.webp",
  "./look/c-pier-l.webp",
  "./look/c-pier-r.webp",
  "./look/c-row.webp",
  "./look/c-scroll.webp",
  "./look/c-seal.webp",
  "./look/c-sign.webp",
  "./look/c-strip.webp",
  "./look/c-torch.webp",
  "./look/c-wall.webp",
  "./look/f-Cinzel.woff2",
  "./look/f-Pixelify.woff2",
  "./look/f-VT323.woff2",
  "./look/p-back.png",
  "./look/p-btn.png",
  "./look/p-cornice.png",
  "./look/p-field.png",
  "./look/p-gem-big.png",
  "./look/p-gem-off.png",
  "./look/p-gem-on.png",
  "./look/p-head.png",
  "./look/p-nav.png",
  "./look/p-pil-l.png",
  "./look/p-pil-r.png",
  "./look/p-plate.png",
  "./look/p-plinth.png",
  "./look/p-rail.png",
  "./look/p-row.png",
  "./look/p-wall.png",
  "./look/r-back.webp",
  "./look/r-btn-brass.webp",
  "./look/r-btn-more.webp",
  "./look/r-cornice.webp",
  "./look/r-field.webp",
  "./look/r-head.webp",
  "./look/r-nav.webp",
  "./look/r-pil-l.webp",
  "./look/r-pil-r.webp",
  "./look/r-plate.webp",
  "./look/r-plinth.webp",
  "./look/r-rail.webp",
  "./look/r-rose.webp",
  "./look/r-row.webp",
  "./look/r-wall.webp",
  "./look/tx-cloth.webp",
  "./look/tx-leather.webp",
  "./look/tx-paint.webp",
  "./look/tx-paper.webp",
  "./look/tx-pixel.png"
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
