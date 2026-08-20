// Color Alchemy headless checks, on the bundled CDP harness (cdp.mjs).
// Run from this folder:  node check.mjs   (build first: npm run build)
// Everything goes through the real input paths: mouse clicks on tiles, keyboard
// events, a stubbed gamepad through the poll loop. The bundle exposes NOTHING
// on window, so full runs are driven by clicking too — see attempt() below,
// which lands a whole combination in one round trip.
// Screenshots land next to this file as .shot-*.png for visual review.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { launch, check } from "./cdp.mjs";

const page = fileURLToPath(new URL("./dist/bundle.html", import.meta.url));
const t = await launch({ url: page });
const { evalJs, send, sleep } = t;

/* --------------------------------------------------------------- driving it
   Nothing is exposed on window: the bundle ships no test hooks, so every helper
   here goes through the surface a player touches — clicks on tiles, keys on
   window, and whatever the HUD and the board actually say. The one thing with
   no DOM form is the recipe tree, which is read out of src/elements.ts instead;
   see RECIPE below for what that costs. */

const tileClick = (id) =>
  `document.querySelector('[data-id=${id}]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`;
// Emptying the altar, the way a player would. The second slot has to go too:
// left set, the next pick on that element would PROMOTE it rather than mix,
// and cost no move. Clicking the cyan one promotes it (which clears both
// transient slots) and clicking it again lets go, so two clicks leave nothing
// held and nothing pending. A no-op when the altar is already empty.
const RELEASE = `(() => {
  const c = (e) => e && e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const b = document.querySelector('.t.E');
  if (b) { c(b); c(b); }
  c(document.querySelector('.t.e'));
})()`;
const release = () => evalJs(RELEASE);

// One combination, one round trip: release, pick a, pick b, release again so
// the next pair starts clean. selectAt is synchronous, so all four land before
// this resolves and the suite is no slower than the old hooks were.
const attempt = (a, b) =>
  evalJs(`(() => { ${RELEASE}; ${tileClick(a)}; ${tileClick(b)}; ${RELEASE}; })()`);

// The state the checks assert on, read off the page. questDone and fullDone are
// not written anywhere visible — but hud() composes the goal line FROM them, so
// the line is the state. (A run that has been unlocked says neither, which is
// right: it has not earned either.)
const state = () => evalJs(`(() => {
  const g = document.getElementById('gl').textContent;
  const tiles = [...document.querySelectorAll('.t')];
  const at = (c) => tiles.findIndex((t) => t.classList.contains(c));
  const full = g.includes('Complete');
  return JSON.stringify({
    found: tiles.map((t) => t.dataset.id),
    moves: +document.getElementById('mv').textContent,
    questDone: full || g.includes('Endgame'),
    fullDone: full,
    sel: at('e'),
    cursor: at('u'),
    phase: document.getElementById('ov').classList.contains('w') ? 'overlay'
         : document.getElementById('ti').classList.contains('w') ? 'menu' : 'play',
  });
})()`).then(JSON.parse);

// New game, without the menu dance: drop the saved run and reload. Same effect
// the button has — the codex and both bests deliberately survive.
const enterGame = () =>
  evalJs(`[...document.querySelectorAll('#mu button')]
    .find(b => /^(Continue|New game)$/.test(b.textContent)).click()`);
const reset = async () => {
  await evalJs(`localStorage.removeItem('colorAlchemy.run')`);
  await send("Page.navigate", { url: "file:///" + page.replace(/\\/g, "/") });
  await sleep(900);
  await enterGame();
};

// The recipe tree, parsed from the table the bundle is built from. This is the
// one assertion in the file that no longer looks at the shipped artifact: a
// build that mangled the map would still pass these. Accepted knowingly, as
// the price of shipping no hooks — everything else here is the real thing.
const ELSRC = readFileSync(new URL("./src/elements.ts", import.meta.url), "utf8");
const RECIPE = {};
for (const chunk of ELSRC.split('\n  { id:\"').slice(1)) {
  const id = chunk.slice(0, chunk.indexOf('\"'));
  const r = chunk.match(/\br:\[([\s\S]*?)\]\s*\},/);
  if (r) {
    for (const pr of r[1].matchAll(/\["([a-z0-9]+)","([a-z0-9]+)"\]/g)) {
      RECIPE[[pr[1], pr[2]].sort().join("+")] = id;
    }
  }
}

// best-score keys are scoped by a recipe-tree fingerprint — find them by prefix
const best = (kind) =>
  evalJs(`+(localStorage.getItem(Object.keys(localStorage)
    .find(k => k.startsWith('colorAlchemy.${kind}')) || '') || 0)`);
const click = (id) =>
  evalJs(`document.querySelector('[data-id=${id}]').dispatchEvent(new MouseEvent('click',{bubbles:true}))`);
const key = (k, init = {}) =>
  evalJs(`window.dispatchEvent(new KeyboardEvent('keydown',
    Object.assign({key:${JSON.stringify(k)}}, ${JSON.stringify(init)})))`);
const shot = async (name) => {
  await send("Page.enable");
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(new URL(`./.shot-${name}.png`, import.meta.url), Buffer.from(r.data, "base64"));
};

await sleep(700);

// --- boot -----------------------------------------------------------------
let s = await state();
check("boot: 3 starter elements", s.found.length === 3 && s.moves === 0);
check("boot: goal line names Rainbow and Unicorn",
  await evalJs(`document.getElementById('gl').textContent.includes('Rainbow')`));

// --- title screen ---------------------------------------------------------
check("boot: title screen shows COLOR / AlchemY, locked to one width",
  s.phase === "menu" &&
  await evalJs(`document.getElementById('tl').textContent === 'COLOR'
    && document.getElementById('tb').textContent === 'AlchemY'
    && document.getElementById('tb').children.length === 7`));
// The two words are one lockup: #tw is shrink-to-fit so COLOR sets the
// measure, and #tb's letters spread across it. Measured rather than assumed —
// a font change or a stray width would part them silently.
check("boot: COLOR and AlchemY come out the same width", await evalJs(`(() => {
  const t = document.getElementById('tl'), s = document.getElementById('tb');
  const track = parseFloat(getComputedStyle(t).letterSpacing) || 0;
  const a = t.getBoundingClientRect().width - track;
  const k = s.children;
  const b = k[k.length - 1].getBoundingClientRect().right - k[0].getBoundingClientRect().left;
  return Math.abs(a - b) / a < 0.02;
})()`));
check("boot: a fresh boot offers no Continue, having nothing to continue",
  (await evalJs(`[...document.querySelectorAll('#mu button')].map(b => b.textContent).join()`)) ===
  "New game,Highscore,Encyclopedia,Unlock all,Reset everything");
await shot("title");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'New game').click()`);
s = await state();
check("menu: New game enters the game", s.phase === "play");

// --- mouse: Red + Green -> Yellow ----------------------------------------
await click("red");
s = await state();
check("lock: the first pick locks into the cauldron",
  s.sel === 0 && await evalJs(`document.getElementById('ca').classList.contains('y')`) &&
  await evalJs(`document.getElementById('ca').textContent.includes('Red')`));
await click("green");
await sleep(100);
s = await state();
check("mouse: combining resolves in the cauldron, nothing to dismiss", s.phase === "play");
check("mouse: Yellow discovered, 1 move", s.found.includes("yellow") && s.moves === 1);
check("cauldron: the well shows the result and the quote sits under it",
  await evalJs(`document.getElementById('cr').textContent.includes('Yellow')`) &&
  await evalJs(`document.getElementById('cq').textContent.includes('not paint')`));
check("discovery: a first-EVER element takes the whole screen",
  await evalJs(`document.getElementById('ds').classList.contains('y')`) &&
  (await evalJs(`document.querySelectorAll('#ds .k').length`)) === 14 &&
  await evalJs(`document.getElementById('ds').textContent.includes('Yellow')`));
check("discovery: the rays step round the spectrum",
  (await evalJs(`document.querySelector('#ds .k').style.getPropertyValue('--c')`)) === "hsl(0 95% 62%)" &&
  (await evalJs(`[...document.querySelectorAll('#ds .k')][7].style.getPropertyValue('--c')`)) === "hsl(180 95% 62%)");
check("lock: Red is still held after the combine", s.sel === 0 &&
  await evalJs(`document.getElementById('ca').textContent.includes('Red')`));
check("cauldron: the second element is marked on the board while it sits in slot B",
  await evalJs(`document.getElementById('cb').textContent.includes('Green')`) &&
  (await evalJs(`[...document.querySelectorAll('.t.E')].map(t => t.dataset.id).join()`)) === "green");
await shot("cauldron");
// the second slot and the result clear themselves; the lock does not
await sleep(2400);
check("cauldron: the board mark clears with the slot",
  !(await evalJs(`!!document.querySelector('.t.E')`)));
check("cauldron: B and the result empty themselves, the lock stays",
  (await evalJs(`document.getElementById('cb').textContent`)) === "" &&
  (await evalJs(`document.getElementById('cr').textContent`)) === "" &&
  await evalJs(`document.getElementById('ca').textContent.includes('Red')`));
await click("red");
s = await state();
check("lock: picking the held element again releases it",
  s.sel === -1 && !(await evalJs(`document.getElementById('ca').classList.contains('y')`)));

// --- keyboard: cursor to Blue + Yellow -> White Light ---------------------
await key("ArrowRight");            // cursor is on red(0) after the release
await key("ArrowRight");            // -> blue(2)
await key("Enter");                 // lock blue
s = await state();
check("keyboard: arrows+Enter select an element", s.sel === 2 && s.cursor === 2);
await key("ArrowRight");
await key("Enter");                 // blue + yellow
await sleep(100);
s = await state();
check("keyboard: Blue+Yellow forges White Light", s.found.includes("white") && s.moves === 2);
await release();

// --- failed and duplicate combos both count as moves ----------------------
await click("green");
await click("yellow");
s = await state();
check("fail: no recipe still costs a move", s.moves === 3 && s.found.length === 5 && s.phase === "play");
check("fail: the cauldron says nothing happens",
  await evalJs(`document.getElementById('cq').textContent.includes('nothing happens')`));
check("fail: the cauldron shakes and the tiles do not",
  await evalJs(`document.getElementById('cd').classList.contains('x')`) &&
  !(await evalJs(`!!document.querySelector('.t.x')`)));
// green is still held, so one more pick is the whole rediscovery
await click("red");
s = await state();
check("dupe: rediscovery costs a move, adds nothing", s.moves === 4 && s.found.length === 5);
check("dupe: a rediscovery gets no full-screen animation",
  !(await evalJs(`document.getElementById('ds').classList.contains('y')`)));
check("dupe: the cauldron names the known result",
  await evalJs(`document.getElementById('cq').textContent.includes('already discovered')`));
check("dupe: only the known result pulses",
  (await evalJs(`[...document.querySelectorAll('.t.h')].map(t => t.dataset.id).join()`)) === "yellow");
// Red is the cyan secondary right now: tapping it takes over the lock from
// Green, empties both transient slots, and spends no move
check("lock: tapping the cyan secondary promotes it to the held element",
  (await evalJs(`[...document.querySelectorAll('.t.E')].map(t => t.dataset.id).join()`)) === "red");
await click("red");
s = await state();
check("lock: the promoted element is held and the slots are empty",
  s.sel === 0 && s.moves === 4 &&
  await evalJs(`document.getElementById('ca').textContent.includes('Red')`) &&
  (await evalJs(`document.getElementById('cb').textContent`)) === "" &&
  (await evalJs(`document.getElementById('cr').textContent`)) === "" &&
  !(await evalJs(`!!document.querySelector('.t.E')`)));

// --- encyclopedia: performed combinations only ----------------------------
// green is still held, so the first Escape releases the lock rather than
// reaching the menu — cancel first, leave second, exactly as Ⓑ behaves
await key("Escape");
s = await state();
check("lock: Escape releases the held element before it opens the menu",
  s.phase === "play" && s.sel === -1);
await key("Escape");
s = await state();
check("keyboard: Escape opens the menu", s.phase === "menu");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'Encyclopedia').click()`);
check("encyclopedia: lists discovered combinations",
  await evalJs(`document.getElementById('ml').textContent.includes('Red + Green')`) &&
  await evalJs(`document.getElementById('ml').textContent.includes('White Light')`));
check("encyclopedia: undiscovered elements stay hidden",
  !(await evalJs(`document.getElementById('ml').textContent.includes('Unicorn')`)));
check("encyclopedia: unperformed alternate recipes stay unspoiled",
  !(await evalJs(`document.getElementById('ml').textContent.includes('Red + Cyan')`)));
await key("Escape");   // close the panel
await key("Escape");   // back to the game
s = await state();
check("menu: Escape backs out to the game", s.phase === "play");

// --- drag & drop: drag one tile onto another ------------------------------
// Mouse path: pointerdown, a move past the threshold (lift), a move to the
// target, pointerup. Events go to the source tile — with pointer capture the
// real browser retargets them there too, so this mirrors live behavior.
const drag = (fromId, toTarget) =>
  evalJs(`(() => {
    const a = document.querySelector('[data-id=${fromId}]');
    const r = a.getBoundingClientRect();
    const to = ${toTarget
      ? `document.querySelector('[data-id=${toTarget}]').getBoundingClientRect()`
      : `{ left: 5, top: innerHeight - 5, width: 0, height: 0 }`};
    const x1 = r.left + r.width / 2, y1 = r.top + r.height / 2;
    const x2 = to.left + to.width / 2, y2 = to.top + to.height / 2;
    const ev = (type, x, y) => a.dispatchEvent(new PointerEvent(type,
      { bubbles: true, clientX: x, clientY: y, pointerType: 'mouse', button: 0, pointerId: 1 }));
    ev('pointerdown', x1, y1);
    ev('pointermove', x1 + 20, y1);
    ev('pointermove', x2, y2);
    ev('pointerup', x2, y2);
  })()`);
await drag("red", "blue");
await sleep(100);
s = await state();
check("drag: red onto blue forges Magenta",
  s.found.includes("magenta") && s.moves === 5 && s.phase === "play");
await release();
await drag("red", null);
s = await state();
check("drag: dropping on nothing costs no move", s.moves === 5 && s.sel === -1);

// --- gamepad: stubbed pad through the real poll loop ----------------------
await evalJs(`
  window.__pad = { connected: true, axes: [0,0,0,0],
    buttons: Array.from({length:17}, () => ({pressed:false})) };
  navigator.getGamepads = () => [window.__pad];
`);
const before = await state();
await evalJs("__pad.buttons[14].pressed = true");   // d-pad left, one edge
await sleep(120);
await evalJs("__pad.buttons[14].pressed = false");
await sleep(80);
s = await state();
check("gamepad: d-pad moves the cursor", s.cursor === Math.max(0, before.cursor - 1));
await evalJs("__pad.buttons[0].pressed = true");    // A selects
await sleep(120);
await evalJs("__pad.buttons[0].pressed = false");
await sleep(80);
s = await state();
check("gamepad: A selects at the cursor", s.sel === s.cursor);
await evalJs("__pad.buttons[1].pressed = true");    // B cancels
await sleep(120);
await evalJs("__pad.buttons[1].pressed = false");
await sleep(80);
s = await state();
check("gamepad: B cancels the selection", s.sel === -1);
await evalJs("__pad.buttons[1].pressed = true");    // B again, nothing selected
await sleep(120);
await evalJs("__pad.buttons[1].pressed = false");
await sleep(80);
s = await state();
check("gamepad: B with nothing selected opens the menu", s.phase === "menu");
check("hud: the Menu button names both shortcuts",
  (await evalJs(`document.getElementById('mn').textContent`)) === "MenuEsc / Ⓑ");
await evalJs("__pad.buttons[1].pressed = true");    // B closes it again
await sleep(120);
await evalJs("__pad.buttons[1].pressed = false");
await sleep(80);
s = await state();
check("gamepad: B backs out of the menu", s.phase === "play");
await evalJs("__pad.buttons[9].pressed = true");    // Start opens the menu
await sleep(120);
await evalJs("__pad.buttons[9].pressed = false");
await sleep(80);
s = await state();
check("gamepad: Start opens the menu", s.phase === "menu");
await evalJs("__pad.buttons[1].pressed = true");    // B closes it
await sleep(120);
await evalJs("__pad.buttons[1].pressed = false");
await sleep(80);
s = await state();
check("gamepad: B closes the menu", s.phase === "play");

// --- mute: one control for every sound, in any phase ----------------------
// Silence itself is checked by tools/music-probe.mjs against the real audio
// callback; what belongs here is that the bindings answer, say which way they
// went, cost no move, and are remembered.
const muteKey = () =>
  evalJs(`localStorage.getItem('colorAlchemy.mute')`);
const toastText = () => evalJs(`document.getElementById('to').textContent`);
let mv = (await state()).moves;
await key("m");
s = await state();
check("mute: M reports Sound off and costs no move",
  (await toastText()) === "Sound off" && s.moves === mv && s.phase === "play");
check("mute: the choice is stored, so a reload keeps it", (await muteKey()) === "1");
await evalJs("__pad.buttons[2].pressed = true");    // Ⓧ, the one face button left
await sleep(120);
await evalJs("__pad.buttons[2].pressed = false");
await sleep(80);
check("mute: pad Ⓧ turns the sound back on",
  (await toastText()) === "Sound on" && (await muteKey()) === "0");
check("hud: the Sound button names both shortcuts",
  (await evalJs(`document.getElementById('sn').textContent`)) === "SoundM / Ⓧ");
const sndLabel = () => evalJs(`document.getElementById('sn').firstChild.textContent`);
// click() above finds TILES by data-id; the HUD buttons go by element id
const clickBtn = (id) => evalJs(`document.getElementById('${id}').click()`);
await clickBtn("sn");
check("hud: the Sound button mutes, and its label follows",
  (await toastText()) === "Sound off" && (await sndLabel()) === "Muted" &&
  (await muteKey()) === "1" &&
  await evalJs(`document.getElementById('sn').classList.contains('Y')`));
await clickBtn("sn");
check("hud: clicking it again brings the sound back",
  (await toastText()) === "Sound on" && (await sndLabel()) === "Sound" &&
  (await muteKey()) === "0");

// --- hint: one standing hint, bought once ---------------------------------
// Read the toast back and verify the pair it names is genuinely useful right
// now: both halves held, and the thing they make not yet discovered. That is
// the whole contract — the hint never names the result, so the discovery card
// keeps its surprise, and the test cannot just compare against a fixed string
// (the pick is random among every productive pair). [+] rather than an escaped
// plus: these regexes ride to the page inside a template literal, which eats a
// lone backslash before the page ever sees it.
const clearToast = () => evalJs(`document.getElementById('to').textContent = ''`);
// the page reports what it holds and what the toast named; whether that pair is
// USEFUL is decided here, because the recipe tree lives on this side now
const hintNamesAUsefulPair = async () => {
  const r = JSON.parse(await evalJs(`(() => {
    const m = document.getElementById('to').textContent
      .match(/^Hint: try (.+) [+] (.+) — costs a move$/);
    if (!m) return "null";
    const tiles = [...document.querySelectorAll('.t')];
    const id = n => (tiles.find(t => t.querySelector('.n').textContent === n) || { dataset: {} }).dataset.id;
    return JSON.stringify({ a: id(m[1]), b: id(m[2]), found: tiles.map(t => t.dataset.id) });
  })()`));
  if (!r) return false;
  const made = RECIPE[[r.a, r.b].sort().join("+")];
  return !!made && r.found.includes(r.a) && r.found.includes(r.b) && !r.found.includes(made);
};
// the ids the toast names, whichever tail it carries
const hintedPair = () => evalJs(`(() => {
  const m = document.getElementById('to').textContent.match(/^Hint: try (.+) [+] (.+) —/);
  const id = n => ([...document.querySelectorAll('.t')]
    .find(t => t.querySelector('.n').textContent === n) || { dataset: {} }).dataset.id;
  return JSON.stringify(m ? [id(m[1]), id(m[2])] : null);
})()`).then(JSON.parse);
// the two tiles the toast names are the two that pulse (one round trip: the
// pulse is a .5s animation that clears itself)
const hintPulsesItsPair = () => evalJs(`(() => {
  const m = document.getElementById('to').textContent.match(/^Hint: try (.+) [+] (.+) —/);
  if (!m) return false;
  const id = n => ([...document.querySelectorAll('.t')]
    .find(t => t.querySelector('.n').textContent === n) || { dataset: {} }).dataset.id;
  const lit = [...document.querySelectorAll('.t.h')].map(t => t.dataset.id).sort();
  return JSON.stringify(lit) === JSON.stringify([id(m[1]), id(m[2])].sort());
})()`);

check("hud: the Hint button names both shortcuts",
  (await evalJs(`document.getElementById('ht').textContent`)) === "HintH / Ⓨ");
let m0 = (await state()).moves;
await key("h");
s = await state();
check("hint: H names a pair within reach and costs a move",
  s.moves === m0 + 1 && await hintNamesAUsefulPair());
check("hint: the pair it names is the pair that pulses", await hintPulsesItsPair());
const standing = await hintedPair();
m0 = s.moves;
await key("h", { repeat: true });
s = await state();
check("hint: a held H does not drain moves", s.moves === m0);
await clearToast();
await evalJs("__pad.buttons[3].pressed = true");    // Ⓨ, without having made it
await sleep(120);
await evalJs("__pad.buttons[3].pressed = false");
await sleep(80);
const repeatPulses = await hintPulsesItsPair();
s = await state();
check("hint: Y repeats the standing hint, and charges nothing",
  s.moves === m0 &&
  JSON.stringify(await hintedPair()) === JSON.stringify(standing) &&
  await evalJs(`document.getElementById('to').textContent.endsWith('already paid for')`));
check("hint: the repeat highlights the same pair again", repeatPulses);
await clearToast();
await evalJs(`document.getElementById('ht').click()`);
s = await state();
check("hint: the HUD button repeats it too, still free",
  s.moves === m0 && JSON.stringify(await hintedPair()) === JSON.stringify(standing));
// make it, and the hint retires: the next one is a different pair, at full price
await attempt(standing[0], standing[1]);
await release();
m0 = (await state()).moves;
await clearToast();
await key("h");
s = await state();
check("hint: once the pair is made, the next hint is new and charged",
  s.moves === m0 + 1 && await hintNamesAUsefulPair() &&
  JSON.stringify(await hintedPair()) !== JSON.stringify(standing));
m0 = s.moves;
await clearToast();
await key("Escape");                                // into the menu
await key("h");
s = await state();
check("hint: no hint outside play, and no move spent",
  s.phase === "menu" && s.moves === m0 &&
  !(await evalJs(`document.getElementById('to').textContent.startsWith('Hint')`)));
await key("Escape");                                // back to the game
s = await state();
check("hint: menu backs out to the game", s.phase === "play");
await shot("play");

// --- drive a full quest, then the full clear ------------------------------
// unicorn via the Sun + Rain rainbow; assumes yellow, white and magenta exist.
// The Prism route is no longer viable here: Prism needs a Diamond, which is the
// deepest thing in the game, so Prism belongs to the endgame list below.
// Night is Black + Sky now, and Black is the end of the wood chain, so the
// route drags in Knife, Tree, Wood and Charcoal on its way to a Star - and Magic
// spends that same Wood again.
const QUEST = [
  ["red","yellow"],       // orange
  ["blue","white"],       // air
  ["red","air"],          // fire
  ["air","blue"],         // sky
  ["fire","sky"],         // sun
  ["green","blue"],       // cyan
  ["blue","cyan"],        // water
  ["sky","water"],        // cloud
  ["cloud","water"],      // rain
  ["sun","rain"],         // rainbow
  ["green","orange"],     // earth
  ["green","water"],      // acid
  ["earth","fire"],       // lava
  ["lava","water"],       // stone
  ["fire","stone"],       // metal
  ["acid","metal"],       // electricity
  ["cloud","electricity"],// lightning
  ["lightning","water"],  // life
  ["earth","life"],       // animal
  ["life","sun"],         // plant
  ["earth","plant"],      // field
  ["animal","field"],     // horse
  ["fire","metal"],       // knife
  ["water","plant"],      // tree
  ["tree","knife"],       // wood
  ["wood","fire"],        // charcoal
  ["charcoal","stone"],   // black
  ["black","sky"],        // night
  ["night","white"],      // star
  ["wood","star"],        // magic
  ["horse","magic"],      // unicorn
];
// everything the quest route does NOT need: the colors past Magenta (Violet
// and Indigo left the critical path when Night stopped needing them), the
// mineral tail, the weather leftovers, and the flowers
const EXTRA = [
  ["blue","magenta"],     // violet
  ["blue","violet"],      // indigo
  ["red","white"],        // pink
  ["yellow","orange"],    // gold
  ["earth","sun"],        // sand
  ["sand","fire"],        // glass
  ["plant","sand"],       // cactus
  ["night","sun"],        // moon
  ["lightning","rain"],   // storm
  ["air","storm"],        // tornado
  ["water","night"],      // ice
  ["cloud","ice"],        // snow
  ["wood","charcoal"],    // pencil
  ["earth","water"],      // clay
  ["field","water"],      // park
  ["stone","life"],       // egg
  ["stone","animal"],     // lizard
  ["clay","fire"],        // pottery
  ["earth","lava"],       // volcano
  ["charcoal","lava"],    // diamond
  ["diamond","glass"],    // prism
  ["sun","pink"],         // sunset
  ["plant","pink"],       // flower
  ["sun","flower"],       // sunflower
  ["air","animal"],       // bird
  ["egg","bird"],         // chick
  ["bird","ice"],         // penguin
  ["animal","water"],     // fish
  ["bird","water"],       // duck
  ["bird","night"],       // owl
  ["bird","pink"],        // flamingo
  ["horse","water"],      // hippo
  ["animal","moon"],      // wolf
  ["horse","fire"],       // bone
  ["wolf","bone"],        // dog
  ["animal","plant"],     // cow
  ["animal","tree"],      // squirrel
  ["sun","tree"],         // fruit
  ["animal","flower"],    // bee
  ["bee","flower"],       // honey
  ["animal","honey"],     // bear
  ["bear","ice"],         // polar bear
  ["black","white"],      // grey
  ["glass","magic"],      // crystal ball
  ["wood","metal"],       // axe
  ["glass","metal"],      // mirror
  ["bird","fire"],        // phoenix
];
const run = async (pairs) => {
  for (const [a, b] of pairs) {
    await attempt(a, b);
    await release();
  }
};
await run(QUEST);
await sleep(100);
s = await state();
check("quest: overlay opens with Rainbow+Unicorn found", s.questDone && s.phase === "overlay");
const questMoves = s.moves;
check("quest: best stored on first completion", (await best("bestQuest")) === questMoves);
check("quest: overlay reports the move count",
  await evalJs(`document.getElementById('oc').textContent.includes('QUEST COMPLETE')`) &&
  await evalJs(`document.getElementById('oc').textContent.includes('${questMoves}')`));
await shot("quest");
await evalJs(`[...document.querySelectorAll('#ob button')].find(b => b.textContent === 'Keep playing').click()`);
s = await state();
check("quest: Keep playing returns to the game", s.phase === "play" && !s.fullDone);
check("quest: goal line switches to find-all",
  await evalJs(`document.getElementById('gl').textContent.includes('all 84')`));
check("night: icon is a starry blue-to-black swatch, not an emoji",
  await evalJs(`!!document.querySelector('[data-id=night] .s')
    && document.querySelector('[data-id=night] .s').style.background.includes('gradient')`));
check("night: comes from Black and Sky now, and Violet no longer makes it",
  RECIPE['black+sky'] === "night" &&
  RECIPE['sky+violet'] === undefined);
check("black: the one color no mixing of lights reaches, so it comes from the materials",
  RECIPE['charcoal+stone'] === "black" &&
  await evalJs(`!!document.querySelector('[data-id=black] .s')`));

// --- highscore screen: quest best visible, full best still hidden ---------
await key("Escape");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'Highscore').click()`);
check("highscore: shows the quest best",
  await evalJs(`document.getElementById('ml').textContent.includes('${questMoves} moves')`));
check("highscore: the complete-run best stays hidden",
  await evalJs(`document.getElementById('ml').textContent.includes('???')`));
// Back shares its container with the button column, so it is rebuilt — and
// re-wired — every time a subscreen opens. Clicking it is the only thing that
// proves the wiring came back with it.
await evalJs(`document.getElementById('mb').click()`);
check("highscore: Back puts the button column back",
  (await evalJs(`[...document.querySelectorAll('#mu button')].map(b => b.textContent).join()`))
    .includes("Highscore") &&
  !(await evalJs(`!!document.getElementById('ml')`)));
await key("Escape");
await key("Escape");
s = await state();
check("highscore: back to the game", s.phase === "play");

await run(EXTRA);
await sleep(100);
s = await state();
check("full: completion overlay after all 84", s.fullDone && s.phase === "overlay");
const fullMoves = s.moves;
check("full: hidden best stored", (await best("bestFull")) === fullMoves);
check("indigo: Newton's seventh band, between Blue and Violet",
  RECIPE['blue+violet'] === "indigo" &&
  await evalJs(`!!document.querySelector('[data-id=indigo] .s')`));
check("prism: icon is an inline SVG, sized by the same .s rules",
  await evalJs(`!!document.querySelector('[data-id=prism] svg.s')`) &&
  (await evalJs(`getComputedStyle(document.querySelector('[data-id=prism] svg.s')).width`)) === "32px");
check("full: overlay shows the hidden best",
  await evalJs(`document.getElementById('oc').textContent.includes('GRAND ALCHEMIST')`) &&
  await evalJs(`document.getElementById('oc').textContent.includes('complete run')`));
await shot("complete");

// --- new game keeps bests, hides the hidden one ---------------------------
await evalJs(`[...document.querySelectorAll('#ob button')].find(b => b.textContent === 'New game').click()`);
s = await state();
check("reset: back to 3 elements, 0 moves", s.found.length === 3 && s.moves === 0 && !s.questDone);
check("reset: quest best survives in the HUD",
  await evalJs(`document.getElementById('bq').textContent.includes('${questMoves}')`));
// innerText, not textContent: the page's own <script> source mentions the
// string, and textContent would read it; innerText sees only rendered text.
check("reset: hidden best appears nowhere outside the completion screen",
  !(await evalJs(`document.body.innerText.includes('complete run')`)));

// --- a perfect run must lower both bests ----------------------------------
// The true minimum, 33 moves. The Rainbow half is still cheap (Sun + Rain, and
// the Prism routes stay a scenic detour). What dominates is everything else:
// the Unicorn needs a Horse, which puts the whole life branch on the critical
// path, and Magic needs Wood + Star, which puts the whole wood chain there
// twice over — Wood itself, and Black at the end of it for the Night the Star
// needs. Both run off one Earth/Lava/Stone/Metal spine, and the Cloud does
// double duty for Rain and for Lightning.
const PERFECT_QUEST = [
  ["red","green"],        // yellow
  ["red","yellow"],       // orange
  ["blue","yellow"],      // white
  ["blue","white"],       // air
  ["red","air"],          // fire
  ["air","blue"],         // sky
  ["fire","sky"],         // sun
  ["green","blue"],       // cyan
  ["blue","cyan"],        // water
  ["sky","water"],        // cloud
  ["cloud","water"],      // rain
  ["sun","rain"],         // rainbow
  ["green","orange"],     // earth
  ["green","water"],      // acid
  ["earth","fire"],       // lava
  ["lava","water"],       // stone
  ["fire","stone"],       // metal
  ["acid","metal"],       // electricity
  ["cloud","electricity"],// lightning
  ["lightning","water"],  // life
  ["earth","life"],       // animal
  ["life","sun"],         // plant
  ["earth","plant"],      // field
  ["animal","field"],     // horse
  ["fire","metal"],       // knife
  ["water","plant"],      // tree
  ["tree","knife"],       // wood
  ["wood","fire"],        // charcoal
  ["charcoal","stone"],   // black
  ["black","sky"],        // night
  ["night","white"],      // star
  ["wood","star"],        // magic
  ["horse","magic"],      // unicorn
];
const PERFECT_EXTRA = [
  ["red","blue"],         // magenta
  ["blue","magenta"],     // violet
  ["blue","violet"],      // indigo
  ["red","white"],        // pink
  ["yellow","orange"],    // gold
  ["earth","air"],        // sand
  ["sand","fire"],        // glass
  ["plant","sand"],       // cactus
  ["night","sun"],        // moon
  ["lightning","rain"],   // storm
  ["air","storm"],        // tornado
  ["water","night"],      // ice
  ["cloud","ice"],        // snow
  ["wood","charcoal"],    // pencil
  ["earth","water"],      // clay
  ["field","water"],      // park
  ["stone","life"],       // egg
  ["stone","animal"],     // lizard
  ["clay","fire"],        // pottery
  ["earth","lava"],       // volcano
  ["charcoal","lava"],    // diamond
  ["diamond","glass"],    // prism
  ["sun","pink"],         // sunset
  ["plant","pink"],       // flower
  ["flower","yellow"],    // sunflower
  ["air","animal"],       // bird
  ["egg","bird"],         // chick
  ["bird","ice"],         // penguin
  ["animal","water"],     // fish
  ["bird","water"],       // duck
  ["bird","night"],       // owl
  ["bird","pink"],        // flamingo
  ["horse","water"],      // hippo
  ["animal","moon"],      // wolf
  ["animal","fire"],      // bone
  ["wolf","bone"],        // dog
  ["animal","plant"],     // cow
  ["animal","tree"],      // squirrel
  ["sun","tree"],         // fruit
  ["animal","flower"],    // bee
  ["bee","flower"],       // honey
  ["animal","honey"],     // bear
  ["bear","ice"],         // polar bear
  ["black","white"],      // grey
  ["glass","magic"],      // crystal ball
  ["wood","metal"],       // axe
  ["glass","metal"],      // mirror
  ["bird","fire"],        // phoenix
];
await run(PERFECT_QUEST);
await sleep(100);
s = await state();
check("perfect: quest done in 33 moves", s.questDone && s.moves === 33);
check("perfect: quest best lowered to 33", (await best("bestQuest")) === 33);
check("perfect: overlay celebrates the new best",
  await evalJs(`document.getElementById('oc').textContent.includes('NEW BEST')`));
await evalJs(`[...document.querySelectorAll('#ob button')].find(b => b.textContent === 'Keep playing').click()`);
await run(PERFECT_EXTRA);
s = await state();
check("perfect: full clear in 81 moves", s.fullDone && s.moves === 81);
check("perfect: hidden best lowered to 81", (await best("bestFull")) === 81);

// --- a sloppier run must NOT overwrite them -------------------------------
await reset();
// a wasted dupe, plus a Magenta the route no longer needs = 35 moves
await run([["red","green"], ["red","green"], ["blue","yellow"], ["red","blue"], ...QUEST]);
await sleep(100);
s = await state();
check("sloppy: quest done in 35 moves", s.questDone && s.moves === 35);
check("sloppy: best stays 33", (await best("bestQuest")) === 33);

// --- persistence: reload restores the run ---------------------------------
await evalJs(`[...document.querySelectorAll('#ob button')].find(b => b.textContent === 'Keep playing').click()`);
await send("Page.navigate", { url: "file:///" + page.replace(/\\/g, "/") });
await sleep(900);
s = await state();
check("reload: run restored, back on the title",
  s.moves === 35 && s.questDone && s.found.includes("rainbow") && s.phase === "menu");

// --- alternate recipe: Sun + Rain is also a Rainbow -----------------------
await reset();
await run([
  ["red","green"], ["blue","yellow"], ["blue","white"], ["red","air"],
  ["air","blue"], ["fire","sky"], ["green","blue"],
  ["blue","cyan"], ["sky","water"], ["cloud","water"], ["sun","rain"],
]);
s = await state();
check("alt: Sun+Rain forges the Rainbow, no Prism involved",
  s.found.includes("rainbow") && !s.found.includes("prism") && s.moves === 11);
check("alt: the intuitive pairs resolve too",
  JSON.stringify(['air+water', 'air+stone', 'fire+ice', 'air+penguin',
    'dog+wolf', 'charcoal+fire', 'air+fire'].map((k) => RECIPE[k])) ===
  '["cloud","sand","water","bird","dog","fire","fire"]');
check("alt: Diamond cuts Glass into a Prism, the only route to one",
  RECIPE['diamond+glass'] === "prism" &&
  RECIPE['glass+white'] === undefined);
check("alt: Prism + Sun is also a Rainbow",
  RECIPE['prism+sun'] === "rainbow");
check("alt: the Sky is blue Air now, and the Sun is lit from it",
  RECIPE['air+blue'] === "sky" &&
  RECIPE['fire+sky'] === "sun" &&
  RECIPE['air+sun'] === undefined);
check("alt: Fire needs Air to catch, and Orange no longer lights it",
  RECIPE['air+red'] === "fire" &&
  RECIPE['orange+red'] === undefined);
check("alt: the tool chain reversed - Fire + Metal is a Knife, and the Axe needs Wood",
  RECIPE['fire+metal'] === "knife" &&
  RECIPE['knife+tree'] === "wood" &&
  RECIPE['metal+wood'] === "axe");
check("alt: a whole Tree burns to Charcoal, no Wood in between",
  RECIPE['fire+tree'] === "charcoal" &&
  RECIPE['fire+wood'] === "charcoal");
// perform one, so the encyclopedia check below sees both Cloud routes
await run([["water","air"]]);

// --- title menu: New game arms first, then resets -------------------------
// the alt run left us in the game, so open the menu the way a player does. A
// run is in progress, so Continue is offered and New game sits behind it.
await key("Escape");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'New game').click()`);
check("menu: New game asks for confirmation",
  await evalJs(`[...document.querySelectorAll('#mu button')][1].textContent.includes('Sure')`));
await evalJs(`[...document.querySelectorAll('#mu button')][1].click()`);
s = await state();
check("menu: confirmed New game resets into play",
  s.phase === "play" && s.moves === 0 && s.found.length === 3);

// --- the codex: knowledge outlives runs -----------------------------------
// two plain clicks, not attempt(): the trailing release would promote the cyan
// element, and promoting empties the cauldron this check is about to read
await click("red");
await click("green");
s = await state();
check("rediscovery: a known element still lands in the well",
  s.phase === "play" &&
  await evalJs(`document.getElementById('cr').textContent.includes('Yellow')`));
await release();
await key("Escape");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'Encyclopedia').click()`);
check("encyclopedia: knowledge persists across runs",
  await evalJs(`document.getElementById('ml').textContent.includes('Unicorn')`) &&
  await evalJs(`document.getElementById('ml').textContent.includes('Glass')`));
check("encyclopedia: an element lists every route actually performed",
  await evalJs(`document.getElementById('ml').textContent.includes('Sky + Water')`) &&
  await evalJs(`document.getElementById('ml').textContent.includes('Water + Air')`));

// --- Unlock all / Reset everything ---------------------------------------
// both are destructive, so both take two presses; the second must land within
// 2.5s of the first
const menuBtn = async (label) =>
  evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent.startsWith('${label}')).click()`);
await reset();
await key("Escape");
s = await state();
check("unlock: the menu is open on a fresh board", s.phase === "menu" && s.found.length === 3);
await menuBtn("Unlock all");
check("unlock: the first press only arms the button",
  await evalJs(`!![...document.querySelectorAll('#mu button')].find(b => b.textContent.includes('Sure? (ends'))`) &&
  (await state()).found.length === 3);
await menuBtn("Sure? (ends");
s = await state();
check("unlock: the second press hands over every element",
  s.found.length === 84 && s.phase === "play" && s.moves === 0);
check("unlock: an unlocked run stops scoring, and says so",
  await evalJs(`document.getElementById('gl').textContent.includes('does not score')`) &&
  s.phase === "play" && !s.fullDone);
check("unlock: no best was written from it",
  (await best("bestFull")) === 81 && (await best("bestQuest")) === 33);
await key("Escape");
await menuBtn("Reset everything");
check("wipe: the first press only arms the button",
  await evalJs(`!![...document.querySelectorAll('#mu button')].find(b => b.textContent.includes('Sure? (scores'))`));
await menuBtn("Sure? (scores");
s = await state();
check("wipe: back to three elements, and both bests are gone",
  s.found.length === 3 && s.moves === 0 &&
  (await best("bestQuest")) === 0 && (await best("bestFull")) === 0);
check("wipe: Continue goes with the run it pointed at",
  (await evalJs(`[...document.querySelectorAll('#mu button')].map(b => b.textContent).join()`)) ===
  "New game,Highscore,Encyclopedia,Unlock all,Reset everything");
check("wipe: it puts everything back without starting a game",
  s.phase === "menu" &&
  !(await evalJs(`document.getElementById('gl').textContent.includes('does not score')`)));
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'Encyclopedia').click()`);
check("wipe: the all-time codex is gone too, not just the run",
  !(await evalJs(`document.getElementById('ml').textContent.includes('Unicorn')`)));

check("no uncaught exceptions", t.exceptions.length === 0);
if (t.exceptions.length) console.log(t.exceptions.join("\n"));
t.close();
