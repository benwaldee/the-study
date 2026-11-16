// The Study: keeps the whole app on the phone so it opens with no signal.
// The page itself: newest version first when online (so updates show on the next open), saved copy otherwise.
// Everything else (look images, fonts, icons) is saved on the phone at install and served from there:
// each release has a new VERSION, which re-downloads them once, so they're never fetched on a normal open.
const VERSION = "study-v37";
const COVERS = "study-covers"; // cover pictures from Open Library / Google Books, kept across updates
const COVER_URL = /^https:\/\/(covers\.openlibrary\.org\/b\/|books\.google\.com\/books\/content|books\.googleusercontent\.com\/)/;
const FILES = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  // the three looks: rendered textures and fonts, kept for offline use
  "./look/c-arch.webp",
  "./look/c-art.webp",
  "./look/c-back.webp",
  "./look/c-banner.webp",
  "./look/c-door-l.webp",
  "./look/c-door-r.webp",
  "./look/c-ledge.webp",
  "./look/c-parch.webp",
  "./look/c-roll.webp",
  "./look/c-row.webp",
  "./look/c-scroll.webp",
  "./look/c-seal.webp",
  "./look/c-sign.webp",
  "./look/c-strip.webp",
  "./look/c-torch.webp",
  "./look/g-lair.webp",
  "./look/g-trap.webp",
  "./look/g-chamber.webp",
  "./look/g-keyhole.webp",
  "./look/g-lair-wiz.webp",
  "./look/g-lair-drag.webp",
  "./look/g-lair-fm.webp",
  "./look/g-key-t.webp",
  "./look/g-wand-t.webp",
  "./look/g-potion-t.webp",
  "./look/g-keyins.webp",
  "./look/g-pour.webp",
  "./look/g-pour-cork.webp",
  "./look/g-geo.json",
  "./game.js",
  "./look/r-pil-r-m.webp",
  "./look/r-pil-r-d.webp",
  "./look/r-pil-l-m.webp",
  "./look/r-pil-l-d.webp",
  "./look/p-pil-r-d.webp",
  "./look/p-pil-l-d.webp",
  "./look/p-pil-r-m.webp",
  "./look/p-pil-l-m.webp",
  "./look/c-pier-r-t.webp",
  "./look/c-pier-l-t.webp",
  "./look/c-flame.webp",
  "./look/c-wall.webp",
  "./look/f-Cinzel.woff2",
  "./look/f-EBGaramond-400.woff2",
  "./look/f-EBGaramond-400i.woff2",
  "./look/f-EBGaramond-500.woff2",
  "./look/f-EBGaramond-600.woff2",
  "./look/f-IMFellEnglish-400.woff2",
  "./look/f-IMFellEnglish-400i.woff2",
  "./look/f-VT323.woff2",
  "./look/p-back.webp",
  "./look/p-btn.webp",
  "./look/p-cornice.webp",
  "./look/p-dragon-off.webp",
  "./look/p-dragon-s.webp",
  "./look/p-dragon.webp",
  "./look/p-field.webp",
  "./look/p-head.webp",
  "./look/p-nav.webp",
  "./look/p-pil-l.webp",
  "./look/p-pil-r.webp",
  "./look/p-plate.webp",
  "./look/p-plinth.webp",
  "./look/p-rail.webp",
  "./look/p-row.webp",
  "./look/p-w-axe.webp",
  "./look/p-w-shield.webp",
  "./look/p-w-spear.webp",
  "./look/p-w-sword.webp",
  "./look/p-wall.webp",
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
  "./look/tx-pixel.webp"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
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
  const isPage = req.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname);
  if (!isPage && !url.pathname.endsWith("/sw.js")) {
    // saved on the phone: answer from the cache, and only go to the network for something never saved
    e.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => Response.error()));
    return;
  }
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
      const home = await cache.match("./index.html"); if (home) return home;
      return Response.error();
    }
  }));
});
