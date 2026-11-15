/* Galef's hidden game. Loaded on demand by index.html the first time the game needs it, so it costs the app nothing until then.
   It uses the app's own helpers (S, $, save, render, openSheet, closeSheet, toast, game, saveGame, ...). */
/* global S, $, esc, norm, uid, clone, save, render, openSheet, closeSheet, toast, cleanItem, live,
   game, gHas, saveGame, gCandidates, gLinesFetch, lookNow, setLook, openLooks, LS */

const IMG = n => `look/${n}.webp`;
const wait = ms => new Promise(r => setTimeout(r, ms));
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
let geo = null;   // where things sit inside the rendered pictures, and how the turntables are laid out
async function geom() {
  if (!geo) { try { geo = await (await fetch("look/g-geo.json")).json(); } catch (e) { geo = {}; } }
  return geo;
}
const ease = t => 1 - Math.pow(1 - t, 3);

/* ---------- styles, added once ---------- */
(function styles() {
  if (document.getElementById("g-css")) return;
  const st = document.createElement("style"); st.id = "g-css";
  st.textContent = `
.gfx{position:fixed;inset:0;z-index:80;cursor:pointer;-webkit-user-select:none;user-select:none}
.gfx .dim{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,rgba(40,26,10,.55),rgba(0,0,0,.86));opacity:0}
.gfx .rise{position:absolute;left:0;top:0;will-change:transform}
.gfx .halo{position:absolute;left:50%;top:42%;width:360px;height:360px;margin:-180px 0 0 -180px;border-radius:50%;opacity:0;pointer-events:none;
  background:radial-gradient(circle,rgba(255,226,150,.5),rgba(255,190,90,.16) 42%,rgba(255,170,60,0) 68%);animation:ghalo 3s ease-in-out infinite}
@keyframes ghalo{0%,100%{transform:scale(.94)}50%{transform:scale(1.06)}}
.gfx .rays{position:absolute;left:50%;top:42%;width:520px;height:520px;margin:-260px 0 0 -260px;opacity:0;pointer-events:none;
  background:repeating-conic-gradient(from 0deg,rgba(255,220,140,.13) 0deg 6deg,transparent 6deg 22deg);-webkit-mask:radial-gradient(circle,#000 18%,transparent 62%);mask:radial-gradient(circle,#000 18%,transparent 62%);animation:grays 18s linear infinite}
@keyframes grays{to{transform:rotate(360deg)}}
.gfx .cap{position:absolute;left:20px;right:20px;top:calc(42% + 150px);text-align:center;opacity:0;pointer-events:none}
.gfx .cap b{display:block;font:600 24px/1.25 var(--serif);color:#F4E2B0;text-shadow:0 0 14px rgba(255,190,90,.6),0 2px 3px #000}
.gfx .cap i{display:block;margin-top:10px;font:italic 400 16px var(--serif);color:rgba(244,226,176,.8);animation:gtap 1.8s ease-in-out infinite}
@keyframes gtap{0%,100%{opacity:.55}50%{opacity:1}}
.gmyst{position:fixed;inset:0;z-index:85;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:32px;cursor:pointer;
  background:radial-gradient(circle,rgba(14,8,26,.6),rgba(0,0,0,.88));opacity:0;transition:opacity .8s;-webkit-user-select:none;user-select:none}
.gmyst.in{opacity:1}
.gmyst p{max-width:330px;margin:0;text-align:center;font:italic 400 24px/1.42 var(--serif);letter-spacing:.01em;
  background:linear-gradient(100deg,#c9b2ff 0%,#f4ecff 18%,#b38cff 32%,#fff6d8 48%,#c9a2ff 62%,#f4ecff 80%,#c9b2ff 100%);background-size:300% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 10px rgba(170,110,255,.65)) drop-shadow(0 2px 2px rgba(0,0,0,.8));
  animation:gshim 4.5s linear infinite}
@keyframes gshim{from{background-position:0% 0}to{background-position:300% 0}}
.gmyst small{font:italic 400 14px var(--serif);color:rgba(220,205,255,.6);animation:gtap 2s ease-in-out infinite}
/* the turning objects */
.gsp3{position:relative;transform-style:preserve-3d}
.gsp3 .spr{position:absolute;inset:0;background-repeat:no-repeat;filter:drop-shadow(0 10px 12px rgba(0,0,0,.55))}
.gsp3 .gi-tag{position:absolute;left:0;top:0;width:112px;height:48px;transform-origin:0 0;display:flex;align-items:center;justify-content:center;text-align:center;
  padding:2px 4px;overflow:hidden;font:italic 500 9.5px/1.18 var(--serif);color:#2e1a08;pointer-events:none}
.gsp3 .gi-tag.long{font-size:8px}.gsp3 .gi-tag.vlong{font-size:6.6px}
.gsp3 .gi-glow{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle,rgba(140,255,170,.75),rgba(90,255,140,.2) 40%,rgba(90,255,140,0) 70%);animation:gglow 2.6s ease-in-out infinite}
@keyframes gglow{0%,100%{opacity:.45;transform:scale(.85)}50%{opacity:.9;transform:scale(1.12)}}
.gsp3.note{perspective:900px;transform-style:flat}
.gsp3.note .nrot{position:absolute;inset:0;transform-style:preserve-3d}
.gsp3.note .nf{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.gsp3.note .nf.b{transform:rotateY(180deg)}
.gsp3.note .gnote{width:100%;min-height:100%;margin:0;box-sizing:border-box}
/* satchel */
.gbag-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:12px;margin:10px 0 4px}
.gbag-item{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 8px 12px;border-radius:6px;border:1px solid rgba(214,178,100,.35);
  background:radial-gradient(circle at 50% 40%,rgba(255,220,160,.1),rgba(0,0,0,.25));color:inherit;font:600 15px/1.2 var(--serif);cursor:pointer}
.gbag-item .th{width:100px;height:68px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.gi-back{margin:0 0 6px;padding:4px 0;border:0;background:none;color:var(--brass-hi,#E0BC6C);font:600 15px var(--serif);cursor:pointer}
.gi-stage{height:260px;display:flex;align-items:center;justify-content:center;touch-action:none;cursor:grab;-webkit-user-select:none;user-select:none}
.gi-name{margin:6px 0 2px;text-align:center;font:600 21px/1.2 var(--serif)}
.gi-desc{margin:4px 0 12px;text-align:center;font:italic 400 17px/1.45 var(--serif);opacity:.92}
.gi-read{margin:-4px 0 12px;text-align:center;font:italic 400 16px/1.45 var(--serif);color:#E8D2A0;opacity:0;transition:opacity .4s}
.gi-read.on{opacity:1}
.gi-acts{display:flex;flex-direction:column;gap:8px}
.gi-hint{margin:-6px 0 10px;text-align:center;font:italic 400 13px var(--serif);opacity:.55}
/* the note: the very same paper as a list */
.gnote{margin:0;pointer-events:none}
.gnote .card-head{display:block;width:100%;text-align:left}
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
.gch .take .pic{position:absolute;inset:0;background-repeat:no-repeat;filter:drop-shadow(0 4px 5px rgba(0,0,0,.75))}
.gch .take.note .gnote{transform-origin:0 0;position:absolute;left:0;top:0}
.gch .say{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom) + 18px);text-align:center;font:italic 400 17px/1.4 var(--serif);color:#E8D2A0;text-shadow:0 2px 3px #000}
.gx{position:absolute;right:12px;top:calc(env(safe-area-inset-top) + 12px);z-index:4;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(214,178,100,.6);background:rgba(20,12,6,.78);color:#E8D2A0;cursor:pointer}
/* key into the lock */
.gkey-in{position:fixed;left:0;top:0;z-index:90;pointer-events:none;width:120px;height:96px;background-repeat:no-repeat}
.gask{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;width:220px;padding:14px;border-radius:8px;text-align:center;
  background:rgba(20,12,6,.94);border:1px solid rgba(214,178,100,.55);box-shadow:0 10px 30px rgba(0,0,0,.7)}
.gask p{margin:0 0 10px;font:italic 400 18px/1.3 var(--serif);color:#F2DDA6}
.gask .actions{justify-content:center}
/* spell */
.gsp{position:fixed;inset:0;z-index:75;background:radial-gradient(circle at 50% 40%,#18122a,#05040a 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;touch-action:none;opacity:0;transition:opacity .4s}
.gsp.in{opacity:1}
.gsp h2{margin:0 0 2px;font:600 24px/1.2 var(--serif);color:#EAD8A6}
.gsp .hint{margin:0 0 10px;font:italic 400 17px var(--serif);color:rgba(230,215,255,.75)}
.gsp .pad{position:relative;width:min(92vw,380px);height:min(60vh,420px);border-radius:12px;border:1px solid rgba(180,140,255,.25);background:radial-gradient(circle,rgba(120,80,200,.08),transparent 70%)}
.gsp .pad.done{border-color:transparent;background:none}
.gsp canvas{position:absolute;inset:0;width:100%;height:100%}
.gsp .wand{position:absolute;left:0;top:0;width:210px;height:75px;pointer-events:none;will-change:transform;background-repeat:no-repeat}
.gsp .msg{min-height:28px;margin:12px 0 0;font:italic 400 18px var(--serif);color:#E6D2FF;text-align:center}
.gsp .shard{position:absolute;inset:0;pointer-events:none;will-change:transform,opacity}
.gsp .flash{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,rgba(200,255,220,.6) 30%,rgba(150,255,190,0) 70%)}
.gsp .fizz{position:absolute;width:14px;height:14px;border-radius:50%;background:rgba(160,160,160,.6);filter:blur(4px);animation:gfizz 1.1s ease-out forwards}
@keyframes gfizz{to{transform:translate(var(--dx),-40px) scale(4);opacity:0}}
/* lair */
.glair{position:fixed;inset:0;z-index:72;background:#000;overflow:hidden;opacity:0;transition:opacity 1s;touch-action:none;-webkit-user-select:none;user-select:none}
.glair.in{opacity:1}
.glair .room{position:absolute;left:0;top:0;will-change:transform;cursor:grab}
.glair .room>img,.glair .lay{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}
.glair .wiz{transform-origin:var(--ox) var(--oy);animation:gfidget 7s ease-in-out infinite}
@keyframes gfidget{0%,100%{transform:none}22%{transform:scaleY(1.006) rotate(.35deg)}38%{transform:scaleY(1.002) rotate(.1deg)}55%{transform:scaleY(1.007) rotate(-.4deg)}72%{transform:scaleY(1.001) rotate(-.15deg)}86%{transform:scaleY(1.005) rotate(.2deg)}}
.glair .drag{transform-origin:var(--ox) var(--oy);animation:gbreathe 3.2s ease-in-out infinite}
@keyframes gbreathe{0%,100%{transform:none}45%{transform:scale(1.012,1.018)}}
.glair .firewin{position:absolute;inset:0;pointer-events:none;-webkit-mask:url(look/g-lair-fm.webp) 0 0/100% 100%;mask:url(look/g-lair-fm.webp) 0 0/100% 100%}
.glair .fire{position:absolute;overflow:visible;pointer-events:none}
.glair .fire i{position:absolute;bottom:0;width:46%;height:100%;overflow:hidden}
.glair .fire i b{display:block;width:1600%;height:100%;background:url(look/c-flame.webp) 0 0/100% 100% no-repeat;animation:gflame 1.05s steps(16) infinite}
.glair .fire i:nth-child(1){left:2%}.glair .fire i:nth-child(2){left:27%;height:120%}.glair .fire i:nth-child(3){left:52%}
.glair .fire i:nth-child(2) b{animation-duration:1.25s;animation-delay:-.4s}.glair .fire i:nth-child(3) b{animation-duration:.95s;animation-delay:-.7s}
@keyframes gflame{to{transform:translateX(-100%)}}
.glair .glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at var(--fx) var(--fy),rgba(255,140,50,.24),rgba(255,120,40,.07) 22%,transparent 40%);animation:gflick 2.3s linear infinite}
@keyframes gflick{0%{opacity:.8}9%{opacity:1}17%{opacity:.7}29%{opacity:.95}41%{opacity:.75}53%{opacity:1}64%{opacity:.72}78%{opacity:.92}100%{opacity:.8}}
.glair .spk{position:absolute;width:3px;height:3px;border-radius:50%;background:#ffcf6a;box-shadow:0 0 5px #ff8a20;pointer-events:none;animation:gspk linear infinite}
@keyframes gspk{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(var(--dx),-90px);opacity:0}}
.glair .steam{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:rgba(235,235,240,.42);filter:blur(5px);pointer-events:none;animation:gsteam 3.4s ease-out infinite}
@keyframes gsteam{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.75}100%{transform:translate(var(--dx),-70px) scale(2.8);opacity:0}}
.glair .smoke{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:rgba(200,200,205,.55);filter:blur(3px);pointer-events:none;opacity:0;animation:gsmoke 6s ease-out infinite}
@keyframes gsmoke{0%,70%{transform:translate(0,0) scale(.5);opacity:0}74%{opacity:.85}100%{transform:translate(-14px,-36px) scale(3.2);opacity:0}}
.glair .cry{position:absolute;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(150,220,255,.55),rgba(120,200,255,0) 70%);animation:gglow 3s ease-in-out infinite}
.glair .who{position:absolute;border:0;padding:0;background:none;cursor:pointer;outline:none}
.glair .talk{position:absolute;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom) + 14px);z-index:3;padding:14px 16px 12px;border-radius:8px;
  background:linear-gradient(rgba(24,15,8,.94),rgba(14,9,5,.96));border:1px solid rgba(214,178,100,.55);box-shadow:0 10px 30px rgba(0,0,0,.7);cursor:pointer;
  animation:gtalk .35s ease-out both}
@keyframes gtalk{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.glair .talk b{display:block;margin-bottom:4px;font:600 15px/1 var(--serif);color:#E0BC6C;letter-spacing:.03em}
.glair .talk p{margin:0;font:400 18px/1.42 var(--serif);color:#F0E2C0}
.glair .talk small{display:block;margin-top:8px;text-align:right;font:italic 400 13px var(--serif);color:rgba(240,226,192,.55)}
.glair .tip{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top) + 22px);z-index:3;text-align:center;font:italic 400 15px var(--serif);color:rgba(240,226,192,.75);
  text-shadow:0 1px 3px #000;pointer-events:none;transition:opacity .6s}
/* potion over the title */
.gpstage{position:fixed;inset:0;z-index:88;pointer-events:auto}
.gpstage .dim{position:absolute;inset:0;opacity:0;background:radial-gradient(circle at 50% 56%,rgba(12,30,10,.55),rgba(0,0,0,.88))}
.gpstage .rays{position:absolute;left:50%;top:56%;width:640px;height:640px;margin:-320px 0 0 -320px;opacity:0;pointer-events:none;
  background:repeating-conic-gradient(from 0deg,rgba(170,255,140,.2) 0deg 5deg,transparent 5deg 17deg);-webkit-mask:radial-gradient(circle,#000 12%,transparent 60%);mask:radial-gradient(circle,#000 12%,transparent 60%)}
.gpstage .gname{position:absolute;left:0;top:0;white-space:nowrap;line-height:1.1;transform-origin:0 0;color:#E9CF8E;text-shadow:0 2px 3px rgba(0,0,0,.8);
  background:linear-gradient(180deg,#f2ffe0 0%,#b6ff7a 22%,#5ad23a 46%,#E9CF8E 54%,#E9CF8E 100%);background-size:100% 260%;background-position:0 100%;-webkit-background-clip:text;background-clip:text}
.gpstage .gname.soak{color:transparent;animation:gsoak 1.6s ease-out forwards,gwet 2.2s 1.6s ease-in-out infinite;text-shadow:none;
  filter:drop-shadow(0 0 6px rgba(160,255,120,.9)) drop-shadow(0 0 22px rgba(90,220,70,.7)) drop-shadow(0 2px 2px rgba(0,0,0,.7))}
@keyframes gsoak{from{background-position:0 100%}to{background-position:0 0}}
@keyframes gwet{0%,100%{filter:drop-shadow(0 0 6px rgba(160,255,120,.9)) drop-shadow(0 0 22px rgba(90,220,70,.7))}50%{filter:drop-shadow(0 0 10px rgba(200,255,160,1)) drop-shadow(0 0 36px rgba(110,240,80,.85))}}
.gring{position:fixed;z-index:90;width:260px;height:120px;border-radius:50%;border:2px solid rgba(190,255,150,.9);box-shadow:0 0 18px rgba(140,255,110,.8),inset 0 0 18px rgba(140,255,110,.6);pointer-events:none}
.gpour{position:fixed;left:0;top:0;z-index:91;pointer-events:none;background-repeat:no-repeat}
.gstream{position:fixed;z-index:90;width:5px;border-radius:3px;pointer-events:none;transform-origin:50% 0;background:linear-gradient(#b8ff8a,#4ab02a);box-shadow:0 0 8px #8aff60}
.gdrop{position:fixed;left:0;top:0;z-index:92;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#e8ffc8,#4aa02a);box-shadow:0 0 6px #8aff60;pointer-events:none}
.gdrip{position:fixed;left:0;top:0;z-index:92;width:6px;height:11px;border-radius:50% 50% 50% 50%/40% 40% 60% 60%;background:linear-gradient(#c8ff9a,#3a9020);box-shadow:0 0 5px #8aff60;pointer-events:none;transform-origin:50% 0}
.gbloom{position:fixed;z-index:89;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(200,255,170,.75),rgba(120,240,100,.35) 30%,rgba(90,200,80,.12) 55%,rgba(60,160,60,0) 72%);mix-blend-mode:screen}
.gmote2{position:fixed;left:0;top:0;z-index:92;width:5px;height:5px;border-radius:50%;background:#eaffd8;box-shadow:0 0 8px #9aff70,0 0 2px #fff;pointer-events:none}
#lookBtn.g-imbue{animation:gimbue 3.4s ease-out}
@keyframes gimbue{0%{text-shadow:none}18%{text-shadow:0 0 10px #d8ffb8,0 0 24px #7aff50,0 0 48px #3ac030;color:#f0ffe0}55%{text-shadow:0 0 8px #b8ff90,0 0 22px #5ad040;color:#e0ffcc}100%{text-shadow:none}}
@media (prefers-reduced-motion: reduce){.gch .mote,.glair .steam,.glair .smoke,.glair .glow,.glair .fire i b,.glair .spk,.glair .wiz,.glair .drag,.gmyst p,.gfx .rays,.gfx .halo{animation:none}}
`;
  document.head.appendChild(st);
})();

/* ---------- the items ---------- */
function keyLine(g) {
  const b = g.target && S.records.get(g.target);
  const line = g.lines && g.lines[g.target];
  if (line) return { tag: line, read: `Written on the tag in faded ink: “${line}”`, ok: true };
  if (b) return { tag: "…", read: "The ink on the tag is still too faint to read. Give it a moment.", ok: false };
  return { tag: "…", read: "The tag is blank, worn smooth by many hands.", ok: false };
}
const noteHTML = back => back
  ? `<div class="index-card gnote"><div class="card-head"><p class="card-title">Swish</p><p class="card-sub">1 item</p></div>
      <div class="card-body"><div class="item"><div class="it">Flick</div></div></div></div>`
  : `<div class="index-card gnote front" style="position:relative;height:100%"><i class="fold"></i></div>`;
const SIZE = { key: [300, 240], wand: [336, 120], potion: [180, 240], note: [260, 150] };
const ITEMS = {
  key: { name: "Brass key", desc: () => "A simple brass key. I wonder what it unlocks?" },
  wand: { name: "Willow wand", desc: g => g.spell ? "Ancient willow wand. Seems to emit a strange green glow. Imbued with the power of 1 spell."
      : "Ancient willow wand. Seems to emit a strange green glow. I need to learn spells to use it." },
  note: { name: "Folded note", desc: () => "A scrap of paper, folded in half. It’s the same paper your lists are written on." },
  potion: { name: "Dungeon Potion", desc: () => "A murky draught that smells of torch smoke and old stone. Galef says potions can transform the world around you." }
};
const SPELLS = [{ id: "lift", name: "Levitation Charm", have: g => !!g.spell }];

/* A turning object. Key, wand and potion are rendered from 36 angles, so turning one shows its real sides and the light moving
   over it; the note is a sheet of paper, turned in 3D. set(angle) shows it at that angle; spin(by) turns it smoothly. */
function spinner(k, scale = 1) {
  const [w0, h0] = SIZE[k], w = Math.round(w0 * scale), h = Math.round(h0 * scale);
  const el = document.createElement("div"); el.className = "gsp3" + (k === "note" ? " note" : ""); el.style.width = w + "px"; el.style.height = h + "px";
  const T = ((geo || {}).turn || {})[k];
  if (k === "note") el.innerHTML = `<div class="nrot"><div class="nf f">${noteHTML(false)}</div><div class="nf b">${noteHTML(true)}</div></div>`;
  else el.innerHTML = `<i class="spr" style="background-image:url(${IMG(`g-${k}-t`)});background-size:${T ? T.cols * 100 : 600}% ${T ? Math.ceil(T.n / T.cols) * 100 : 600}%"></i>${k === "key" ? `<span class="gi-tag"></span>` : ""}${k === "wand" ? `<i class="gi-glow"></i>` : ""}`;
  if (k === "note") { const s = w / w0; el.querySelectorAll(".gnote").forEach(n => { n.style.width = w0 + "px"; n.style.minHeight = h0 + "px"; n.style.transform = `scale(${s})`; n.style.transformOrigin = "0 0"; }); }
  const spr = el.querySelector(".spr"), tag = el.querySelector(".gi-tag"), glow = el.querySelector(".gi-glow"), rot = el.querySelector(".nrot");
  const fit = txt => { tag.textContent = txt; tag.classList.toggle("long", txt.length > 70); tag.classList.toggle("vlong", txt.length > 120); };
  if (tag) fit(keyLine(game()).tag);
  let ang = 0, anim = 0;
  const facing = () => {
    if (k === "note") return Math.cos(ang * Math.PI / 180) < -0.2;
    if (k === "key" && T) { const f = frame(); return (T.marks.tagFacing || [])[f] > 0.3; }
    return false;
  };
  const frame = () => T ? ((Math.round(ang / (360 / T.n)) % T.n) + T.n) % T.n : 0;
  const set = a => {
    ang = a;
    if (rot) { rot.style.transform = `rotateX(-8deg) rotateY(${a}deg)`; return; }
    if (!T) return;
    const f = frame(), rows = Math.ceil(T.n / T.cols);
    spr.style.backgroundPosition = `${(f % T.cols) / (T.cols - 1) * 100}% ${Math.floor(f / T.cols) / Math.max(1, rows - 1) * 100}%`;
    if (tag && T.marks.tagBack) {
      const q = T.marks.tagBack[f].map(([x, y]) => [x * w, y * h]), fc = T.marks.tagFacing[f];
      tag.style.transform = quad(112, 48, q); tag.style.opacity = Math.max(0, Math.min(1, (fc - 0.12) / 0.25));
    }
    if (glow && T.marks.tip) { const p = T.marks.tip[f][0]; glow.style.left = p[0] * 100 + "%"; glow.style.top = p[1] * 100 + "%"; }
    el.dispatchEvent(new Event("turn"));
  };
  const spin = (by, ms = 650) => new Promise(res => {
    cancelAnimationFrame(anim); const a0 = ang, t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / ms); set(a0 + by * ease(p)); if (p < 1) anim = requestAnimationFrame(step); else res(); };
    anim = requestAnimationFrame(step);
  });
  const stop = () => cancelAnimationFrame(anim);
  set(k === "wand" ? 0 : 30);
  return { el, set, spin, stop, get angle() { return ang; }, facing, setLine: t => { if (tag) fit(t); } };
}
// CSS transform that lays a w×h box onto the four corners q (top-left, top-right, bottom-right, bottom-left)
function quad(w, h, q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1 || 1e-9, a13 = (dx3 * dy2 - dx2 * dy3) / det, a23 = (dx1 * dy3 - dx3 * dy1) / det;
  const a11 = x1 - x0 + a13 * x1, a21 = x3 - x0 + a23 * x3, a12 = y1 - y0 + a13 * y1, a22 = y3 - y0 + a23 * y3;
  return `matrix3d(${a11 / w},${a12 / w},0,${a13 / w},${a21 / h},${a22 / h},0,${a23 / h},0,0,1,0,${x0},${y0},0,1)`;
}
// drag to turn, tap to turn it round
function turnable(stage, sp) {
  let down = null;
  stage.addEventListener("pointerdown", e => { sp.stop(); down = { x: e.clientX, a: sp.angle, moved: 0, id: e.pointerId }; try { stage.setPointerCapture(e.pointerId); } catch (_) {} });
  stage.addEventListener("pointermove", e => { if (!down || e.pointerId !== down.id) return; const dx = e.clientX - down.x; down.moved = Math.max(down.moved, Math.abs(dx)); sp.set(down.a + dx * 0.9); });
  const up = e => { if (!down || e.pointerId !== down.id) return; const tap = down.moved < 6; down = null; if (tap) sp.spin(180); };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
}

/* ---------- the satchel ---------- */
// If the book the key points to has left the shelves, the key quietly points at the next favourite instead.
export async function keepTarget() {
  const g = game(); if (!g.key || g.chamberDone) return;
  const t = g.target && S.records.get(g.target); if (t && !t.deleted) return;
  const c = gCandidates(), lines = g.lines || {}, k = c.filter(b => lines[b.id]), pool = k.length ? k : c;
  await saveGame({ target: pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null });
  if (!(game().lines || {})[game().target]) gLinesFetch(true);
}
export async function openBag(focus) {
  await geom(); await keepTarget();
  const g = game(), items = (g.items || []).filter(k => ITEMS[k]);
  if (focus && items.includes(focus)) return inspect(focus);
  openSheet(`<h2 class="sheet-title">Your satchel</h2>
    ${items.length ? `<div class="gbag-grid">${items.map(k => `<button class="gbag-item" data-k="${k}"><span class="th"></span>${esc(ITEMS[k].name)}</button>`).join("")}</div>`
      : `<p class="muted">Empty, for now.</p>`}
    <p class="muted" style="text-align:center;margin-top:12px">Tap something to look at it closely.</p>`, body => {
    body.querySelectorAll("[data-k]").forEach(b => {
      const k = b.dataset.k, [w, h] = SIZE[k], sc = Math.min(100 / w, 68 / h);
      b.querySelector(".th").appendChild(spinner(k, sc).el);
      b.onclick = () => inspect(k);
    });
  });
}
async function inspect(k) {
  await geom();
  const it = ITEMS[k], g = game(), sc = Math.min(1, (innerWidth - 60) / SIZE[k][0]);
  const spells = k === "wand" ? SPELLS.filter(s => s.have(g)) : [];
  let acts = spells.map(s => `<button class="btn brass wide" data-spell="${s.id}">${esc(s.name)}</button>`).join("");
  if (k === "potion") acts = `<button class="btn brass wide" id="gUse">Pour it</button>`;
  openSheet(`<button class="gi-back" id="gBack">‹ Satchel</button>
    <div class="gi-stage" id="giStage"></div><p class="gi-hint">Drag to turn it. Tap to turn it over.</p>
    <p class="gi-name">${esc(it.name)}</p><p class="gi-desc">${esc(it.desc(g))}</p>
    ${k === "key" ? `<p class="gi-read" id="giRead"></p>` : ""}
    <div class="gi-acts">${acts}</div>`, body => {
    const sp = spinner(k, sc); $("#giStage", body).appendChild(sp.el); turnable($("#giStage", body), sp);
    $("#gBack", body).onclick = () => openBag();
    const rd = $("#giRead", body);
    if (rd) {   // the writing can only be read while the back of the tag is turned toward you
      const show = () => { const kl = keyLine(game()); rd.textContent = kl.read; sp.setLine(kl.tag); };
      show(); sp.el.addEventListener("turn", () => rd.classList.toggle("on", sp.facing()));
      const onLines = () => { if (rd.isConnected) show(); else document.removeEventListener("game-lines", onLines); };
      document.addEventListener("game-lines", onLines);
      if (!keyLine(game()).ok) gLinesFetch(true);
    }
    body.querySelectorAll("[data-spell]").forEach(x => x.onclick = () => { closeSheet(); castSpell(x.dataset.spell); });
    const use = $("#gUse", body); if (use) use.onclick = () => { closeSheet(); pourPotion(); };
  });
}

/* ---------- picking something up: it rises, turning slowly in a glow, and waits for a tap to go into the satchel ---------- */
async function collect(k, fromEl, name) {
  await geom();
  const bag = $("#bagBtn"); if (bag) bag.hidden = false;
  const r = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : { left: innerWidth / 2 - 30, top: innerHeight / 2 - 30, width: 60, height: 60 };
  const sc = Math.min(1.1, (innerWidth - 50) / SIZE[k][0]), sp = spinner(k, sc), W = parseFloat(sp.el.style.width), H = parseFloat(sp.el.style.height);
  const fx = document.createElement("div"); fx.className = "gfx";
  fx.innerHTML = `<div class="dim"></div><div class="rays"></div><div class="halo"></div><div class="rise"></div><div class="cap"><b>${esc(name)}</b><i>Tap to add to your satchel</i></div>`;
  const rise = fx.querySelector(".rise"); rise.appendChild(sp.el); document.body.appendChild(fx);
  const cx = innerWidth / 2 - W / 2, cy = innerHeight * 0.42 - H / 2;
  const sx = r.left + r.width / 2 - W / 2, sy = r.top + r.height / 2 - H / 2, s0 = Math.max(0.12, Math.min(1, r.width / W));
  // a slow, even turn the whole time it's held up
  let spinning = true, last = performance.now();
  const turn = t => { if (!spinning) return; sp.set(sp.angle + (t - last) * 0.12); last = t; requestAnimationFrame(turn); };
  if (!reduce()) requestAnimationFrame(turn);
  const fade = (sel, a, b, ms, delay = 0) => fx.querySelector(sel).animate([{ opacity: a }, { opacity: b }], { duration: ms, delay, fill: "forwards", easing: "ease-out" });
  fade(".dim", 0, 1, 500);
  await rise.animate([{ transform: `translate(${sx}px,${sy}px) scale(${s0})`, opacity: 0.5 }, { transform: `translate(${cx}px,${cy}px) scale(1)`, opacity: 1 }],
    { duration: reduce() ? 1 : 1100, easing: "cubic-bezier(.22,.8,.25,1)", fill: "forwards" }).finished;
  fade(".halo", 0, 1, 700); fade(".rays", 0, 1, 900); fade(".cap", 0, 1, 500, 150);
  await wait(450);
  await new Promise(res => { fx.addEventListener("pointerup", res, { once: true }); });
  const br = bag ? bag.getBoundingClientRect() : { left: 20, top: 20, width: 30, height: 30 };
  fade(".cap", 1, 0, 200); fade(".halo", 1, 0, 300); fade(".rays", 1, 0, 300); fade(".dim", 1, 0, 650, 150);
  await rise.animate([{ transform: `translate(${cx}px,${cy}px) scale(1)`, opacity: 1 },
    { transform: `translate(${br.left + br.width / 2 - W / 2}px,${br.top + br.height / 2 - H / 2}px) scale(.07)`, opacity: 0.7 }],
    { duration: 620, easing: "cubic-bezier(.5,0,.7,.2)", fill: "forwards" }).finished;
  spinning = false; fx.remove();
  if (bag) { bag.classList.remove("pulse"); void bag.offsetWidth; bag.classList.add("pulse"); }
}
// Words that appear out of the dark, shimmering, and stay until tapped.
function mystery(text) {
  return new Promise(res => {
    const m = document.createElement("div"); m.className = "gmyst"; m.innerHTML = `<p>${esc(text)}</p><small>Tap to continue</small>`;
    document.body.appendChild(m); requestAnimationFrame(() => m.classList.add("in"));
    const t0 = performance.now();
    m.addEventListener("pointerup", function end() {
      if (performance.now() - t0 < 600) return;
      m.removeEventListener("pointerup", end); m.classList.remove("in"); setTimeout(() => { m.remove(); res(); }, 800);
    });
  });
}
const addItems = (g, ...ks) => [...new Set([...(g.items || []), ...ks])];
const dropItems = (g, ...ks) => (g.items || []).filter(x => !ks.includes(x));

/* ---------- taps on the shelves ---------- */
export async function act(what, el) {
  if (what === "hole") return takeKey(el);
  if (what === "eye") return eye(el);
  if (what === "lair") return openLair();
  if (what === "lever") return lever(el);
}

/* the hole behind the handle: the handle swings back up and a key spins out */
async function takeKey(el) {
  const g = game(); if (g.key || !g.doors) return;
  const knob = el.parentElement && el.parentElement.querySelector(".g-knob");
  if (knob) { knob.classList.remove("swing"); knob.classList.add("back"); }
  const cands = gCandidates(), lines = g.lines || {};
  const known = cands.filter(b => lines[b.id]);
  const pool = known.length ? known : cands;
  const target = pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null;
  await saveGame({ target });
  if (target && !(game().lines || {})[target]) gLinesFetch(true);
  await collect("key", el, "A brass key");
  await saveGame({ key: true, bag: true, items: addItems(game(), "key") });
  render();
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
  await geom();
  if (reduce() || !khEl) return;
  const r = khEl.getBoundingClientRect(), sp = spinner("key", 0.42);
  const k = document.createElement("div"); k.className = "gkey-in"; k.style.width = sp.el.style.width; k.style.height = sp.el.style.height; k.appendChild(sp.el);
  document.body.appendChild(k);
  const W = parseFloat(sp.el.style.width), H = parseFloat(sp.el.style.height);
  // the key comes in end-on, its tip to the hole, slides home, turns a quarter, and is gone
  const x = r.left + r.width / 2 - W * 0.73, y = r.top + r.height * 0.35 - H * 0.37;
  sp.set(90);
  await k.animate([{ transform: `translate(${x + 40}px,${y - 60}px) scale(1.4)`, opacity: 0 }, { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 }],
    { duration: 700, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }).finished;
  await k.animate([{ transform: `translate(${x}px,${y}px) scale(1)` }, { transform: `translate(${x + W * 0.3}px,${y}px) scale(.8)` }], { duration: 350, easing: "ease-in", fill: "forwards" }).finished;
  k.style.transformOrigin = `${W * 0.73}px ${H * 0.37}px`;
  await k.animate([{ transform: `translate(${x + W * 0.3}px,${y}px) scale(.8) rotate(0)` }, { transform: `translate(${x + W * 0.3}px,${y}px) scale(.8) rotate(90deg)` }],
    { duration: 420, easing: "cubic-bezier(.6,0,.4,1)", fill: "forwards" }).finished;
  khEl.classList.add("open");
  await k.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: "forwards" }).finished;
  k.remove(); await wait(200);
}

/* ---------- the secret chamber inside the book ---------- */
async function openChamber(bookId) {
  const G = await geom(), cav = G.cavity || [0.25, 0.5, 0.5, 0.3];
  const ov = document.createElement("div"); ov.className = "gch";
  const motes = Array.from({ length: 16 }, () => `<i class="mote" style="left:${10 + Math.random() * 80}%;top:${15 + Math.random() * 70}%;--dx:${(Math.random() * 60 - 30).toFixed(0)}px;--dy:${(-30 - Math.random() * 50).toFixed(0)}px;animation-duration:${(5 + Math.random() * 6).toFixed(1)}s;animation-delay:-${(Math.random() * 8).toFixed(1)}s"></i>`).join("");
  const left = k => !(game().items || []).includes(k) && !(k === "wand" ? game().gotWand : game().gotNote);
  const [cx, cy, cw, chh] = cav, T = (G.turn || {}).wand;
  ov.innerHTML = `<div class="box"><img src="${IMG("g-chamber")}" alt="A hollow cut into the pages of the book, thick with dust">
    ${motes}${Array.from({ length: 6 }, () => `<i class="puff" style="--dx:${(Math.random() * 120 - 60).toFixed(0)}px;--dy:${(-40 - Math.random() * 80).toFixed(0)}px"></i>`).join("")}
    ${left("wand") ? `<button class="take wand" style="left:${(cx - cw * 0.06) * 100}%;top:${(cy + chh * 0.16) * 100}%;width:${cw * 1.12 * 100}%;height:${chh * 0.4 * 100}%;transform:rotate(-16deg)" aria-label="A wand"><i class="pic" style="background-image:url(${IMG("g-wand-t")});background-size:${T ? T.cols * 100 : 600}% ${T ? Math.ceil(T.n / T.cols) * 100 : 600}%;background-position:0 0"></i></button>` : ""}
    ${left("note") ? `<button class="take note" style="left:${(cx + cw * 0.3) * 100}%;top:${(cy + chh * 0.5) * 100}%;width:${cw * 0.62 * 100}%;height:${chh * 0.42 * 100}%;transform:rotate(8deg)" aria-label="A folded note"><span class="nwrap"></span></button>` : ""}
    <p class="say">A hollow cut into the pages, thick with dust.</p></div>
    <button class="gx leave" aria-label="Leave the chamber"><svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>`;
  document.body.appendChild(ov); document.body.classList.add("locked");
  const nb = ov.querySelector(".take.note .nwrap");
  if (nb) { const w = nb.parentElement.getBoundingClientRect().width || 120; nb.innerHTML = noteHTML(false); const n = nb.firstElementChild; n.style.width = "260px"; n.style.height = "150px"; n.style.transform = `scale(${w / 260})`; }
  requestAnimationFrame(() => ov.classList.add("in"));
  const close = async () => { ov.classList.remove("in"); await wait(500); ov.remove(); if (!$("#sheet")) document.body.classList.remove("locked"); };
  ov.querySelector(".leave").onclick = close;
  const done = async () => {
    if (ov.querySelector(".take")) return;
    await saveGame({ chamberDone: true }); await wait(400);
    // back to the study itself
    closeSheet(); S.tab = "shelves"; S.anchor = null; render(); scrollTo(0, 0);
    document.querySelectorAll(".nav [data-tab]").forEach(b => b.setAttribute("aria-current", b.dataset.tab === "shelves" ? "page" : "false"));
    await close(); document.body.classList.remove("locked");
  };
  ov.querySelectorAll(".take").forEach(b => b.onclick = async () => {
    const k = b.classList.contains("wand") ? "wand" : "note"; if (b._t) return; b._t = true;
    b.style.visibility = "hidden";
    await collect(k, b, k === "wand" ? "An ancient willow wand" : "A folded note");
    await saveGame({ items: addItems(game(), k), [k === "wand" ? "gotWand" : "gotNote"]: true, bag: true });
    b.remove(); done();
  });
  if (!left("wand") && !left("note")) done();
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
  await mystery("The list glows with power and is drawn into your satchel. Your wand has learned the Levitation Charm.");
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
  let low = false, iT = -1;
  for (let i = 0; i < n.length; i++) { if (n[i].y > 0.7) low = true; if (low && R(n[i].x) > 0.6 && n[i].y < 0.45) { iT = i; break; } }
  if (iT < 0) return false;
  while (iT + 1 < n.length && n[iT + 1].y <= n[iT].y + 0.02) iT++;
  let iB = 0; for (let i = 1; i < iT; i++) if (n[i].y > n[iB].y) iB = i;   // the bottom of the U
  if (n[iB].y < 0.7 || R(n[iB].x) < 0.15 || R(n[iB].x) > 0.85) return false;
  const e = n[n.length - 1];                                             // the flick: from there down through the middle
  return n.length - iT > 2 && e.y > 0.6 && R(e.x) > 0.2 && R(e.x) < 0.78;
}
async function castSpell(id) {
  await geom();
  const T = (geo.turn || {}).wand;
  const ov = document.createElement("div"); ov.className = "gsp";
  ov.innerHTML = `<button class="gx x" aria-label="Close"><svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>
    <h2>Levitation Charm</h2><p class="hint">Swish… and flick.</p>
    <div class="pad"><canvas></canvas><div class="wand" style="background-image:url(${IMG("g-wand-t")});background-size:${T ? T.cols * 100 : 600}% ${T ? Math.ceil(T.n / T.cols) * 100 : 600}%;background-position:0 0"></div></div><p class="msg" aria-live="polite"></p>`;
  document.body.appendChild(ov); document.body.classList.add("locked"); requestAnimationFrame(() => ov.classList.add("in"));
  const pad = ov.querySelector(".pad"), cv = ov.querySelector("canvas"), wand = ov.querySelector(".wand"), msg = ov.querySelector(".msg");
  const dpr = Math.min(2, devicePixelRatio || 1), pr = pad.getBoundingClientRect();
  cv.width = pr.width * dpr; cv.height = pr.height * dpr; const cx = cv.getContext("2d"); cx.scale(dpr, dpr);
  // the wand's tip (far right of the picture) follows your finger
  const tip = T && T.marks.tip ? T.marks.tip[0][0] : [0.96, 0.45];
  let pts = [], all = [], trail = [], down = false, timer = null, fails = 0, over = false, rf = 0;
  const place = (x, y) => { wand.style.transform = `translate(${x - tip[0] * 210}px,${y - tip[1] * 75}px) rotate(-24deg)`; wand.style.transformOrigin = `${tip[0] * 210}px ${tip[1] * 75}px`; };
  place(pr.width * 0.75, pr.height * 0.8);
  const line = (list, alpha, width, blur) => {
    for (let i = 1; i < list.length; i++) { const a = list[i - 1], b = list[i], f = alpha(b);
      if (f <= 0) continue;
      cx.strokeStyle = `rgba(150,255,170,${f})`; cx.lineWidth = width(b); cx.lineCap = "round"; cx.shadowColor = "rgba(120,255,150,.95)"; cx.shadowBlur = blur;
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); }
  };
  const draw = () => {
    cx.clearRect(0, 0, pr.width, pr.height); const now = performance.now();
    trail = trail.filter(p => now - p.t < 900);
    line(trail, b => (1 - (now - b.t) / 900) * 0.85, b => 2 + (1 - (now - b.t) / 900) * 5, 12);
    rf = trail.length || down ? requestAnimationFrame(draw) : 0;
  };
  const at = e => { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
  pad.addEventListener("pointerdown", e => { if (over) return; down = true; clearTimeout(timer); try { pad.setPointerCapture(e.pointerId); } catch (_) {}
    const p = at(e); pts.push(p); all.push(p); trail.push(p); place(p.x, p.y); if (!rf) rf = requestAnimationFrame(draw); });
  pad.addEventListener("pointermove", e => { if (!down || over) return; const p = at(e); pts.push(p); all.push(p); trail.push(p); place(p.x, p.y); });
  const up = () => { if (!down) return; down = false; clearTimeout(timer); timer = setTimeout(check, 550); };
  pad.addEventListener("pointerup", up); pad.addEventListener("pointercancel", up);
  const close = async () => { over = true; cancelAnimationFrame(rf); ov.classList.remove("in"); await wait(400); ov.remove(); if (!$("#sheet")) document.body.classList.remove("locked"); };
  ov.querySelector(".x").onclick = close;
  async function check() {
    const ok = judge(pts), last = pts[pts.length - 1] || { x: pr.width / 2, y: pr.height / 2 }, drawn = all.slice(); pts = []; all = [];
    if (!ok) {
      fails++;
      for (let i = 0; i < 5; i++) { const s = document.createElement("i"); s.className = "fizz"; s.style.left = last.x + "px"; s.style.top = last.y + "px"; s.style.setProperty("--dx", (Math.random() * 40 - 20).toFixed(0) + "px"); pad.appendChild(s); setTimeout(() => s.remove(), 1200); }
      msg.textContent = fails < 3 ? "The wand sputters. Nothing happens." : "The wand sputters. A swish, like a U… then a flick down through it.";
      return;
    }
    over = true; cancelAnimationFrame(rf); msg.textContent = "Wingardium Leviosa!";
    wand.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: "forwards" });
    await shatter(pad, cx, pr, drawn);
    await close();
    const again = game().lifted;
    await saveGame({ lifted: true }); render();
    await mystery(again ? "The air shimmers… but nothing more rises." : "Somewhere in the study, something has been lifted…");
  }
  void id;
}
// What you drew stays, glows and pulses, cracks with light, and shatters.
async function shatter(pad, cx, pr, pts) {
  const t0 = performance.now(), D = reduce() ? 300 : 1300;
  await new Promise(res => {
    const step = t => {
      const p = Math.min(1, (t - t0) / D), pulse = 0.65 + 0.35 * Math.sin(p * Math.PI * 4);
      cx.clearRect(0, 0, pr.width, pr.height);
      cx.lineCap = "round"; cx.lineJoin = "round";
      for (const [w, a, blur] of [[16 + 8 * pulse, 0.18 * pulse, 30], [7 + 3 * pulse, 0.6, 18], [2.5, 1, 6]]) {
        cx.strokeStyle = `rgba(${w > 10 ? "120,255,160" : "220,255,230"},${a})`; cx.lineWidth = w; cx.shadowColor = "rgba(140,255,170,1)"; cx.shadowBlur = blur;
        cx.beginPath(); pts.forEach((q, i) => i ? cx.lineTo(q.x, q.y) : cx.moveTo(q.x, q.y)); cx.stroke();
      }
      if (p > 0.55) {   // cracks of light running out from the stroke
        const c = (p - 0.55) / 0.45; cx.strokeStyle = `rgba(255,255,255,${0.9 * c})`; cx.lineWidth = 1.4; cx.shadowColor = "#fff"; cx.shadowBlur = 8;
        for (let i = 0; i < pts.length; i += Math.max(3, Math.floor(pts.length / 14))) {
          const q = pts[i], a = (i * 2.399) % (Math.PI * 2), L = 18 + 60 * c * ((i * 7) % 5 + 1) / 5;
          cx.beginPath(); cx.moveTo(q.x, q.y); cx.lineTo(q.x + Math.cos(a) * L * 0.5 + 4, q.y + Math.sin(a) * L * 0.5 - 3); cx.lineTo(q.x + Math.cos(a) * L, q.y + Math.sin(a) * L); cx.stroke();
        }
      }
      if (p < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
  if (reduce()) return;
  // break the picture into shards that fly apart in a flash of light
  const url = cx.canvas.toDataURL(), W = pr.width, H = pr.height, n = 14, pieces = [];
  const ctr = pts.reduce((a, q) => ({ x: a.x + q.x / pts.length, y: a.y + q.y / pts.length }), { x: 0, y: 0 });
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, R = Math.max(W, H) * 1.5;
    const poly = [[ctr.x, ctr.y], [ctr.x + Math.cos(a0) * R, ctr.y + Math.sin(a0) * R], [ctr.x + Math.cos(a1) * R, ctr.y + Math.sin(a1) * R]];
    const d = document.createElement("div"); d.className = "shard";
    d.style.background = `url(${url}) 0 0/${W}px ${H}px no-repeat`; d.style.clipPath = `polygon(${poly.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
    pad.appendChild(d); pieces.push([d, (a0 + a1) / 2]);
  }
  cx.clearRect(0, 0, W, H); pad.classList.add("done");
  const fl = document.createElement("i"); fl.className = "flash"; fl.style.left = ctr.x + "px"; fl.style.top = ctr.y + "px"; pad.appendChild(fl);
  fl.animate([{ transform: "scale(.2)", opacity: 1 }, { transform: "scale(18)", opacity: 0 }], { duration: 900, easing: "ease-out", fill: "forwards" });
  await Promise.all(pieces.map(([d, a]) => d.animate([{ transform: "none", opacity: 1, filter: "brightness(1.6)" },
    { transform: `translate(${Math.cos(a) * 160}px,${Math.sin(a) * 160}px) rotate(${(Math.random() * 80 - 40).toFixed(0)}deg) scale(.7)`, opacity: 0, filter: "brightness(3)" }],
    { duration: 900, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }).finished));
  await wait(150);
}

/* ---------- the trapdoor beneath the lifted bookcase ---------- */
async function eye(el) {
  const n = live("book").length, trap = el.closest(".g-trap");
  if (n < 50) return mystery(`Your knowledge is insufficient. Read ${50 - n} more ${50 - n === 1 ? "book" : "books"}.`);
  await mystery("Your knowledge level is acceptable. Welcome to The Lair.");
  if (trap && !reduce()) { trap.classList.add("opening"); el.remove(); await wait(1150); }
  await saveGame({ trapOpen: true }); render();
}
// The lever beside the eye lets the bookcase back down (and hides the trapdoor) until the charm is cast again.
async function lever(el) {
  const trap = el.closest(".g-trap"), caseEl = trap && trap.previousElementSibling;
  el.classList.add("pulled");
  if (!reduce()) {
    await wait(380);
    if (caseEl) { caseEl.style.animation = "none"; caseEl.animate([{ transform: "translateY(-16px)" }, { transform: "translateY(2px)", offset: 0.8 }, { transform: "none" }], { duration: 650, easing: "cubic-bezier(.5,0,.6,1)" }); }
    trap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 250, fill: "forwards" });
    await wait(680);
  }
  await saveGame({ lifted: false }); render();
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
  const f = L.fire || [0.15, 0.4, 0.2, 0.12], wz = L.wizard || [0.35, 0.2, 0.35, 0.6], wb = L.wizBox || [0.3, 0.2, 0.6, 0.75], db = L.dragBox || [0.7, 0.4, 0.9, 0.6];
  const pc = v => (v * 100).toFixed(2) + "%";
  ov.innerHTML = `<div class="room"><img src="${IMG("g-lair")}" alt="Galef’s lair: a stone room lit by a crackling fire, shelves of books, steaming potions, a small dragon on a stack of books, and a wizard with a glowing staff">
      <div class="firewin"><div class="fire" style="left:${pc(f[0])};top:${pc(f[1])};width:${pc(f[2])};height:${pc(f[3])}"><i><b></b></i><i><b></b></i><i><b></b></i></div></div>
      <div class="glow" style="--fx:${pc(f[0] + f[2] / 2)};--fy:${pc(f[1] + f[3] * 0.7)}"></div>
      ${Array.from({ length: 9 }, () => `<i class="spk" style="left:${pc(f[0] + f[2] * (0.25 + Math.random() * 0.5))};top:${pc(f[1] + f[3] * 0.4)};--dx:${(Math.random() * 30 - 15).toFixed(0)}px;animation-duration:${(1.6 + Math.random() * 1.6).toFixed(2)}s;animation-delay:-${(Math.random() * 3).toFixed(2)}s"></i>`).join("")}
      <img class="lay drag" src="${IMG("g-lair-drag")}" alt="" style="--ox:${pc((db[0] + db[2]) / 2)};--oy:${pc(db[3])}">
      <img class="lay wiz" src="${IMG("g-lair-wiz")}" alt="" style="--ox:${pc((wb[0] + wb[2]) / 2)};--oy:${pc(wb[3])}">
      ${(L.steam || []).map((p, i) => [0, 1, 2].map(j => `<i class="steam" style="left:${pc(p[0])};top:${pc(p[1])};--dx:${(Math.random() * 30 - 15).toFixed(0)}px;animation-delay:-${(j * 1.15 + i * 0.4).toFixed(2)}s"></i>`).join("")).join("")}
      ${L.nose ? `<i class="smoke" style="left:${pc(L.nose[0])};top:${pc(L.nose[1])}"></i><i class="smoke" style="left:${pc(L.nose[0])};top:${pc(L.nose[1])};animation-delay:-.35s"></i>` : ""}
      ${L.crystal ? `<i class="cry" style="left:${pc(L.crystal[0])};top:${pc(L.crystal[1])}"></i>` : ""}
      <button class="who" style="left:${pc(wz[0])};top:${pc(wz[1])};width:${pc(wz[2])};height:${pc(wz[3])}" aria-label="Galef the Wise"></button>
    </div>
    <p class="tip">${g.metGalef ? "Drag to look around." : "Someone is here. Tap him. Drag to look around."}</p>
    <button class="gx x" aria-label="Close"><svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button>`;
  document.body.appendChild(ov); document.body.classList.add("locked"); requestAnimationFrame(() => ov.classList.add("in"));
  const room = ov.querySelector(".room"), AR = (L.w || 1320) / (L.h || 1720);
  // the room is a little taller than the screen and a good deal wider; drag to look round it
  let RH = 0, RW = 0, x = 0, y = 0;
  const size = () => { RH = Math.max(innerHeight * 1.08, innerWidth / AR); RW = RH * AR; room.style.width = RW + "px"; room.style.height = RH + "px"; };
  const clamp = () => { x = Math.min(0, Math.max(innerWidth - RW, x)); y = Math.min(0, Math.max(innerHeight - RH, y)); room.style.transform = `translate(${x}px,${y}px)`; };
  size(); x = innerWidth / 2 - RW * ((wb[0] + wb[2]) / 2); y = (innerHeight - RH) / 2; clamp();
  let drag = null;
  room.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, x0: x, y0: y, moved: 0, id: e.pointerId }; });
  addEventListener("pointermove", function mv(e) { if (!ov.isConnected) return removeEventListener("pointermove", mv);
    if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved > 6) { x = drag.x0 + dx; y = drag.y0 + dy; clamp(); } });
  addEventListener("pointerup", function upf(e) { if (!ov.isConnected) return removeEventListener("pointerup", upf);
    if (!drag || e.pointerId !== drag.id) return; const tap = drag.moved <= 6, tgt = e.target; drag = null;
    if (tap && tgt && tgt.closest && tgt.closest(".who")) talk(); });
  addEventListener("resize", function rs() { if (!ov.isConnected) return removeEventListener("resize", rs); size(); clamp(); });
  ov.querySelector(".x").onclick = async () => { ov.classList.remove("in"); await wait(900); ov.remove(); if (!$("#sheet")) document.body.classList.remove("locked"); };
  let talking = false;
  async function talk() {
    if (talking) return; talking = true; const tip = ov.querySelector(".tip"); if (tip) tip.style.opacity = 0;
    const lines = game().metGalef ? ["Read widely, apprentice. The next clue is closer than you think."] : GALEF;
    const box = document.createElement("div"); box.className = "talk"; ov.appendChild(box);
    for (let i = 0; i < lines.length; i++) {
      box.innerHTML = `<b>Galef the Wise</b><p>${esc(lines[i])}</p><small>${i < lines.length - 1 ? "Tap to continue" : "Tap to close"}</small>`;
      await new Promise(r => { box.onclick = r; });
      if (!game().metGalef && i === GIFT_AT && !gHas("potion")) {
        box.style.visibility = "hidden";
        await collect("potion", ov.querySelector(".who"), "The Dungeon Potion");
        await saveGame({ metGalef: true, bag: true, items: addItems(game(), "potion") });
        box.style.visibility = "";
      }
    }
    box.remove(); talking = false;
  }
}

/* ---------- the Dungeon Potion, poured over the name of the study ----------
   The name lifts off the top bar into the middle of the screen (there's no room to pour above it up there),
   the potion tips over it, it splashes, drips and glows, and the name settles back into place, changed. */
async function pourPotion() {
  await geom();
  const t = $("#lookBtn");
  if (!reduce()) {
    const r0 = t.getBoundingClientRect(), cs = getComputedStyle(t);
    const stage = document.createElement("div"); stage.className = "gpstage";
    stage.innerHTML = `<i class="dim"></i><i class="rays"></i><b class="gname">${esc(t.textContent)}</b>`;
    document.body.appendChild(stage);
    const nm = stage.querySelector(".gname"), dim = stage.querySelector(".dim"), rays = stage.querySelector(".rays");
    nm.style.fontFamily = cs.fontFamily; nm.style.fontWeight = cs.fontWeight; nm.style.letterSpacing = cs.letterSpacing;
    nm.style.fontSize = Math.min(parseFloat(cs.fontSize) * 2, (innerWidth - 40) / Math.max(1, r0.width) * parseFloat(cs.fontSize)) + "px";
    const nr0 = nm.getBoundingClientRect();
    const cx = innerWidth / 2, cy = innerHeight * 0.56, nx = cx - nr0.width / 2, ny = cy - nr0.height / 2;
    nm.style.left = nx + "px"; nm.style.top = ny + "px";
    const k = r0.width / nr0.width, back = `translate(${r0.left - nx}px,${r0.top - ny}px) scale(${k})`;
    t.style.visibility = "hidden";
    dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: "forwards" });
    await nm.animate([{ transform: back }, { transform: "none" }], { duration: 900, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" }).finished;
    const r = nm.getBoundingClientRect();
    // the bottle: comes in from above, tips over the name
    const sp = spinner("potion", 0.66), W = parseFloat(sp.el.style.width), H = parseFloat(sp.el.style.height);
    const p = document.createElement("div"); p.className = "gpour"; p.style.width = W + "px"; p.style.height = H + "px"; p.style.transformOrigin = `${W / 2}px ${H * 0.3}px`; p.appendChild(sp.el);
    stage.appendChild(p); sp.set(0);
    const A = -118 * Math.PI / 180, v = [0, H * 0.04 - H * 0.3];          // mouth, relative to the pivot
    const mo = [v[0] * Math.cos(A) - v[1] * Math.sin(A), v[0] * Math.sin(A) + v[1] * Math.cos(A)];
    const hit = { x: r.left + r.width * 0.52, y: r.top + r.height * 0.3 }, mouth = { x: hit.x + 26, y: Math.max(H * 0.5, hit.y - 110) };
    const px = mouth.x - mo[0], py = mouth.y - mo[1], x = px - W / 2, y = py - H * 0.3;
    let turning = true, last = performance.now();
    const turn = tt => { if (!turning) return; sp.set(sp.angle + (tt - last) * 0.09); last = tt; requestAnimationFrame(turn); }; requestAnimationFrame(turn);
    await p.animate([{ transform: `translate(${x + 30}px,${y - 160}px) scale(.6)`, opacity: 0 }, { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 }], { duration: 800, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }).finished;
    turning = false; await sp.spin(-(sp.angle % 360), 300);    // label to the front as it tips
    await p.animate([{ transform: `translate(${x}px,${y}px) rotate(0)` }, { transform: `translate(${x}px,${y}px) rotate(-128deg)`, offset: 0.8 }, { transform: `translate(${x}px,${y}px) rotate(-118deg)` }],
      { duration: 700, easing: "ease-in-out", fill: "forwards" }).finished;
    // the stream
    const st = document.createElement("i"); st.className = "gstream"; stage.appendChild(st);
    st.style.left = mouth.x - 3 + "px"; st.style.top = mouth.y + "px"; st.style.height = Math.hypot(hit.x - mouth.x, hit.y - mouth.y) + "px";
    st.style.transform = `rotate(${(Math.atan2(hit.x - mouth.x, hit.y - mouth.y) * -180 / Math.PI).toFixed(1)}deg)`;
    await st.animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], { duration: 240, easing: "ease-in", fill: "forwards" }).finished;
    // it lands: the name is soaked from the top down, light bursts out, drops leap, drips run off the letters
    nm.classList.add("soak");
    rays.animate([{ opacity: 0, transform: "scale(.6) rotate(0)" }, { opacity: 1, transform: "scale(1) rotate(30deg)", offset: 0.35 }, { opacity: 0, transform: "scale(1.25) rotate(80deg)" }], { duration: 3600, easing: "ease-out", fill: "forwards" });
    const bloom = document.createElement("i"); bloom.className = "gbloom"; stage.appendChild(bloom);
    const bw = Math.max(r.width * 1.9, 320); bloom.style.width = bw + "px"; bloom.style.height = bw * 0.8 + "px"; bloom.style.left = r.left + r.width / 2 - bw / 2 + "px"; bloom.style.top = r.top + r.height / 2 - bw * 0.4 + "px";
    bloom.animate([{ transform: "scale(.15)", opacity: 0 }, { transform: "scale(1)", opacity: 1, offset: 0.25 }, { transform: "scale(1.08)", opacity: 0.9, offset: 0.7 }, { transform: "scale(1.3)", opacity: 0 }], { duration: 3800, easing: "ease-out", fill: "forwards" });
    const ring = document.createElement("i"); ring.className = "gring"; stage.appendChild(ring); ring.style.left = hit.x + "px"; ring.style.top = hit.y + "px";
    ring.animate([{ transform: "translate(-50%,-50%) scale(.1)", opacity: 1 }, { transform: "translate(-50%,-50%) scale(1)", opacity: 0 }], { duration: 1100, easing: "cubic-bezier(.1,.7,.3,1)", fill: "forwards" });
    const fly = (cls, x0, y0, kf, o) => { const d = document.createElement("i"); d.className = cls; stage.appendChild(d);
      d.animate(kf.map(q => ({ ...q, transform: `translate(${x0 + (q.dx || 0)}px,${y0 + (q.dy || 0)}px) ${q.s || ""}` })), { ...o, fill: "both" }).finished.then(() => d.remove()); };
    for (let i = 0; i < 26; i++) {   // the splash: droplets leaping off the letters in arcs
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, vv = 40 + Math.random() * 80;
      fly("gdrop", hit.x - 4 + (Math.random() - 0.5) * 40, hit.y - 4,
        [{ dx: 0, dy: 0, opacity: 1 }, { dx: Math.cos(a) * vv, dy: Math.sin(a) * vv, opacity: 1, offset: 0.4 }, { dx: Math.cos(a) * vv * 1.6, dy: Math.sin(a) * vv * 0.4 + 90, opacity: 0, s: "scale(.5)" }],
        { duration: 800 + Math.random() * 400, delay: Math.random() * 900, easing: "cubic-bezier(.2,.6,.6,1)", fill: "forwards" });
    }
    for (let i = 0; i < 14; i++) {   // drips gather along the bottom of the letters, stretch, and fall
      const dx = r.left + r.width * (0.06 + 0.88 * Math.random()), dy = r.top + r.height * (0.72 + Math.random() * 0.1);
      fly("gdrip", dx, dy, [{ dx: 0, dy: 0, opacity: 0, s: "scale(.6,.3)" }, { dx: 0, dy: 2, opacity: 1, s: "scale(1,1)", offset: 0.3 }, { dx: 0, dy: 7, opacity: 1, s: "scale(.8,2)", offset: 0.55 },
        { dx: 0, dy: 140 + Math.random() * 80, opacity: 0, s: "scale(.7,1.4)" }],
        { duration: 1700 + Math.random() * 800, delay: 400 + Math.random() * 1900, easing: "cubic-bezier(.6,0,.9,.5)", fill: "forwards" });
    }
    for (let i = 0; i < 34; i++) {  // and green light swirling up off the name
      const x0 = r.left + r.width * Math.random(), y0 = r.top + r.height * (0.2 + Math.random() * 0.6), a = Math.random() * Math.PI * 2;
      fly("gmote2", x0, y0, [{ dx: 0, dy: 0, opacity: 0, s: "scale(.4)" }, { dx: Math.cos(a) * 18, dy: -16, opacity: 1, s: "scale(1.2)", offset: 0.3 }, { dx: Math.cos(a + 2) * 34, dy: -70 - Math.random() * 60, opacity: 0, s: "scale(.4)" }],
        { duration: 1700 + Math.random() * 1000, delay: 300 + Math.random() * 2200, easing: "ease-out", fill: "forwards" });
    }
    await wait(1300);
    st.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(100% 0 0 0)" }], { duration: 280, easing: "ease-out", fill: "forwards" }).finished.then(() => st.remove());
    p.animate([{ opacity: 1, transform: `translate(${x}px,${y}px) rotate(-118deg)` }, { opacity: 0, transform: `translate(${x + 20}px,${y - 60}px) rotate(-40deg) scale(.7)` }], { duration: 700, easing: "ease-in", fill: "forwards" });
    await wait(1900);
    // the name settles back where it belongs, still glowing
    dim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 200, fill: "forwards" });
    await nm.animate([{ transform: "none" }, { transform: back }], { duration: 900, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" }).finished;
    t.style.visibility = ""; t.classList.remove("g-imbue"); void t.offsetWidth; t.classList.add("g-imbue");
    stage.remove();
  }
  const g = game();
  await saveGame({ potionUsed: true, won: [...new Set([...(g.won || []), "classic"])], items: dropItems(g, "potion") });
  await mystery("The Study shimmers, and its stones remember an older age. Tap its name to step into the dungeon.");
}

/* ---------- testing: jump straight to a step ---------- */
export async function setStep(n) {
  const g = game(), keep = { lines: g.lines || {} };
  const cands = gCandidates(), target = g.target || (cands[0] && cands[Math.floor(Math.random() * cands.length)].id) || null;
  const base = { doors: true, key: true, bag: true, target };
  const done = { ...base, keyUsed: true, chamberDone: true, gotWand: true, gotNote: true, items: ["wand", "note"] };
  const steps = [
    {}, { doors: true }, { ...base, items: ["key"] }, { ...base, keyUsed: true, items: [] }, done,
    { ...done, spell: true }, { ...done, spell: true, lifted: true }, { ...done, spell: true, lifted: true, trapOpen: true },
    { ...done, spell: true, lifted: true, trapOpen: true, metGalef: true, items: ["wand", "note", "potion"] },
    { ...done, spell: true, lifted: true, trapOpen: true, metGalef: true, potionUsed: true, won: ["classic"] }
  ];
  const st = steps[n] || {};
  await save({ kind: "game", id: "game", items: [], won: [], ...keep, ...st });
  LS.set("study-looks-won", JSON.stringify(st.won || []));
  const bag = $("#bagBtn"); if (bag) bag.hidden = !st.bag;
  S.crack.list = [];
  if (!openLooks().includes(lookNow()) || document.documentElement.dataset.look !== lookNow()) setLook("real"); else render();
  if (st.key && target && !(keep.lines || {})[target]) gLinesFetch(true);
  toast(`Galef’s game: step ${n}.`);
}
