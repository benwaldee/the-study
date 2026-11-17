// The Kitchen: keeps the app on the phone so it opens with no signal (the back of an Aldi has none).
// The page: newest version when online, saved copy otherwise. Everything else comes from the saved copy.
// Each release gets a new VERSION. Only "kitchen-" caches are ever cleaned up here, so The Study's are left alone.
const VERSION = "kitchen-v3";
const FILES = [
  "./", "./index.html", "./meals.js", "./manifest.webmanifest",
  "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png",
  "./look/f-barlowc-600.woff2", "./look/f-barlowc-800.woff2", "./look/f-plexmono-400.woff2", "./look/f-plexmono-600.woff2"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("kitchen-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function withTimeout(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]); }
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const scope = new URL(self.registration.scope).pathname;
  if (!url.pathname.startsWith(scope)) return;
  const isPage = req.mode === "navigate" || /\/(index\.html)?$/.test(url.pathname) || url.pathname.endsWith("/meals.js");
  if (!isPage) {
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
    const network = fetch(req, { cache: "no-store" }).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; });
    try { return await withTimeout(network, 4000); }
    catch (err) {
      e.waitUntil(network.catch(() => null));
      const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === "navigate" && await cache.match("./index.html"));
      return hit || Response.error();
    }
  }));
});
