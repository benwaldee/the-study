/* Galef's hidden game. Loaded on demand by index.html the first time the game needs it, so it costs the app nothing until then.
   It uses the app's own helpers (S, $, save, render, openSheet, closeSheet, toast, game, saveGame, ...). */
/* global S, $, esc, norm, live, uid, clone, save, render, openSheet, closeSheet, openBook, toast, mountTurner, cleanItem,
   game, gHas, saveGame, gCandidates, gLinesSoon, lookNow, setLook, openLooks, LS */

const IMG = n => `look/${n}.webp`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let geo = null;   // where things sit inside the rendered pictures
async function geom() {
  if (!geo) { try { geo = await (await fetch("look/g-geo.json")).json(); } catch (e) { geo = {}; } }
  return geo;
}

/* ---------- styles, added once ---------- */
(function styles() {
  if (document.getElementById("g-css")) return;
  const st = document.createElement("style"); st.id = "g-css";
  st.textContent = `
.gfx{position:fixed;inset:0;z-index:80;pointer-events:none}
.gfx .dim{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(30,20,8,.55),rgba(0,0,0,.82));opacity:0}
.gfx .it{position:absolute;left:0;top:0;transform-origin:50% 50%;will-change:transform}
.gfx .it img,.gfx .it .gnote{display:block;width:100%;height:100%;object-fit:contain}
.gfx .halo{position:absolute;left:50%;top:45%;width:340px;height:340px;margin:-170px 0 0 -170px;border-radius:50%;opacity:0;
  background:radial-gradient(circle,rgba(255,226,150,.55),rgba(255,190,90,.18) 40%,rgba(255,170,60,0) 68%)}
.gfx .cap{position:absolute;left:24px;right:24px;top:calc(45% + 120px);text-align:center;font:italic 400 21px/1.3 var(--serif);color:#F2DDA6;
  text-shadow:0 0 12px rgba(255,190,90,.6),0 2px 3px #000;opacity:0}
.gmyst{position:fixed;inset:0;z-index:85;display:flex;align-items:center;justify-content:center;padding:32px;background:radial-gradient(circle,rgba(10,6,20,.55),rgba(0,0,0,.85));opacity:0;transition:opacity .8s}
.gmyst.in{opacity:1}
.gmyst p{max-width:320px;margin:0;text-align:center;font:italic 400 23px/1.4 var(--serif);color:#E6D2FF;letter-spacing:.01em;
  text-shadow:0 0 18px rgba(170,110,255,.85),0 0 4px rgba(170,110,255,.6),0 2px 3px #000}
/* satchel */
.gbag-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:12px;margin:10px 0 4px}
.gbag-item{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px 12px;border-radius:6px;border:1px solid rgba(214,178,100,.35);
  background:radial-gradient(circle at 50% 40%,rgba(255,220,160,.1),rgba(0,0,0,.25));color:inherit;font:600 15px/1.2 var(--serif);cursor:pointer}
.gbag-item .th{width:96px;height:64px;display:flex;align-items:center;justify-content:center}
.gbag-item .th img{max-width:100%;max-height:100%}
.gbag-item .th .gnote{transform:scale(.36);transform-origin:50% 50%}
.gi-back{margin:0 0 6px;padding:4px 0;border:0;background:none;color:var(--brass-hi,#E0BC6C);font:600 15px var(--serif);cursor:pointer}
.gi-stage{height:250px;display:flex;align-items:center;justify-content:center;perspective:900px;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}
.gi-obj{position:relative;width:var(--w);height:var(--h);transform-style:preserve-3d;transform:rotateX(var(--rx,-8deg)) rotateY(var(--ry,28deg));transition:transform .55s cubic-bezier(.2,.8,.2,1)}
.gi-obj.dragging{transition:none}
.gi-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.gi-face img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 8px 10px rgba(0,0,0,.55))}
.gi-face.b{transform:rotateY(180deg)}
.gi-tag{position:absolute;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px 6px;overflow:hidden;
  font:italic 400 7.5px/1.25 var(--serif);color:#3a2410;transform:rotate(-1deg)}
.gi-glow{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(130,255,160,.85),rgba(90,255,140,.25) 40%,rgba(90,255,140,0) 70%);animation:gglow 2.4s ease-in-out infinite}
@keyframes gglow{0%,100%{opacity:.55;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}
.gi-label{position:absolute;display:flex;align-items:center;justify-content:center;font:italic 600 13px/1 var(--serif);color:#3a2410;transform:rotate(-2deg)}
.gi-name{margin:6px 0 2px;text-align:center;font:600 21px/1.2 var(--serif)}
.gi-desc{margin:4px 0 12px;text-align:center;font:italic 400 17px/1.45 var(--serif);opacity:.92}
.gi-read{min-height:0;margin:-4px 0 12px;text-align:center;font:italic 400 16px/1.45 var(--serif);color:#E8D2A0;opacity:0;transition:opacity .4s}
.gi-read.on{opacity:1}
.gi-acts{display:flex;flex-direction:column;gap:8px}
.gi-menu{display:flex;flex-direction:column;gap:6px;padding:8px;border-radius:6px;background:rgba(0,0,0,.25);border:1px solid rgba(214,178,100,.3)}
/* the note: the very same paper as a list */
.gnote{width:260px;margin:0;pointer-events:none}
.gnote .card-head{display:block;width:100%;text-align:left}
.gnote.front{min-height:150px}
.gnote.front .fold{position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(80,56,30,.25);box-shadow:0 1px 0 rgba(255,255,255,.35)}
/* chamber */
.gch{position:fixed;inset:0;z-index:70;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .5s}
.gch.in{opacity:1}
.gch .box{position:relative;width:min(100vw,calc((100vh - 40px) * .75));aspect-ratio:3/4;transform:scale(.55);transition:transform 1.1s cubic-bezier(.2,.8,.2,1)}
.gch.in .box{transform:none}
.gch .box>img{width:100%;height:100%;display:block}
.gch .mote{position:absolute;width:3px;height:3px;border-radius:50%;background:rgba(255,236,200,.85);box-shadow:0 0 4px rgba(255,220,160,.8);animation:gmote linear infinite}
@keyframes gmote{0%{transform:translate(0,0);opacity:0}15%{opacity:.9}85%{opacity:.6}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
.gch .puff{position:absolute;left:50%;top:60%;width:10px;height:10px;border-radius:50%;background:rgba(220,205,175,.5);filter:blur(6px);animation:gpuff 1.6s ease-out forwards}
@keyframes gpuff{0%{transform:translate(0,0) scale(1);opacity:.9}100%{transform:translate(var(--dx),var(--dy)) scale(14);opacity:0}}
.gch .take{position:absolute;border:0;padding:0;background:none;cursor:pointer}
.gch .take img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,.7))}
.gch .take.note .gnote{transform-origin:0 0}
.gch .leave{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:2}
.gch .say{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom) + 18px);text-align:center;font:italic 400 17px/1.4 var(--serif);color:#E8D2A0;text-shadow:0 2px 3px #000}
/* key into the lock */
.gkey-in{position:fixed;z-index:90;pointer-events:none;width:120px;height:100px;transform-origin:21% 30%}
.gkey-in img{width:100%;height:100%;object-fit:contain}
.gask{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;width:220px;padding:14px;border-radius:8px;text-align:center;
  background:rgba(20,12,6,.94);border:1px solid rgba(214,178,100,.55);box-shadow:0 10px 30px rgba(0,0,0,.7)}
.gask p{margin:0 0 10px;font:italic 400 18px/1.3 var(--serif);color:#F2DDA6}
.gask .actions{justify-content:center}
/* spell */
.gsp{position:fixed;inset:0;z-index:75;background:radial-gradient(circle at 50% 40%,#18122a,#05040a 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;opacity:0;transition:opacity .4s}
.gsp.in{opacity:1}
.gsp h2{margin:0 0 2px;font:600 24px/1.2 var(--serif);color:#EAD8A6}
.gsp .hint{margin:0 0 10px;font:italic 400 17px var(--serif);color:rgba(230,215,255,.75)}
.gsp .pad{position:relative;width:min(92vw,380px);height:min(60vh,420px);border-radius:12px;border:1px solid rgba(180,140,255,.25);background:radial-gradient(circle,rgba(120,80,200,.08),transparent 70%);overflow:hidden}
.gsp canvas{position:absolute;inset:0;width:100%;height:100%}
.gsp .wand{position:absolute;left:0;top:0;width:200px;height:40px;transform-origin:100% 50%;pointer-events:none;will-change:transform}
.gsp .wand img{width:100%;height:100%;object-fit:contain;transform:scaleX(-1)}
.gsp .msg{min-height:28px;margin:12px 0 0;font:italic 400 18px var(--serif);color:#E6D2FF;text-align:center}
.gsp .x{position:absolute;right:14px;top:calc(env(safe-area-inset-top) + 14px)}
.gsp .spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#d6ffe0;box-shadow:0 0 8px #8affb0;animation:gspark .9s ease-out forwards}
@keyframes gspark{to{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
.gsp .fizz{position:absolute;width:14px;height:14px;border-radius:50%;background:rgba(160,160,160,.6);filter:blur(4px);animation:gfizz 1.1s ease-out forwards}
@keyframes gfizz{to{transform:translate(var(--dx),-40px) scale(4);opacity:0}}
/* lair */
.glair{position:fixed;inset:0;z-index:72;background:#000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 1s}
.glair.in{opacity:1}
.glair .room{position:relative;width:min(100vw,calc(100vh * .5));aspect-ratio:1/2;overflow:hidden}
.glair .room>img{width:100%;height:100%;display:block}
.glair .fire{position:absolute;overflow:visible;pointer-events:none}
.glair .fire i{position:absolute;bottom:0;width:46%;height:100%;overflow:hidden}
.glair .fire i b{display:block;width:1600%;height:100%;background:url(look/c-flame.webp) 0 0/100% 100% no-repeat;animation:gflame 1.05s steps(16) infinite}
.glair .fire i:nth-child(1){left:2%}.glair .fire i:nth-child(2){left:27%;height:120%}.glair .fire i:nth-child(3){left:52%}
.glair .fire i:nth-child(2) b{animation-duration:1.25s;animation-delay:-.4s}.glair .fire i:nth-child(3) b{animation-duration:.95s;animation-delay:-.7s}
@keyframes gflame{to{transform:translateX(-100%)}}
.glair .glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at var(--fx) var(--fy),rgba(255,140,50,.28),rgba(255,120,40,.08) 35%,transparent 60%);animation:gflick 2.3s linear infinite}
@keyframes gflick{0%{opacity:.8}9%{opacity:1}17%{opacity:.7}29%{opacity:.95}41%{opacity:.75}53%{opacity:1}64%{opacity:.72}78%{opacity:.92}100%{opacity:.8}}
.glair .spk{position:absolute;width:3px;height:3px;border-radius:50%;background:#ffcf6a;box-shadow:0 0 5px #ff8a20;pointer-events:none;animation:gspk linear infinite}
@keyframes gspk{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(var(--dx),-90px);opacity:0}}
.gx{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:3;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(214,178,100,.6);background:rgba(20,12,6,.75);color:#E8D2A0;cursor:pointer}
.glair .steam{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:rgba(235,235,240,.42);filter:blur(5px);pointer-events:none;animation:gsteam 3.4s ease-out infinite}
@keyframes gsteam{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.75}100%{transform:translate(var(--dx),-70px) scale(2.8);opacity:0}}
.glair .smoke{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:rgba(200,200,205,.55);filter:blur(3px);pointer-events:none;opacity:0;animation:gsmoke 6s ease-out infinite}
@keyframes gsmoke{0%,70%{transform:translate(0,0) scale(.5);opacity:0}74%{opacity:.85}100%{transform:translate(14px,-36px) scale(3.2);opacity:0}}
.glair .cry{position:absolute;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(150,220,255,.55),rgba(120,200,255,0) 70%);animation:gglow 3s ease-in-out infinite}
.glair .who{position:absolute;border:0;padding:0;background:none;cursor:pointer;border-radius:40% 40% 10% 10%}
.glair .x{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:3}
.glair .talk{position:absolute;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom) + 14px);z-index:3;padding:14px 16px 12px;border-radius:8px;
  background:linear-gradient(rgba(24,15,8,.94),rgba(14,9,5,.96));border:1px solid rgba(214,178,100,.55);box-shadow:0 10px 30px rgba(0,0,0,.7);cursor:pointer}
.glair .talk b{display:block;margin-bottom:4px;font:600 15px/1 var(--serif);color:#E0BC6C;letter-spacing:.03em}
.glair .talk p{margin:0;font:400 18px/1.42 var(--serif);color:#F0E2C0}
.glair .talk small{display:block;margin-top:8px;text-align:right;font:italic 400 13px var(--serif);color:rgba(240,226,192,.55)}
.glair .tip{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top) + 18px);text-align:center;font:italic 400 15px var(--serif);color:rgba(240,226,192,.7);pointer-events:none;transition:opacity .6s}
/* potion over the title */
.gpour{position:fixed;z-index:90;width:70px;height:94px;pointer-events:none;transform-origin:50% 20%}
.gpour img{width:100%;height:100%;object-fit:contain}
.gdrop{position:fixed;z-index:89;width:6px;height:9px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 40% 35%,#d8ffb0,#4aa02a);box-shadow:0 0 6px #8aff60;pointer-events:none}
#lookBtn.g-imbue{animation:gimbue 2.6s ease-out}
@keyframes gimbue{0%{text-shadow:none}30%{text-shadow:0 0 14px #9aff70,0 0 28px #5ad040;color:#d8ffb8}100%{text-shadow:none}}
@media (prefers-reduced-motion: reduce){.gch .mote,.glair .steam,.glair .smoke,.glair .glow,.glair .fire i b,.glair .spk{animation:none}}
`;
  document.head.appendChild(st);
})();

/* ---------- the items ---------- */
function keyLine(g) {
  const b = g.target && S.records.get(g.target);
  const line = g.lines && g.lines[g.target];
  if (line) return { tag: line, read: `Written on the tag in faded ink: “${line}”` };
  if (b) return { tag: b.title, read: `The ink on the tag has run. You can only make out a title: ${b.title}.` };
  return { tag: "…", read: "The tag is blank, worn smooth by many hands." };
}
const noteHTML = back => back
  ? `<div class="index-card gnote"><div class="card-head"><p class="card-title">Swish</p><p class="card-sub">1 item</p></div>
      <div class="card-body"><div class="item"><div class="it">Flick</div></div></div></div>`
  : `<div class="index-card gnote front" style="position:relative"><i class="fold"></i></div>`;
const ITEMS = {
  key: { name: "Brass key", w: 300, h: 250, front: "g-key-f", back: "g-key-b",
    desc: () => "A simple brass key. I wonder what it unlocks?" },
  wand: { name: "Willow wand", w: 320, h: 64, front: "g-wand-f", back: "g-wand-b",
    desc: g => g.spell ? "Ancient willow wand. Seems to emit a strange green glow. Imbued with the power of 1 spell."
      : "Ancient willow wand. Seems to emit a strange green glow. I need to learn spells to use it." },
  note: { name: "Folded note", w: 260, h: 150, note: true,
    desc: () => "A scrap of paper, folded in half. It’s the same paper your lists are written on." },
  potion: { name: "Dungeon Potion", w: 150, h: 200, front: "g-potion-f", back: "g-potion-b",
    desc: () => "A murky draught that smells of torch smoke and old stone. Galef says potions can transform the world around you." }
};
function thumb(k) {
  const it = ITEMS[k];
  return it.note ? noteHTML(false) : `<img src="${IMG(it.front)}" alt="">`;
}
async function faceHTML(k, back) {
  const it = ITEMS[k], g = game(), G = await geom();
  if (it.note) return noteHTML(back);
  let extra = "";
  if (k === "key" && back && G.keyTag) { const r = G.keyTag.back;
    extra = `<span class="gi-tag" style="left:${r[0] * 100}%;top:${r[1] * 100}%;width:${r[2] * 100}%;height:${r[3] * 100}%">${esc(keyLine(g).tag)}</span>`; }
  if (k === "wand") extra = `<i class="gi-glow" style="left:${back ? 4 : 96}%;top:50%"></i>`;
  if (k === "potion" && !back && G.potionLabel) { const r = G.potionLabel;
    extra = `<span class="gi-label" style="left:${r[0] * 100}%;top:${r[1] * 100}%;width:${r[2] * 100}%;height:${r[3] * 100}%">Dungeon</span>`; }
  return `<img src="${IMG(back ? it.back : it.front)}" alt="">${extra}`;
}

// If the book the key points to has left the shelves, the key quietly points at the next favourite instead.
export async function keepTarget() {
  const g = game(); if (!g.key || g.chamberDone) return;
  const t = g.target && S.records.get(g.target); if (t && !t.deleted) return;
  const c = gCandidates(), lines = g.lines || {}, k = c.filter(b => lines[b.id]), pool = k.length ? k : c;
  await saveGame({ target: pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null });
  if (!(game().lines || {})[game().target]) gLinesSoon(800);
}

/* ---------- the satchel ---------- */
export async function openBag(focus) {
  await keepTarget();
  const g = game(), items = (g.items || []).filter(k => ITEMS[k]);
  if (focus && items.includes(focus)) return inspect(focus);
  openSheet(`<h2 class="sheet-title">Your satchel</h2>
    ${items.length ? `<div class="gbag-grid">${items.map(k => `<button class="gbag-item" data-k="${k}"><span class="th">${thumb(k)}</span>${esc(ITEMS[k].name)}</button>`).join("")}</div>`
      : `<p class="muted">Empty, for now.</p>`}
    <p class="muted" style="text-align:center;margin-top:12px">Tap something to look at it closely.</p>`, body => {
    body.querySelectorAll("[data-k]").forEach(b => b.onclick = () => inspect(b.dataset.k));
  });
}
async function inspect(k) {
  const it = ITEMS[k], g = game();
  const [f, b] = await Promise.all([faceHTML(k, false), faceHTML(k, true)]);
  let acts = "";
  if (k === "wand") acts = g.spell ? `<button class="btn brass wide" id="gUse">Use spell</button><div class="gi-menu" id="gSpells" hidden><button class="btn wide" data-spell="lift">Levitation Charm</button></div>`
    : `<button class="btn wide" disabled>Use wand</button>`;
  if (k === "potion") acts = `<button class="btn brass wide" id="gUse">Use</button>`;
  openSheet(`<button class="gi-back" id="gBack">‹ Satchel</button>
    <div class="gi-stage" id="giStage"><div class="gi-obj" id="giObj" style="--w:${it.w}px;--h:${it.h}px">
      <div class="gi-face f">${f}</div><div class="gi-face b">${b}</div></div></div>
    <p class="gi-name">${esc(it.name)}</p><p class="gi-desc">${esc(it.desc(g))}</p>
    ${k === "key" ? `<p class="gi-read" id="giRead">${esc(keyLine(g).read)}</p>` : ""}
    <div class="gi-acts">${acts}</div>`, body => {
    const obj = $("#giObj", body); mountTurner($("#giStage", body), obj);
    $("#gBack", body).onclick = () => openBag();
    const rd = $("#giRead", body);
    if (rd) {   // the writing can only be read while the back is turned toward you
      const tick = () => { if (!rd.isConnected) return; const ry = parseFloat(obj.style.getPropertyValue("--ry")) || 0, a = ((ry % 360) + 360) % 360;
        rd.classList.toggle("on", a > 110 && a < 250); setTimeout(tick, 150); };
      tick();
    }
    const use = $("#gUse", body);
    if (use && k === "wand") use.onclick = () => { const m = $("#gSpells", body); m.hidden = !m.hidden; };
    body.querySelectorAll("[data-spell]").forEach(x => x.onclick = () => { closeSheet(); castSpell(); });
    if (use && k === "potion") use.onclick = () => { closeSheet(); pourPotion(); };
  });
}

/* ---------- picking something up: it rises, turns in a glow, and flies into the satchel ---------- */
async function collect(k, fromEl, caption) {
  const bag = $("#bagBtn"); if (bag) bag.hidden = false;
  const it = ITEMS[k], r = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : { left: innerWidth / 2 - 30, top: innerHeight / 2 - 30, width: 60, height: 60 };
  const W = Math.min(it.w, innerWidth - 60), H = it.h * W / it.w;
  const fx = document.createElement("div"); fx.className = "gfx";
  fx.innerHTML = `<div class="dim"></div><div class="halo"></div><div class="it" style="width:${W}px;height:${H}px">${it.note ? noteHTML(false) : `<img src="${IMG(it.front)}" alt="">`}</div><p class="cap">${esc(caption)}</p>`;
  document.body.appendChild(fx);
  const el = fx.querySelector(".it"), cx = innerWidth / 2 - W / 2, cy = innerHeight * 0.45 - H / 2;
  const from = `translate(${r.left + r.width / 2 - W / 2}px,${r.top + r.height / 2 - H / 2}px) scale(${Math.max(0.12, Math.min(1, r.width / W))})`;
  if (reduce()) { await wait(300); fx.remove(); return; }
  fx.querySelector(".dim").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: "forwards" });
  await el.animate([{ transform: `${from} rotateY(0deg)`, opacity: 0.4 }, { transform: `translate(${cx}px,${cy - 30}px) scale(1.1) rotateY(540deg)`, opacity: 1, offset: 0.7 },
    { transform: `translate(${cx}px,${cy}px) scale(1) rotateY(720deg)`, opacity: 1 }], { duration: 1300, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).finished;
  fx.querySelector(".halo").animate([{ opacity: 0, transform: "scale(.5)" }, { opacity: 1, transform: "scale(1)" }, { opacity: 0.7, transform: "scale(1.08)" }], { duration: 900, fill: "forwards" });
  fx.querySelector(".cap").animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 500, fill: "forwards" });
  await wait(1700);
  const br = bag ? bag.getBoundingClientRect() : { left: 20, top: 20, width: 30, height: 30 };
  fx.querySelector(".cap").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" });
  fx.querySelector(".halo").animate([{ opacity: 0.7 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
  fx.querySelector(".dim").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 200, fill: "forwards" });
  await el.animate([{ transform: `translate(${cx}px,${cy}px) scale(1)` }, { transform: `translate(${br.left + br.width / 2 - W / 2}px,${br.top + br.height / 2 - H / 2}px) scale(.08)`, opacity: 0.6 }],
    { duration: 700, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" }).finished;
  fx.remove();
  if (bag) { bag.classList.remove("pulse"); void bag.offsetWidth; bag.classList.add("pulse"); }
}
function mystery(text, hold = 2600) {
  return new Promise(res => {
    const m = document.createElement("div"); m.className = "gmyst"; m.innerHTML = `<p>${esc(text)}</p>`;
    document.body.appendChild(m); requestAnimationFrame(() => m.classList.add("in"));
    let done = false; const end = () => { if (done) return; done = true; m.classList.remove("in"); setTimeout(() => { m.remove(); res(); }, 800); };
    m.onclick = end; setTimeout(end, hold + 800);
  });
}
const addItems = (g, ...ks) => [...new Set([...(g.items || []), ...ks])];
const dropItems = (g, ...ks) => (g.items || []).filter(x => !ks.includes(x));

/* ---------- taps on the shelves ---------- */
export async function act(what, el) {
  if (what === "hole") return takeKey(el);
  if (what === "eye") return eye(el);
  if (what === "lair") return openLair();
}

/* the hole behind the handle: the handle swings back and a key spins out */
async function takeKey(el) {
  const g = game(); if (g.key || !g.doors) return;
  const knob = el.parentElement && el.parentElement.querySelector(".g-knob");
  if (knob) { knob.classList.remove("swing"); knob.classList.add("back"); }
  // whose opening line goes on the tag: the favourite, drawn at random among ties, preferring one whose line we already have
  const cands = gCandidates(), lines = g.lines || {};
  const known = cands.filter(b => lines[b.id]);
  const pool = known.length ? known : cands;
  const target = pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
  await collect("key", el, "A brass key spins out of the dark.");
  await saveGame({ key: true, bag: true, target, items: addItems(game(), "key") });
  render(); if (target && !(game().lines || {})[target]) gLinesSoon(800);
}

/* ---------- the keyhole on the back of the book ---------- */
export async function keyhole(bookId, khEl) {
  const g = game(); if (!g.key || g.chamberDone || g.target !== bookId) return;
  if (g.keyUsed) return openChamber(bookId);           // already unlocked: the way in is still open
  const sh = $("#sheet"); if (!sh || sh.querySelector(".gask")) return;
  const ask = document.createElement("div"); ask.className = "gask";
  ask.innerHTML = `<p>Use brass key?</p><div class="actions"><button class="btn brass" id="gYes">Use brass key</button><button class="btn quiet" id="gNo">Not now</button></div>`;
  const stage = sh.querySelector("#stage"); (stage || sh).style.position = "relative"; (stage || sh).appendChild(ask);
  ask.querySelector("#gNo").onclick = e => { e.stopPropagation(); ask.remove(); };
  ask.querySelector("#gYes").onclick = async e => {
    e.stopPropagation(); ask.remove();
    await keyTurn(khEl);
    await saveGame({ keyUsed: true, items: dropItems(game(), "key") });
    openChamber(bookId);
  };
}
async function keyTurn(khEl) {
  if (reduce() || !khEl) return;
  const r = khEl.getBoundingClientRect();
  const k = document.createElement("div"); k.className = "gkey-in"; k.innerHTML = `<img src="${IMG("g-key-f")}" alt="">`;
  document.body.appendChild(k);
  // the bow end comes toward the keyhole, slides in, turns a quarter, and is gone
  const x = r.left + r.width / 2 - 25, y = r.top + r.height * 0.35 - 30;
  await k.animate([{ transform: `translate(${x + 60}px,${y - 90}px) rotate(-60deg) scale(1.3)`, opacity: 0 },
    { transform: `translate(${x}px,${y}px) rotate(-90deg) scale(.7)`, opacity: 1, offset: 0.6 },
    { transform: `translate(${x}px,${y + 4}px) rotate(-90deg) scale(.45)`, opacity: 1 }], { duration: 900, easing: "ease-out", fill: "forwards" }).finished;
  await k.animate([{ transform: `translate(${x}px,${y + 4}px) rotate(-90deg) scale(.45)` }, { transform: `translate(${x}px,${y + 4}px) rotate(0deg) scaleX(.12) scaleY(.45)` }],
    { duration: 450, easing: "cubic-bezier(.6,0,.4,1)", fill: "forwards" }).finished;
  khEl.classList.add("open");
  await k.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }).finished;
  k.remove(); await wait(250);
}

/* ---------- the secret chamber inside the book ---------- */
async function openChamber(bookId) {
  const G = await geom(), cav = G.cavity || [0.25, 0.5, 0.5, 0.3], g = game();
  const ov = document.createElement("div"); ov.className = "gch";
  const motes = Array.from({ length: 16 }, (_, i) => `<i class="mote" style="left:${10 + Math.random() * 80}%;top:${15 + Math.random() * 70}%;--dx:${(Math.random() * 60 - 30).toFixed(0)}px;--dy:${(-30 - Math.random() * 50).toFixed(0)}px;animation-duration:${(5 + Math.random() * 6).toFixed(1)}s;animation-delay:-${(Math.random() * 8).toFixed(1)}s"></i>`).join("");
  const has = k => !(game().items || []).includes(k) && !(k === "wand" ? game().gotWand : game().gotNote);
  const cx = cav[0], cy = cav[1], cw = cav[2], chh = cav[3];
  ov.innerHTML = `<div class="box"><img src="${IMG("g-chamber")}" alt="A hollow cut into the pages of the book, thick with dust">
    ${motes}${Array.from({ length: 6 }, () => `<i class="puff" style="--dx:${(Math.random() * 120 - 60).toFixed(0)}px;--dy:${(-40 - Math.random() * 80).toFixed(0)}px"></i>`).join("")}
    ${has("wand") ? `<button class="take wand" style="left:${(cx - cw * 0.04) * 100}%;top:${(cy + chh * 0.22) * 100}%;width:${cw * 1.08 * 100}%;height:${chh * 0.28 * 100}%;transform:rotate(-16deg)" aria-label="A wand"><img src="${IMG("g-wand-f")}" alt=""></button>` : ""}
    ${has("note") ? `<button class="take note" style="left:${(cx + cw * 0.3) * 100}%;top:${(cy + chh * 0.48) * 100}%;width:${cw * 0.62 * 100}%;height:${chh * 0.46 * 100}%;transform:rotate(8deg)" aria-label="A folded note"><span class="nwrap"></span></button>` : ""}
    <p class="say">A hollow cut into the pages, thick with dust.</p></div>
    <button class="btn small leave" aria-label="Leave the chamber">Close</button>`;
  document.body.appendChild(ov); document.body.classList.add("locked");
  const nb = ov.querySelector(".take.note .nwrap");
  if (nb) { const w = nb.parentElement.getBoundingClientRect().width || 120; nb.innerHTML = noteHTML(false); nb.firstElementChild.style.transform = `scale(${w / 260})`; nb.firstElementChild.style.transformOrigin = "0 0"; }
  requestAnimationFrame(() => ov.classList.add("in"));
  const close = async () => { ov.classList.remove("in"); await wait(500); ov.remove(); if (!$("#sheet")) document.body.classList.remove("locked"); };
  ov.querySelector(".leave").onclick = close;
  const done = async () => {
    if (ov.querySelector(".take")) return;
    await saveGame({ chamberDone: true }); await wait(500); await close();
    if ($("#sheet")) openBook(bookId);
  };
  ov.querySelectorAll(".take").forEach(b => b.onclick = async () => {
    const k = b.classList.contains("wand") ? "wand" : "note"; if (b._t) return; b._t = true;
    b.style.visibility = "hidden";
    await collect(k, b, k === "wand" ? "An ancient willow wand, faintly glowing." : "A folded note.");
    await saveGame({ items: addItems(game(), k), [k === "wand" ? "gotWand" : "gotNote"]: true, bag: true });
    b.remove(); done();
  });
  if (!has("wand") && !has("note")) done();
  void g;
}

/* ---------- the spell list: "Wingardium" — "Leviosa" ---------- */
export async function spellList(name, listId) {
  let l = listId && S.records.get(listId);
  if (!l || l.deleted) {
    l = { kind: "list", id: uid("l"), name: name || "Wingardium", items: [cleanItem({ title: "Leviosa" })], createdAt: Date.now() };
  } else {
    l = clone(l); if (!(l.items || []).some(i => norm(i.title) === "leviosa")) l.items = [...(l.items || []), cleanItem({ title: "Leviosa" })];
  }
  await save(l);
  S.tab = "lists"; S.openLists.add(l.id); render();
  document.querySelectorAll(".nav [data-tab]").forEach(b => b.setAttribute("aria-current", b.dataset.tab === "lists" ? "page" : "false"));
  await wait(120);
  const card = [...document.querySelectorAll(".index-card")].find(c => c.querySelector(`[data-toggle-list="${l.id}"]`));
  if (card && !reduce()) {
    card.scrollIntoView({ block: "center", behavior: "smooth" }); await wait(500);
    await card.animate([{ boxShadow: "0 8px 18px rgba(0,0,0,.5)", filter: "none" },
      { boxShadow: "0 0 30px 8px rgba(150,255,160,.75), 0 0 80px 20px rgba(120,255,140,.35)", filter: "brightness(1.15)" },
      { boxShadow: "0 0 40px 12px rgba(150,255,160,.9), 0 0 100px 30px rgba(120,255,140,.45)", filter: "brightness(1.3)" }], { duration: 1500, fill: "forwards" }).finished;
    const bag = $("#bagBtn"), br = bag && !bag.hidden ? bag.getBoundingClientRect() : { left: 20, top: 20, width: 30, height: 30 }, cr = card.getBoundingClientRect();
    card.style.transformOrigin = "50% 50%";
    await card.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${br.left + br.width / 2 - cr.left - cr.width / 2}px,${br.top + br.height / 2 - cr.top - cr.height / 2}px) scale(.04) rotate(540deg)`, opacity: 0.3 }],
      { duration: 900, easing: "cubic-bezier(.55,0,.8,.2)", fill: "forwards" }).finished;
    if (bag) { bag.classList.remove("pulse"); void bag.offsetWidth; bag.classList.add("pulse"); }
  }
  await save({ kind: "list", id: l.id, deleted: true });
  S.openLists.delete(l.id);
  await saveGame({ spell: true });
  render();
  await mystery("The list glows with power, and is drawn into your satchel. Your wand hums: it has learned the Levitation Charm.", 3200);
}

/* ---------- casting: swish (a U) and flick (from the U's end, down through its bottom) ---------- */
function judge(pts) {
  if (pts.length < 8) return false;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const w = x1 - x0, h = y1 - y0; if (w < 70 || h < 60) return false;
  const n = pts.map(p => ({ x: (p.x - x0) / w, y: (p.y - y0) / h }));   // y grows downward
  const side = n[0].x < 0.5 ? 1 : -1, R = x => side === 1 ? x : 1 - x;  // the U can be drawn either way round
  if (R(n[0].x) > 0.4 || n[0].y > 0.55) return false;                   // swish starts high on one side
  // the top of the U's far side: the first point high up on the other side, after the stroke has been down low
  let low = false, iT = -1;
  for (let i = 0; i < n.length; i++) { if (n[i].y > 0.7) low = true; if (low && R(n[i].x) > 0.6 && n[i].y < 0.45) { iT = i; break; } }
  if (iT < 0) return false;
  // let it reach the top before the flick begins
  while (iT + 1 < n.length && n[iT + 1].y <= n[iT].y + 0.02) iT++;
  let iB = 0; for (let i = 1; i < iT; i++) if (n[i].y > n[iB].y) iB = i;   // the bottom of the U
  if (n[iB].y < 0.7 || R(n[iB].x) < 0.15 || R(n[iB].x) > 0.85) return false;
  const e = n[n.length - 1];                                             // the flick: from there down through the middle
  return n.length - iT > 2 && e.y > 0.6 && R(e.x) > 0.2 && R(e.x) < 0.78;
}
async function castSpell() {
  const ov = document.createElement("div"); ov.className = "gsp";
  ov.innerHTML = `<button class="btn small x">Close</button><h2>Levitation Charm</h2><p class="hint">Swish… and flick.</p>
    <div class="pad"><canvas></canvas><div class="wand"><img src="${IMG("g-wand-f")}" alt=""></div></div><p class="msg" aria-live="polite"></p>`;
  document.body.appendChild(ov); document.body.classList.add("locked"); requestAnimationFrame(() => ov.classList.add("in"));
  const pad = ov.querySelector(".pad"), cv = ov.querySelector("canvas"), wand = ov.querySelector(".wand"), msg = ov.querySelector(".msg");
  const dpr = Math.min(2, devicePixelRatio || 1), pr = pad.getBoundingClientRect();
  cv.width = pr.width * dpr; cv.height = pr.height * dpr; const cx = cv.getContext("2d"); cx.scale(dpr, dpr);
  let pts = [], trail = [], down = false, timer = null, fails = 0, over = false, raf = 0;
  const place = (x, y) => { wand.style.transform = `translate(${x - 200}px,${y - 20}px) rotate(-28deg)`; };
  place(pr.width * 0.75, pr.height * 0.8);
  const draw = () => {
    cx.clearRect(0, 0, pr.width, pr.height); const now = performance.now();
    trail = trail.filter(p => now - p.t < 900);
    for (let i = 1; i < trail.length; i++) { const a = trail[i - 1], b = trail[i], f = 1 - (now - b.t) / 900;
      cx.strokeStyle = `rgba(150,255,170,${f * 0.85})`; cx.lineWidth = 2 + f * 5; cx.lineCap = "round"; cx.shadowColor = "rgba(120,255,150,.9)"; cx.shadowBlur = 12;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); }
    raf = trail.length || down ? requestAnimationFrame(draw) : 0;
  };
  const at = e => { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
  pad.addEventListener("pointerdown", e => { if (over) return; down = true; clearTimeout(timer); try { pad.setPointerCapture(e.pointerId); } catch (_) {}
    const p = at(e); pts.push(p); trail.push(p); place(p.x, p.y); if (!raf) raf = requestAnimationFrame(draw); });
  pad.addEventListener("pointermove", e => { if (!down || over) return; const p = at(e); pts.push(p); trail.push(p); place(p.x, p.y); });
  const up = () => { if (!down) return; down = false; clearTimeout(timer); timer = setTimeout(check, 550); };
  pad.addEventListener("pointerup", up); pad.addEventListener("pointercancel", up);
  const burst = (x, y, cls, n) => { for (let i = 0; i < n; i++) { const s = document.createElement("i"); s.className = cls;
    s.style.left = x + "px"; s.style.top = y + "px"; s.style.setProperty("--dx", (Math.random() * 160 - 80).toFixed(0) + "px"); s.style.setProperty("--dy", (Math.random() * 160 - 100).toFixed(0) + "px");
    pad.appendChild(s); setTimeout(() => s.remove(), 1200); } };
  const close = async () => { over = true; cancelAnimationFrame(raf); ov.classList.remove("in"); await wait(400); ov.remove(); if (!$("#sheet")) document.body.classList.remove("locked"); };
  ov.querySelector(".x").onclick = close;
  async function check() {
    const ok = judge(pts), last = pts[pts.length - 1] || { x: pr.width / 2, y: pr.height / 2 }; pts = [];
    if (ok) {
      over = true; burst(last.x, last.y, "spark", 26); msg.textContent = "Wingardium Leviosa!";
      await wait(1300); await close();
      const already = game().lifted;
      await saveGame({ lifted: true }); render();
      await mystery(already ? "The air shimmers… but nothing more rises." : "Somewhere in the study, something has been lifted…", 3000);
    } else {
      fails++; burst(last.x, last.y, "fizz", 5);
      msg.textContent = fails < 3 ? "The wand sputters. Nothing happens." : "The wand sputters. A swish, like a U… then a flick down through it.";
    }
  }
}

/* ---------- the trapdoor beneath the lifted bookcase ---------- */
async function eye(el) {
  const n = live("book").length, trap = el.closest(".g-trap");
  if (n < 50) return mystery(`Your knowledge is insufficient. Read ${50 - n} more ${50 - n === 1 ? "book" : "books"}.`, 2600);
  await mystery("Your knowledge level is acceptable. Welcome to The Lair.", 2400);
  if (trap && !reduce()) { trap.classList.add("opening"); el.remove(); await wait(950); }
  await saveGame({ trapOpen: true }); render();
}

/* ---------- Galef's lair ---------- */
const GALEF = [
  "Ah! Footsteps in my study that aren’t my own. At last!",
  "I am Galef the Wise. And that willow wand at your belt… I hid it among these shelves a very long time ago, hoping a worthy apprentice would one day find it.",
  "You see, I did not become a great wizard by luck. Every spell I know, I first met in a book. Reading is the oldest magic there is.",
  "You found my key, my chamber and my charm. That takes a curious mind. So I shall teach you what I know: on your journey you’ll learn spells, and you’ll learn potions.",
  "Here, your first. Potions can transform the world around you: pour one where you wish to see a change, and watch.",
  "Thank you, apprentice. I’ve hidden more clues about the study, for new spells and for the next potion. Read widely, look closely… and we shall meet again."
];
const GIFT_AT = 4;
async function openLair() {
  const G = await geom(), L = G.lair || {}, g = game();
  const ov = document.createElement("div"); ov.className = "glair";
  const f = L.fire || [0.15, 0.4, 0.2, 0.12], wz = L.wizard || [0.35, 0.2, 0.35, 0.6];
  const pc = v => (v * 100).toFixed(2) + "%";
  ov.innerHTML = `<div class="room"><img src="${IMG("g-lair")}" alt="Galef’s lair: a stone room lit by a crackling fire, shelves of books, steaming potions, a small dragon on the mantel, and a wizard with a glowing staff">
      <div class="fire" style="left:${pc(f[0])};top:${pc(f[1])};width:${pc(f[2])};height:${pc(f[3])}"><i><b></b></i><i><b></b></i><i><b></b></i></div>
      <div class="glow" style="--fx:${pc(f[0] + f[2] / 2)};--fy:${pc(f[1] + f[3] * 0.7)}"></div>
      ${Array.from({ length: 9 }, (_, i) => `<i class="spk" style="left:${pc(f[0] + f[2] * (0.25 + Math.random() * 0.5))};top:${pc(f[1] + f[3] * 0.55)};--dx:${(Math.random() * 30 - 15).toFixed(0)}px;animation-duration:${(1.6 + Math.random() * 1.6).toFixed(2)}s;animation-delay:-${(Math.random() * 3).toFixed(2)}s"></i>`).join("")}
      ${(L.steam || []).map((p, i) => [0, 1, 2].map(j => `<i class="steam" style="left:${pc(p[0])};top:${pc(p[1])};--dx:${(Math.random() * 30 - 15).toFixed(0)}px;animation-delay:-${(j * 1.15 + i * 0.4).toFixed(2)}s"></i>`).join("")).join("")}
      ${L.nose ? `<i class="smoke" style="left:${pc(L.nose[0])};top:${pc(L.nose[1])}"></i><i class="smoke" style="left:${pc(L.nose[0])};top:${pc(L.nose[1])};animation-delay:-.35s"></i>` : ""}
      ${L.crystal ? `<i class="cry" style="left:${pc(L.crystal[0])};top:${pc(L.crystal[1])}"></i>` : ""}
      <button class="who" style="left:${pc(wz[0])};top:${pc(wz[1])};width:${pc(wz[2])};height:${pc(wz[3])}" aria-label="Galef the Wise"></button>
      <p class="tip">${g.metGalef ? "" : "Someone is here. Tap him."}</p>
    </div><button class="gx x" aria-label="Close"><svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>`;
  document.body.appendChild(ov); document.body.classList.add("locked"); requestAnimationFrame(() => ov.classList.add("in"));
  const room = ov.querySelector(".room");
  ov.querySelector(".x").onclick = async () => { ov.classList.remove("in"); await wait(900); ov.remove(); if (!$("#sheet")) document.body.classList.remove("locked"); };
  let talking = false;
  ov.querySelector(".who").onclick = async () => {
    if (talking) return; talking = true; const tip = ov.querySelector(".tip"); if (tip) tip.style.opacity = 0;
    const lines = game().metGalef ? ["Read widely, apprentice. The next clue is closer than you think."] : GALEF;
    const box = document.createElement("div"); box.className = "talk"; room.appendChild(box);
    for (let i = 0; i < lines.length; i++) {
      box.innerHTML = `<b>Galef the Wise</b><p>${esc(lines[i])}</p><small>${i < lines.length - 1 ? "Tap to continue" : "Tap to close"}</small>`;
      await new Promise(r => { box.onclick = r; });
      if (!game().metGalef && i === GIFT_AT && !gHas("potion")) {
        box.style.visibility = "hidden";
        await collect("potion", ov.querySelector(".who"), "The Dungeon Potion.");
        await saveGame({ metGalef: true, bag: true, items: addItems(game(), "potion") });
        box.style.visibility = "";
      }
    }
    box.remove(); talking = false;
  };
}

/* ---------- the Dungeon Potion, poured over the name of the study ---------- */
async function pourPotion() {
  const t = $("#lookBtn"), r = t.getBoundingClientRect();
  if (!reduce()) {
    const p = document.createElement("div"); p.className = "gpour"; p.innerHTML = `<img src="${IMG("g-potion-f")}" alt="">`;
    document.body.appendChild(p);
    const x = r.left + r.width * 0.55 - 35, y = r.top - 40;
    await p.animate([{ transform: `translate(${x + 40}px,${y + 120}px) scale(.6)`, opacity: 0 }, { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 }], { duration: 600, easing: "ease-out", fill: "forwards" }).finished;
    await p.animate([{ transform: `translate(${x}px,${y}px) rotate(0)` }, { transform: `translate(${x - 10}px,${y - 6}px) rotate(-125deg)` }], { duration: 650, easing: "ease-in-out", fill: "forwards" }).finished;
    for (let i = 0; i < 9; i++) {
      const d = document.createElement("i"); d.className = "gdrop"; document.body.appendChild(d);
      const dx = r.left + r.width * (0.2 + Math.random() * 0.6), sy = y + 10;
      d.animate([{ transform: `translate(${x + 8}px,${sy}px) scale(.6)`, opacity: 1 }, { transform: `translate(${dx}px,${r.top + r.height * 0.55}px) scale(1)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${dx}px,${r.top + r.height * 0.55}px) scale(1.6,.4)`, opacity: 0 }], { duration: 520, delay: i * 110, easing: "cubic-bezier(.5,0,1,.6)", fill: "forwards" }).finished.then(() => d.remove());
    }
    t.classList.remove("g-imbue"); void t.offsetWidth; t.classList.add("g-imbue");
    await wait(1100);
    await p.animate([{ opacity: 1 }, { opacity: 0, transform: `translate(${x - 10}px,${y - 30}px) rotate(-125deg) scale(.7)` }], { duration: 500, fill: "forwards" }).finished;
    p.remove();
  }
  const g = game();
  await saveGame({ potionUsed: true, won: [...new Set([...(g.won || []), "classic"])], items: dropItems(g, "potion") });
  await mystery("The Study shimmers, and the stones remember an older age. Tap its name to step into the dungeon.", 3200);
}

/* ---------- testing: jump straight to a step ---------- */
export async function setStep(n) {
  const g = game(), keep = { lines: g.lines || {} };
  const cands = gCandidates(), target = g.target || (cands[0] && cands[Math.floor(Math.random() * cands.length)].id) || null;
  const steps = [
    {},
    { doors: true },
    { doors: true, key: true, bag: true, target, items: ["key"] },
    { doors: true, key: true, bag: true, target, keyUsed: true, items: [] },
    { doors: true, key: true, bag: true, target, keyUsed: true, chamberDone: true, gotWand: true, gotNote: true, items: ["wand", "note"] },
    { doors: true, key: true, bag: true, target, keyUsed: true, chamberDone: true, gotWand: true, gotNote: true, items: ["wand", "note"], spell: true },
    { doors: true, key: true, bag: true, target, keyUsed: true, chamberDone: true, gotWand: true, gotNote: true, items: ["wand", "note"], spell: true, lifted: true },
    { doors: true, key: true, bag: true, target, keyUsed: true, chamberDone: true, gotWand: true, gotNote: true, items: ["wand", "note"], spell: true, lifted: true, trapOpen: true },
    { doors: true, key: true, bag: true, target, keyUsed: true, chamberDone: true, gotWand: true, gotNote: true, items: ["wand", "note", "potion"], spell: true, lifted: true, trapOpen: true, metGalef: true },
    { doors: true, key: true, bag: true, target, keyUsed: true, chamberDone: true, gotWand: true, gotNote: true, items: ["wand", "note"], spell: true, lifted: true, trapOpen: true, metGalef: true, potionUsed: true, won: ["classic"] }
  ];
  const st = steps[n] || {};
  await save({ kind: "game", id: "game", items: [], won: [], ...keep, ...st });
  LS.set("study-looks-won", JSON.stringify(st.won || []));
  const bag = $("#bagBtn"); if (bag) bag.hidden = !st.bag;
  S.crack.list = [];
  if (!openLooks().includes(lookNow()) || document.documentElement.dataset.look !== lookNow()) setLook("real"); else render();
  if (n === 2 && target && !(keep.lines || {})[target]) gLinesSoon(500);
  toast(`Galef’s game: step ${n}.`);
}
