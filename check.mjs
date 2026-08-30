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

// The shipping bundle by default; any other build is an argument, which is how
// the director's cut gets the same 149 checks:  node check.mjs dist/director.html
const page = fileURLToPath(new URL(process.argv[2] || "./dist/bundle.html", import.meta.url));
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
// Emptying the altar, the way a player would, whichever state the pick is in:
// a cyan (loose) pick locks on the next click and lets go on the one after, a
// gold (locked) one lets go on the first. Two clicks on the cyan one and one on
// the gold one therefore leave nothing picked, and it is a no-op when nothing
// is.
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
    pick: at('E'),
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
// The save file is ONE entry holding one array; these indexes mirror the
// S_* constants in src/game.ts and src/store.ts.
const SLOT = { tree: 0, run: 1, bestQuest: 2, bestFull: 3, codex: 4, mute: 5 };
const cellGet = (i) => evalJs(`(JSON.parse(localStorage.getItem("colorAlchemy") || "[]") || [])[${i}]`);
const cellClear = (i) => evalJs(`(() => {
  const c = JSON.parse(localStorage.getItem("colorAlchemy") || "[]") || [];
  c[${i}] = 0; localStorage.setItem("colorAlchemy", JSON.stringify(c));
})()`);
const reset = async () => {
  await cellClear(SLOT.run);
  await send("Page.navigate", { url: "file:///" + page.replace(/\\/g, "/") });
  await sleep(900);
  await enterGame();
};

// The recipe tree, parsed from the table the bundle is built from. This is the
// one assertion in the file that no longer looks at the shipped artifact: a
// build that mangled the map would still pass these. Accepted knowingly, as
// the price of shipping no hooks — everything else here is the real thing.
const ELSRC = readFileSync(new URL("./src/elements.ts", import.meta.url), "utf8");
// The element count is DERIVED, not written down: the table grows, and a test
// that has to be edited every time one is added is a test that gets edited
// carelessly. Everything below counts from the source of truth instead.
const RECIPE = {};
const ENTRIES = ELSRC.split('\n  { id:\"').slice(1);
const COUNT = ENTRIES.length;
for (const chunk of ENTRIES) {
  const id = chunk.slice(0, chunk.indexOf('\"'));
  const r = chunk.match(/\br:\[([\s\S]*?)\]\s*\},/);
  if (r) {
    for (const pr of r[1].matchAll(/\["([a-zA-Z0-9 ]+)","([a-zA-Z0-9 ]+)"\]/g)) {
      RECIPE[[pr[1], pr[2]].sort().join("+")] = id;
    }
  }
}

// bests are scoped by a recipe-tree fingerprint, which now rides in slot 0
// rather than being suffixed onto two key names
const best = async (kind) => +((await cellGet(SLOT[kind])) || 0);
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

// The help line is NOT in the template any more — src/css.ts appends it as a
// text node with gl.after(), so it rides in the roadroller payload instead of
// the zip's deflate stream (worth -17 B; the wordmark's seven spans were tried
// the same way and cost +5, because repeated markup deflates better than the
// code to generate it). It has no element of its own, so nothing but this
// check would notice if it stopped being written.
check("boot: the help line is appended into <f>, after the goal line",
  await evalJs(`(() => {
    const f = document.querySelector("f");
    const t = f.textContent.replace(gl.textContent, "");
    return t.includes("tap one to pick") && t.includes("costs a move")
      && f.lastChild.nodeType === 3;
  })()`));

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
// Unlock all and Reset everything are DEVELOPMENT TOOLS, behind __DEV__ and
// absent from a plain `npm run build`. One suite covers both builds: it asks the
// menu which one this is, then either exercises the two or asserts they are
// genuinely gone. `npm run build-dev` is the build that has them.
const DEVBUILD = await evalJs(
  `[...document.querySelectorAll('#mu button')].some(b => b.textContent === 'Unlock all')`);
const MENU_FRESH = "New game,Highscores,Encyclopedia" +
  (DEVBUILD ? ",Unlock all,Reset everything" : "");
check("boot: a fresh boot offers no Continue, having nothing to continue",
  (await evalJs(`[...document.querySelectorAll('#mu button')].map(b => b.textContent).join()`)) ===
  MENU_FRESH);
check(`boot: the ${DEVBUILD ? "dev" : "shipping"} build ${DEVBUILD ? "offers" : "has no"} development tools`,
  DEVBUILD === (await evalJs(`[...document.querySelectorAll('#mu button')]
    .some(b => /Unlock all|Reset everything/.test(b.textContent))`)));
await shot("title");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'New game').click()`);
s = await state();
check("menu: New game enters the game", s.phase === "play");

// --- mouse: Red + Green -> Yellow ----------------------------------------
await click("red");
s = await state();
check("pick: the first tap picks the element, loose — cyan, and no lock ring",
  s.pick === 0 && s.sel === -1 &&
  !(await evalJs(`document.getElementById('ca').classList.contains('y')`)) &&
  await evalJs(`document.getElementById('ca').textContent.includes('Red')`));
// The lock is not colour alone: a padlock badge marks it on the tile and on the
// cauldron slot, so gold-versus-cyan is not the only thing carrying the state.
check("pick: a loose pick wears no padlock in either place",
  (await evalJs(`getComputedStyle(document.querySelector('[data-id=red]'), '::after').content`)) === "none" &&
  (await evalJs(`getComputedStyle(document.getElementById('ca'), '::before').content`)) === "none");
await click("red");
s = await state();
check("lock: the second tap on the same element locks it",
  s.sel === 0 && s.pick === -1 &&
  await evalJs(`document.getElementById('ca').classList.contains('y')`) &&
  await evalJs(`document.getElementById('ca').textContent.includes('Red')`));
check("lock: a padlock marks it on the tile AND in the cauldron",
  (await evalJs(`getComputedStyle(document.querySelector('[data-id=red]'), '::after').content`)) === '"\u{1F512}"' &&
  (await evalJs(`getComputedStyle(document.getElementById('ca'), '::before').content`)) === '"\u{1F512}"');
await click("green");
await sleep(100);
s = await state();
check("mouse: combining resolves in the cauldron, nothing to dismiss", s.phase === "play");
check("mouse: Yellow discovered, 1 move", s.found.includes("yellow") && s.moves === 1);
// The 101 QUOTES are the DIRECTOR'S CUT only. They live in src/quotes.ts with
// the three containers they sit in and the two rules that style them, all four
// behind __DIRECTOR__, and closure deletes the lot from a shipping build.
// Same discipline as the development tools below: one probe decides which build
// this is, and then every place a quote can appear has to agree with it — so a
// half-applied gate, quoted in the codex but not on the card, cannot pass.
// The probe is the card's own <i>, which only a quote ever puts there, and it
// is read here because this is the one moment the card is up.
const QUOTED = await evalJs(`!!document.querySelector('#ds .c i')`);
check("cauldron: the well shows the result" +
  (QUOTED ? " and the quote sits under it" : ", with no quote under it to give away"),
  await evalJs(`document.getElementById('cr').textContent.includes('Yellow')`) &&
  QUOTED === await evalJs(`document.getElementById('cq').textContent.includes('choose you')`));
check(`discovery: the card ${QUOTED ? "carries the element's quote" : "names the element and nothing else"}`,
  QUOTED === await evalJs(`document.getElementById('ds').textContent.includes('choose you')`));
check("discovery: a first-EVER element takes the whole screen",
  await evalJs(`document.getElementById('ds').classList.contains('y')`) &&
  (await evalJs(`document.querySelectorAll('#ds .k').length`)) === 14 &&
  await evalJs(`document.getElementById('ds').textContent.includes('Yellow')`));
check("discovery: the rays step round the spectrum",
  (await evalJs(`document.querySelector('#ds .k').style.getPropertyValue('--c')`)) === "hsl(0 95% 62%)" &&
  (await evalJs(`[...document.querySelectorAll('#ds .k')][7].style.getPropertyValue('--c')`)) === "hsl(180 95% 62%)");
check("lock: Red is still held after the combine", s.sel === 0 &&
  await evalJs(`document.getElementById('ca').textContent.includes('Red')`));
check("cauldron: the pair sits in the altar and nothing else is marked",
  await evalJs(`document.getElementById('cb').textContent.includes('Green')`) &&
  !(await evalJs(`!!document.querySelector('.t.E')`)));
await shot("cauldron");
// the second slot and the result clear themselves; the lock does not
await sleep(2400);
check("cauldron: B and the result empty themselves, the lock stays",
  (await evalJs(`document.getElementById('cb').textContent`)) === "" &&
  (await evalJs(`document.getElementById('cr').textContent`)) === "" &&
  await evalJs(`document.getElementById('ca').textContent.includes('Red')`));
await click("red");
s = await state();
check("lock: tapping a locked element again lets it go",
  s.sel === -1 && s.pick === -1 &&
  !(await evalJs(`document.getElementById('ca').classList.contains('y')`)));

// --- keyboard: cursor to Blue + Yellow -> White -------------------------
await key("ArrowRight");            // cursor is on red(0) after the release
await key("ArrowRight");            // -> blue(2)
await key("Enter");                 // pick blue
s = await state();
check("keyboard: arrows+Enter pick an element", s.pick === 2 && s.cursor === 2);
await key("ArrowRight");
await key("Enter");                 // blue + yellow
await sleep(100);
s = await state();
check("keyboard: Blue+Yellow forges White", s.found.includes("white") && s.moves === 2);
await release();

// --- failed and duplicate combos both count as moves ----------------------
// the failed pair is made with a LOOSE pick, the rediscovery after it with a
// LOCKED one — the two halves of the rule, on the two mixes already here.
// Green + White is the dead pair BECAUSE IT IS DEAD: Green + Yellow used to be
// it and the Chartreuse took it, so if this check starts failing, look first
// for a new element that ate the pair rather than for a bug in the rule.
await click("green");
await click("white");
s = await state();
check("fail: no recipe still costs a move", s.moves === 3 && s.found.length === 5 && s.phase === "play");
check("fail: the cauldron says nothing happens",
  await evalJs(`document.getElementById('cq').textContent.includes('nothing happens')`));
check("fail: the cauldron shakes and the tiles do not",
  await evalJs(`document.getElementById('cd').classList.contains('x')`) &&
  !(await evalJs(`!!document.querySelector('.t.x')`)));
// ...and the board is clean above because NOTHING IS PICKED — a loose pick is
// spent by its mix. The spent-pair mark is a property of the pick, not of the
// tile, so it only appears once there is a pair to be spent.
await click("green");
check("tried: picking one half of a failed pair marks the other",
  await evalJs(`document.querySelector('[data-id=white]').classList.contains('x')`) &&
  // ...and an element is never tried against itself, so the pick never marks
  !(await evalJs(`document.querySelector('[data-id=green]').classList.contains('x')`)));
// A SUCCESS MARKS TOO, which is the whole point of tracking tried pairs rather
// than dead ones: red + green already made Yellow, Yellow is on the board, so
// there is nothing left to find down that pair either.
check("tried: a pair already performed is marked as well",
  await evalJs(`document.querySelector('[data-id=red]').classList.contains('x')`));
await release();
check("tried: letting the pick go clears every mark",
  !(await evalJs(`!!document.querySelector('.t.x')`)));
// Stored with the RUN, not the codex, and as a dictionary rather than a list:
// "tried" is a fact about this run, so New game starts the search over, and a
// success only counts as spent while its result is still on the board.
const triedSave = ((await cellGet(SLOT.run)) || {}).t || {};
check("tried: the memory rides with the run, failures and successes alike",
  !!triedSave["green+white"] && !!triedSave["green+red"] &&
  // ...and the codex no longer carries the old all-time dead-end list
  !((await cellGet(SLOT.codex)) || {}).d);
check("pick: a loose pick is spent by its mix — nothing stays picked",
  s.sel === -1 && s.pick === -1 &&
  !(await evalJs(`!!document.querySelector('.t.E')`)) &&
  !(await evalJs(`!!document.querySelector('.t.e')`)));
// lock green this time, so the rediscovery is one more tap and the lock stays
await click("green");
await click("green");
await click("red");
s = await state();
check("dupe: rediscovery costs a move, adds nothing", s.moves === 4 && s.found.length === 5);
check("dupe: a rediscovery gets no full-screen animation",
  !(await evalJs(`document.getElementById('ds').classList.contains('y')`)));
check("dupe: the cauldron names the known result",
  await evalJs(`document.getElementById('cq').textContent.includes('already discovered')`));
check("dupe: only the known result pulses",
  (await evalJs(`[...document.querySelectorAll('.t.h')].map(t => t.dataset.id).join()`)) === "yellow");
// the lock survived both mixes, and neither mixed-in element is left marked
check("lock: a locked element survives every mix, and marks nothing else",
  s.sel === 1 && s.moves === 4 &&
  await evalJs(`document.getElementById('ca').textContent.includes('Green')`) &&
  !(await evalJs(`!!document.querySelector('.t.E')`)));

// --- encyclopedia: performed combinations only ----------------------------
// green is still locked, so the first Escape releases it rather than reaching
// the menu — cancel first, leave second, exactly as Ⓑ behaves
await key("Escape");
s = await state();
check("lock: Escape releases the locked element before it opens the menu",
  s.phase === "play" && s.sel === -1 && s.pick === -1);
await key("Escape");
s = await state();
check("keyboard: Escape opens the menu", s.phase === "menu");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'Encyclopedia').click()`);
check("encyclopedia: lists discovered combinations",
  await evalJs(`document.getElementById('ml').textContent.includes('Red + Green')`) &&
  await evalJs(`document.getElementById('ml').textContent.includes('White')`));
check("encyclopedia: undiscovered elements stay hidden",
  !(await evalJs(`document.getElementById('ml').textContent.includes('Unicorn')`)));
check("encyclopedia: unperformed alternate recipes stay unspoiled",
  !(await evalJs(`document.getElementById('ml').textContent.includes('Red + Cyan')`)));
check(`encyclopedia: a row ${QUOTED ? "carries the element's quote" : "is name and recipes, with no quote"}`,
  QUOTED === await evalJs(`!!document.querySelector('#ml .Q')`) &&
  QUOTED === await evalJs(`document.getElementById('ml').textContent.includes('choose you')`));
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
// A first discovery puts the full-screen layer up for 3.25s, and it is what
// elementFromPoint hits — so every drop while it is there reads as "on
// nothing". A real pointer dismisses it with the same press that would have
// started the drag; these events are dispatched straight at the tile and skip
// that hit test, so the layer has to be closed by hand or the drag tests below
// all pass for the wrong reason.
const skipDiscovery = () => evalJs(`document.getElementById('ds')
  .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
await drag("red", "blue");
await sleep(100);
s = await state();
check("drag: red onto blue forges Magenta",
  s.found.includes("magenta") && s.moves === 5 && s.phase === "play");
await skipDiscovery();
await release();
await drag("red", null);
s = await state();
check("drag: dropping on nothing costs no move", s.moves === 5 && s.sel === -1);
// A drag that lands on empty space is an ABORTED GESTURE: no move, and the pick
// is exactly what it was before. The lock especially — it is the one state the
// player set deliberately, and a drag that missed used to destroy it.
await drag("red", "red");            // pick
await drag("red", "red");            // lock
s = await state();
check("void-drop: locked before the drag", s.sel === 0 && s.pick === -1);
await drag("red", null);             // the locked tile, dropped on nothing
s = await state();
check("void-drop: dragging the locked element to empty space keeps the lock",
  s.sel === 0 && s.pick === -1 && s.moves === 5 &&
  (await evalJs(`document.getElementById("ca").classList.contains("y")`)));
await drag("green", null);           // an UNRELATED tile, dropped on nothing
s = await state();
check("void-drop: a lock survives an unrelated drag that lands nowhere",
  s.sel === 0 && s.pick === -1 && s.moves === 5);
await evalJs(`document.getElementById("ca").click()`);   // let the lock go
await drag("blue", "blue");          // a LOOSE pick
await drag("blue", null);
s = await state();
check("void-drop: a loose pick survives it too — nothing happened",
  s.pick === 2 && s.sel === -1 && s.moves === 5);
// clear it with self-drops, not release(): the drag above armed clickGuard and
// release() works by clicking. Loose -> locked -> let go.
await drag("blue", "blue");
await drag("blue", "blue");
s = await state();
check("void-drop: the board is clear again", s.sel === -1 && s.pick === -1);
// Dropping a tile back where it started is not a drag, it is a tap that
// changed its mind — so it runs the same three states a tap does, and the
// pick the lift suspended has to survive to make that possible.
await release();
await drag("red", "red");            // nothing picked -> picks it
s = await state();
// .E is a loose pick (cyan), .e a locked one (gold) — state() calls them pick and sel
check("self-drop: with nothing picked, it picks the element, loose",
  s.pick === 0 && s.sel === -1 && s.moves === 5);
await drag("red", "red");            // already picked -> locks it
s = await state();
check("self-drop: on the element already picked, it locks it",
  s.sel === 0 && s.pick === -1 && s.moves === 5);
await drag("red", "red");            // locked -> lets go
s = await state();
check("self-drop: on the locked element, it lets go",
  s.sel === -1 && s.pick === -1 && s.moves === 5);
// and with a DIFFERENT element picked, the self-drop is the second half of a mix.
// Blue is picked with a self-drop rather than a click, because the drag above
// just armed clickGuard and a click inside 350ms of a drag is deliberately
// swallowed — the guard exists so the click a real drag ends with is not read
// as a select.
await drag("blue", "blue");          // pick blue, loose
await drag("red", "red");            // blue + red -> Magenta, already discovered
s = await state();
check("self-drop: with another element picked, it mixes with it",
  s.moves === 6 && s.sel === -1 && s.pick === -1);
// A lock survives every mix. Tapping already honoured that; dragging has to
// too, from either end of the gesture — and the locked element keeps the
// altar's A slot, so dragging ONTO it must not put it in both slots.
const altar = () => evalJs(`JSON.stringify([
  document.getElementById('ca').textContent,
  document.getElementById('cb').textContent,
  document.getElementById('ca').classList.contains('y')])`).then(JSON.parse);
await drag("red", "red");            // pick red
await drag("red", "red");            // lock red
s = await state();
check("drag-lock: the self-drop locked it", s.sel === 0 && s.pick === -1);
await drag("red", "green");          // drag the LOCKED one onto another
await sleep(120);
s = await state();
let cd = await altar();
check("drag-lock: dragging the locked element onto another keeps it locked",
  s.sel === 0 && s.moves === 7 && cd[2] === true &&
  cd[0].includes("Red") && cd[1].includes("Green"));
await skipDiscovery();
await drag("blue", "red");           // drag another ONTO the locked one
await sleep(120);
s = await state();
cd = await altar();
check("drag-lock: dragging onto the locked element keeps it locked, and it stays slot A",
  s.sel === 0 && s.moves === 8 && cd[2] === true &&
  cd[0].includes("Red") && cd[1].includes("Blue"));
await skipDiscovery();
await evalJs(`document.getElementById('ca').click()`);   // the X lets it go
s = await state();
check("drag-lock: the altar X still lets go of a lock a drag restored",
  s.sel === -1 && s.pick === -1);

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
check("gamepad: A picks at the cursor", s.pick === s.cursor);
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
  cellGet(SLOT.mute);
const toastText = () => evalJs(`document.getElementById('to').textContent`);
let mv = (await state()).moves;
await key("m");
s = await state();
check("mute: M reports Sound off and costs no move",
  (await toastText()) === "Sound off" && s.moves === mv && s.phase === "play");
check("mute: the choice is stored, so a reload keeps it", (await muteKey()) === 1);
await evalJs("__pad.buttons[2].pressed = true");    // Ⓧ, the one face button left
await sleep(120);
await evalJs("__pad.buttons[2].pressed = false");
await sleep(80);
check("mute: pad Ⓧ turns the sound back on",
  (await toastText()) === "Sound on" && (await muteKey()) === 0);
// The pad press above left it unmuted, so the button offers the action it would
// take next: Mute.
check("hud: the mute button names the ACTION and both shortcuts",
  (await evalJs(`document.getElementById('sn').textContent`)) === "MuteM / Ⓧ");
const sndLabel = () => evalJs(`document.getElementById('sn').firstChild.textContent`);
// click() above finds TILES by data-id; the HUD buttons go by element id
const clickBtn = (id) => evalJs(`document.getElementById('${id}').click()`);
await clickBtn("sn");
// The WORD swaps, the LOOK does not: no dim class, no second border, so it still
// sits with Hint and Menu. classList staying empty through both presses is what
// catches a reintroduced Muted styling.
check("hud: it mutes and then offers to Unmute",
  (await toastText()) === "Sound off" && (await sndLabel()) === "Unmute" &&
  (await muteKey()) === 1 &&
  !(await evalJs(`document.getElementById('sn').classList.length`)));
await clickBtn("sn");
check("hud: unmuting brings the music back and offers to Mute again",
  (await toastText()) === "Sound on" && (await sndLabel()) === "Mute" &&
  (await muteKey()) === 0 &&
  !(await evalJs(`document.getElementById('sn').classList.length`)));

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
// The two tiles the toast names are the two that GLOW. Not a pulse any more:
// .t.g is a steady state derived from the standing hint, so unlike the old .h
// animation it is still there on the next round trip, and these helpers do not
// have to race a .5s window to observe it.
const hintGlowsItsPair = () => evalJs(`(() => {
  const m = document.getElementById('to').textContent.match(/^Hint: try (.+) [+] (.+) —/);
  if (!m) return false;
  const id = n => ([...document.querySelectorAll('.t')]
    .find(t => t.querySelector('.n').textContent === n) || { dataset: {} }).dataset.id;
  const lit = [...document.querySelectorAll('.t.g')].map(t => t.dataset.id).sort();
  return JSON.stringify(lit) === JSON.stringify([id(m[1]), id(m[2])].sort());
})()`);

// PREREQUISITES, from the same table: id -> the pairs that make it. RECIPE is
// keyed the other way, so this is it inverted rather than a second source.
const PREQ = {};
for (const [k, id] of Object.entries(RECIPE)) (PREQ[id] = PREQ[id] || []).push(k.split("+"));
// Everything the quest still needs, given what is held — the game's questWants()
// derived here independently, off the source of truth rather than off the game.
// The want.has guard is what terminates it: Magic and the Crystal Ball make each
// other, so the walk is cyclic.
const questWants = (held) => {
  const want = new Set();
  const walk = (id) => {
    if (held.includes(id) || want.has(id)) return;
    want.add(id);
    for (const pr of PREQ[id] || []) { walk(pr[0]); walk(pr[1]); }
  };
  walk("rainbow");
  walk("unicorn");
  return want;
};

check("hud: the Hint button names both shortcuts",
  (await evalJs(`document.getElementById('ht').textContent`)) === "HintH / Ⓨ");
let m0 = (await state()).moves;
await key("h");
s = await state();
check("hint: H names a pair within reach and costs a move",
  s.moves === m0 + 1 && await hintNamesAUsefulPair());
check("hint: the pair it names is the pair that glows", await hintGlowsItsPair());
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
const repeatPulses = await hintGlowsItsPair();
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
// The glow OUTLIVES the toast. That is the whole point of it — the toast is
// gone in seconds and the answer has to stay readable until it is used, so
// this clears the toast and looks again rather than trusting the same frame.
await clearToast();
// The glow BREATHES, and that is a cascade trap worth a check of its own:
// every tile carries .z once its arrival pop has ended, and .t.z sets
// animation: none. The breathe rule has to sit after it or the hint would
// simply not move, with nothing else to show for it. These tiles have long
// since settled, so this asserts against a real .z, not a fresh tile.
check("hint: the glowing tiles breathe, and .z does not switch it off",
  await evalJs(`(() => {
    const lit = [...document.querySelectorAll('.t.g')];
    return lit.length === 2 && lit.every(t => t.classList.contains('z')
      && getComputedStyle(t).animationName !== 'none'
      && getComputedStyle(t).animationIterationCount === 'infinite');
  })()`));
check("hint: the glow outlives the toast that announced it",
  await evalJs(`[...document.querySelectorAll('.t.g')].map(t => t.dataset.id).sort().join()`)
    === [...standing].sort().join());
// make it, and the hint retires: the next one is a different pair, at full price
await attempt(standing[0], standing[1]);
await release();
// and the glow goes out with it, without anything having cleared it: the class
// is derived from standingHint(), which reads the found set
check("hint: making the pair puts the glow out",
  (await evalJs(`document.querySelectorAll('.t.g').length`)) === 0);
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


/* ------------------------------------------------------- solving the tree
   Four hand-written solve paths used to live below this line, each with its
   move count copied into the assertions (31, 97, 35, 11). Every edit to a
   recipe invalidated all four at once, silently — the runs would simply stop
   completing, and the failure told you nothing about which pair had moved.
   For a table that is edited as often as this one, that is a bad trade, so
   the paths are DERIVED now, from the same RECIPE map every other check
   reads. The assertions kept below are the ones that are actually about
   behaviour: that a leaner run lowers the stored best and a sloppier one does
   not. The absolute move counts are whatever the current tree happens to
   cost, and are reported rather than asserted. */
const STARTERS = ["red", "green", "blue"];
const MAKES = {};   // id -> every pair that makes it
for (const [k, id] of Object.entries(RECIPE)) (MAKES[id] ||= []).push(k.split("+"));

// The smallest set of elements that has to be made to reach `id`, itself
// included. Recipes may be cyclic (Fire + Ice remakes the Water Ice needs), so
// a route that re-enters an element still being solved is simply unusable.
const solving = new Set(), CLOSURE = {};
function closure(id) {
  if (STARTERS.includes(id)) return new Set();
  if (CLOSURE[id]) return CLOSURE[id];
  if (solving.has(id)) return null;
  solving.add(id);
  let best = null;
  for (const [a, b] of MAKES[id] || []) {
    const ca = closure(a), cb = closure(b);
    if (!ca || !cb) continue;
    const set = new Set([id, ...ca, ...cb]);
    if (!best || set.size < best.size) best = set;
  }
  solving.delete(id);
  return (CLOSURE[id] = best);
}
const union = (...ids) => new Set(ids.flatMap((id) => [...closure(id)]));

// Turn a set of elements into a legal move order: repeatedly play whatever is
// makeable from what is already on the board. `last` is held back to the end,
// which is how a quest run is made to finish ON the move that completes it —
// anything played after that lands while the overlay is up.
function order(set, last = [], already = []) {
  const left = new Set([...set].filter((id) => !last.includes(id)));
  const have = new Set([...STARTERS, ...already]), out = [];
  while (left.size) {
    const before = left.size;
    for (const id of [...left]) {
      const pair = (MAKES[id] || []).find(([a, b]) => have.has(a) && have.has(b));
      if (pair) { out.push(pair); have.add(id); left.delete(id); }
    }
    if (left.size === before) throw new Error("unorderable: " + [...left].join(","));
  }
  for (const id of last) {
    const pair = (MAKES[id] || []).find(([a, b]) => have.has(a) && have.has(b));
    if (!pair) throw new Error("cannot finish on " + id);
    out.push(pair); have.add(id);
  }
  return out;
}
const GOALS = ["rainbow", "unicorn"];
const everything = new Set(ENTRIES.map((c) => c.slice(0, c.indexOf('"'))).filter((id) => !STARTERS.includes(id)));
const rest = (used) => new Set([...everything].filter((id) => !used.has(id)));
/* The COVERAGE run: everything the quest needs, plus Night and Black, whose
   swatches are inspected between the two runs and so have to be on the board
   by then. That makes it a strict superset of the lean run below, which is
   the property the best-score checks depend on. */
const COVER_SET = union(...GOALS, "night", "black");
const QUEST = order(COVER_SET, GOALS);
// EXTRA plays on the board QUEST left behind, not on a fresh one
const EXTRA = order(rest(COVER_SET), [], COVER_SET);
/* The LEAN run: the goals and nothing else. */
const LEAN_SET = union(...GOALS);
const PERFECT_QUEST = order(LEAN_SET, GOALS);
const PERFECT_EXTRA = order(rest(LEAN_SET), [], LEAN_SET);
/* Sun + Rain reaches a Rainbow with no Prism anywhere near it. Built from the
   two ingredients rather than from closure("rainbow"): now that White cuts a
   Glass into a Prism, the CHEAPEST rainbow runs through the Prism, and a set
   derived from the closure would carry one onto the board. This one names the
   route it is about. */
const RAINBOW_ONLY = order(new Set(["rainbow", ...union("sun", "rain")]), ["rainbow"]);
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
// The Unicorn that finishes the quest is a first-EVER discovery, so attempt()
// opened the full-screen card before checkMilestones ran. The completion screen
// cancels it in the same turn, and nothing of it is ever painted — otherwise it
// would play for 3.25s in front of the screen that actually matters.
check("quest: the completion screen cancels the discovery card",
  !(await evalJs(`document.getElementById('ds').classList.contains('y')`)) &&
  (await evalJs(`document.getElementById('ds').innerHTML`)) === "");
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
  await evalJs(`document.getElementById('gl').textContent.includes('all ${COUNT}')`));
check("night: icon is a starry violet-to-black swatch, not an emoji",
  await evalJs(`!!document.querySelector('[data-id=night] .s')
    && document.querySelector('[data-id=night] .s').style.background.includes('gradient')`));
check("night: Black + Sky or Violet + Sky, and the two cost the same",
  RECIPE['black+sky'] === "night" &&
  RECIPE['sky+violet'] === "night");
check("black: the one color no mixing of lights reaches, so it comes from the materials",
  RECIPE['charcoal+stone'] === "black" &&
  await evalJs(`!!document.querySelector('[data-id=black] .s')`));

// --- highscore screen: quest best visible, full best still hidden ---------
await key("Escape");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'Highscores').click()`);
// The head is the button's own label uppercased, not a second string in caps,
// so the casing is now behaviour rather than a literal and is checked as such.
check("highscore: the panel head is the menu label in caps",
  (await evalJs(`document.getElementById('mh').textContent`)) === "HIGHSCORES");
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
    .includes("Highscores") &&
  !(await evalJs(`!!document.getElementById('ml')`)));
// Back closed the panel, so ONE Escape leaves the menu — a second would reopen it
await key("Escape");
s = await state();
check("highscore: back to the game", s.phase === "play");

await run(EXTRA);
await sleep(100);
s = await state();
check(`full: completion overlay after all ${COUNT}`, s.fullDone && s.phase === "overlay");
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
check("full: the completion screen cancels the discovery card here too",
  !(await evalJs(`document.getElementById('ds').classList.contains('y')`)) &&
  (await evalJs(`document.getElementById('ds').innerHTML`)) === "");
// The fireworks: sized means fireworks() ran, and it is the only thing that
// sizes this canvas. The width going back to 0 on close is the CLEAR — a canvas
// left at full size is one still holding its last frame behind the next screen.
check("full: the fireworks canvas is live behind the card",
  (await evalJs(`document.getElementById('fw').width`)) > 0);
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

await run(PERFECT_QUEST);
await sleep(100);
s = await state();
check(`perfect: quest done in ${PERFECT_QUEST.length} moves, against the coverage run's ${QUEST.length}`,
  s.questDone && s.moves === PERFECT_QUEST.length && PERFECT_QUEST.length < QUEST.length);
check("perfect: the leaner run lowers the stored quest best",
  (await best("bestQuest")) === PERFECT_QUEST.length);
check("perfect: overlay celebrates the new best",
  await evalJs(`document.getElementById('oc').textContent.includes('NEW BEST')`));
await evalJs(`[...document.querySelectorAll('#ob button')].find(b => b.textContent === 'Keep playing').click()`);
await run(PERFECT_EXTRA);
s = await state();
check(`perfect: full clear in ${PERFECT_QUEST.length + PERFECT_EXTRA.length} moves, all ${COUNT} found`,
  s.fullDone && s.moves === PERFECT_QUEST.length + PERFECT_EXTRA.length &&
  s.found.length === COUNT);
check("perfect: the hidden full-clear best comes down with it",
  (await best("bestFull")) === PERFECT_QUEST.length + PERFECT_EXTRA.length);

// --- a sloppier run must NOT overwrite them -------------------------------
await reset();
// a wasted dupe, plus a Magenta the route no longer needs = 35 moves
await run([["red","green"], ["red","green"], ["blue","yellow"], ["red","blue"], ...QUEST]);
await sleep(100);
s = await state();
check(`sloppy: the same quest, four moves worse (${QUEST.length + 4})`,
  s.questDone && s.moves === QUEST.length + 4);
check("sloppy: a worse run does NOT overwrite the best",
  (await best("bestQuest")) === PERFECT_QUEST.length);

// --- persistence: reload restores the run ---------------------------------
await evalJs(`[...document.querySelectorAll('#ob button')].find(b => b.textContent === 'Keep playing').click()`);
// mute first, so the reload below also proves the button paints its word from
// the stored preference rather than from whatever the HTML shipped with
await evalJs(`document.getElementById("sn").click()`);
await send("Page.navigate", { url: "file:///" + page.replace(/\\/g, "/") });
await sleep(900);
s = await state();
check("reload: run restored, back on the title",
  s.moves === QUEST.length + 4 && s.questDone && s.found.includes("rainbow") && s.phase === "menu");
check("reload: the mute button paints its word from the stored preference",
  (await evalJs(`document.getElementById('sn').firstChild.textContent`)) === "Unmute" &&
  (await cellGet(SLOT.mute)) === 1);
await evalJs(`document.getElementById("sn").click()`);   // unmute for what follows

// --- alternate recipe: Sun + Rain is also a Rainbow -----------------------
await reset();
await run(RAINBOW_ONLY);
s = await state();
check(`alt: Sun+Rain forges the Rainbow in ${RAINBOW_ONLY.length}, no Prism involved`,
  s.found.includes("rainbow") && !s.found.includes("prism") &&
  s.moves === RAINBOW_ONLY.length);
check("alt: the intuitive pairs resolve too",
  JSON.stringify(['air+water', 'air+stone', 'fire+ice', 'air+penguin',
    'dog+wolf', 'charcoal+fire', 'air+fire', 'grey+sky'].map((k) => RECIPE[k])) ===
  '["cloud","sand","water","bird","dog","ash","fire","cloud"]');
check("alt: a Volcano has the same Diamond in it as the Lava it pours",
  RECIPE['charcoal+lava'] === "diamond" &&
  RECIPE['charcoal+volcano'] === "diamond");
// Glass takes an edge from a Diamond, from a Tool, or from plain White light.
// The Tool used to be the shortcut here — 14 against the Diamond's 18 — but
// White is now the cheap way in at 10, which is the colour rule the rest of
// the table follows too. All three still resolve.
check("alt: a Diamond, a Tool or White light cuts Glass into a Prism",
  RECIPE['diamond+glass'] === "prism" &&
  RECIPE['glass+tool'] === "prism" &&
  RECIPE['glass+white'] === "prism");
// Sand fuses three ways, and the two new ones are fulgurite: a strike, or the
// current behind it, does what the fire does. Both land far later than Sand +
// Fire (10 and 11 deep against 6), so they are flavour, never a shortcut.
check("alt: Sand becomes Glass under a Fire, a current, or a strike",
  RECIPE['fire+sand'] === "glass" &&
  RECIPE['electricity+sand'] === "glass" &&
  RECIPE['lightning+sand'] === "glass");
// Lava cools into Stone three ways, all of them at the same depth — an exact
// tie, like Night's two routes, rather than a shortcut. And Lava + Stone is the
// sixth cyclic pair: the Stone melts straight back into the Lava that made it.
check("alt: Lava sets into Stone against Water, Rain or Air",
  RECIPE['lava+water'] === "stone" &&
  RECIPE['lava+rain'] === "stone" &&
  RECIPE['air+lava'] === "stone");
check("alt: Lava + Stone melts back into Lava, a cyclic pair that costs a move",
  RECIPE['lava+stone'] === "lava");
// The Tool is the other half of four recipes and, since the colours arrived,
// the cheap way to only one of them: the Wood is 12 through Brown against the
// Tool's 17, the Black 14 through Earth against 18, the Prism 10 through White
// against 14. It carves the Statue too, but Clay + Life gave the Human a
// shallow route and a Human now carves the same Stone for less, so the Tool
// is flavour there as well. The Artist is the third and dearest route.
// It no longer grinds Stone into Sand: that pair carves now, and the Sand
// keeps Earth + Air, Stone + Air and the Yellow shortcut without it.
check("alt: a Tool cuts Wood, carves Stone into a Statue, and works Charcoal into Black",
  RECIPE['tool+tree'] === "wood" &&
  RECIPE['stone+tool'] === "statue" &&
  RECIPE['human+stone'] === "statue" &&
  RECIPE['charcoal+tool'] === "black" &&
  RECIPE['charcoal+stone'] === "black");
check("alt: the Sand keeps three routes after the Tool stopped grinding it",
  RECIPE['air+earth'] === "sand" &&
  RECIPE['air+stone'] === "sand" &&
  RECIPE['earth+yellow'] === "sand");
// The COLOUR SHORTCUTS. A plain colour is within three moves of the starters,
// so laying one on a thing is the cheapest route the table has, and these are
// the ones that MOVE a depth rather than tie it: Sand 6 against 8, Field 6
// against 12, Lightning 7 against 14, Polar Bear 13 against 21, Fox 12
// against 21. Grey + Matter is the deliberate exception, a Stone at 16 where
// Lava + Water is 9 — flavour for a pair players try, not a way in.
// Depths here are TRUE minima, relaxed to a fixpoint — not what closure()
// below reports, which is order-sensitive around the cyclic pairs.
check("alt: a plain colour is the short way in, on Earth, Cloud, Animal and Glass",
  RECIPE['earth+yellow'] === "sand" &&
  RECIPE['earth+green'] === "field" &&
  RECIPE['cloud+yellow'] === "lightning" &&
  RECIPE['cloud+orange'] === "lightning" &&
  RECIPE['animal+white'] === "polar bear" &&
  RECIPE['animal+green'] === "lizard" &&
  RECIPE['animal+yellow'] === "bee" &&
  RECIPE['animal+orange'] === "fox" &&
  RECIPE['grey+matter'] === "stone");
// Sun + Water was one of the Cloud's five; it is Life's second route now, and
// the Cloud keeps the other four, every one of them still water meeting
// warmth or height.
check("alt: Sun on Water is Life, and the Cloud still has four ways without it",
  RECIPE['sun+water'] === "life" &&
  RECIPE['lightning+water'] === "life" &&
  RECIPE['fire+water'] === "cloud" &&
  RECIPE['sky+water'] === "cloud");
// Wood burns as a Charcoal against Fire, but a warm COLOUR lights it instead —
// the same two colours that light Matter and Air.
check("alt: Red or Orange sets standing Wood alight",
  RECIPE['red+wood'] === "fire" &&
  RECIPE['orange+wood'] === "fire" &&
  RECIPE['fire+wood'] === "charcoal");
// THE TWINS. Wherever a colour recipe means the same thing on both sides of a
// pair, the table now carries both: Red and Orange both melt a Stone the way
// they both light Matter, Air and Wood; Grey and White both hang a Cloud on
// the Sky. Neither twin is a shortcut — Orange + Stone is 9 against Earth +
// Fire's 7, White + Sky ties Water + Air at 7 — they are there so the pair a
// player reaches for resolves.
check("alt: the warm pair both melt Stone, the pale pair both cloud the Sky",
  RECIPE['red+stone'] === "lava" &&
  RECIPE['orange+stone'] === "lava" &&
  RECIPE['grey+sky'] === "cloud" &&
  RECIPE['sky+white'] === "cloud");
// Sun melts Ice back into Water exactly as Fire does — the seventh cyclic
// pair, and the second one on Water.
check("alt: Sun on Ice is the same melt as Fire on Ice",
  RECIPE['ice+sun'] === "water" &&
  RECIPE['fire+ice'] === "water");
// Fish was Animal + Water alone; Blue is the water without the water.
check("alt: a Blue Animal is a Fish, the same as an Animal in Water",
  RECIPE['animal+blue'] === "fish" &&
  RECIPE['animal+water'] === "fish");
// THE MUTUAL CYCLE. Violet is the table's magic colour, and Violet + Glass is
// the first material it touches — it also takes the Crystal Ball from 24 down
// to 11 and, crucially, gives it a route that does NOT pass through Magic.
// That is what makes Rainbow + Crystal Ball safe as a third way to Magic:
// two elements each on a path back to the other, resolving only because both
// ends keep an independent way in. Unlike the self-loops (Fire + Air, Lava +
// Stone) neither half of this one is a no-op, and the Crystal Ball stops
// being the one deep element that nothing used.
check("alt: Magic and the Crystal Ball make each other, and both stay reachable",
  RECIPE['glass+violet'] === "crystal ball" &&
  RECIPE['glass+magic'] === "crystal ball" &&
  RECIPE['crystal ball+rainbow'] === "magic" &&
  RECIPE['star+wood'] === "magic" &&
  RECIPE['night+pumpkin'] === "magic");
check("alt: Prism + Sun is also a Rainbow",
  RECIPE['prism+sun'] === "rainbow");
check("alt: a Light Bulb through a Prism is a Rainbow too",
  RECIPE['light bulb+prism'] === "rainbow");
check("alt: Glass + Electricity lights a Light Bulb, the only route to one",
  RECIPE['electricity+glass'] === "light bulb");
check("alt: Rain + Electricity is a Storm too, skipping the Lightning",
  RECIPE['electricity+rain'] === "storm" &&
  RECIPE['lightning+rain'] === "storm");
check("alt: the Sky is blue Air, and the Sun is lit from it or painted on it",
  RECIPE['air+blue'] === "sky" &&
  RECIPE['fire+sky'] === "sun" &&
  RECIPE['sky+yellow'] === "sun" &&
  RECIPE['air+sun'] === undefined);
check("alt: Fire needs Air to catch, and Orange no longer lights it",
  RECIPE['air+red'] === "fire" &&
  RECIPE['orange+red'] === undefined);
check("alt: the tool chain - Fire + Metal is a Tool, and a Tool is what cuts Wood",
  RECIPE['fire+metal'] === "tool" &&
  RECIPE['tool+tree'] === "wood" &&
  RECIPE['metal+wood'] === undefined);
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

// --- Unlock all / Reset everything (development builds only) --------------
// both are destructive, so both take two presses; the second must land within
// 2.5s of the first
const menuBtn = async (label) =>
  evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent.startsWith('${label}')).click()`);
if (!DEVBUILD) {
  console.log("skip 10 development-tool checks — this is the shipping build");
} else {
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
  s.found.length === COUNT && s.phase === "play" && s.moves === 0);
check("unlock: an unlocked run stops scoring, and says so",
  await evalJs(`document.getElementById('gl').textContent.includes('does not score')`) &&
  s.phase === "play" && !s.fullDone);
check("unlock: no best was written from it",
  (await best("bestFull")) === PERFECT_QUEST.length + PERFECT_EXTRA.length &&
  (await best("bestQuest")) === PERFECT_QUEST.length);
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
  MENU_FRESH);
check("wipe: it puts everything back without starting a game",
  s.phase === "menu" &&
  !(await evalJs(`document.getElementById('gl').textContent.includes('does not score')`)));
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'Encyclopedia').click()`);
check("wipe: the all-time codex is gone too, not just the run",
  !(await evalJs(`document.getElementById('ml').textContent.includes('Unicorn')`)));
}

// --- animation restarts ---------------------------------------------------
// A repeat of the SAME reaction has to replay its animation. Restarting a CSS
// animation is remove-class, flush, add-class; without the flush the browser
// coalesces the pair into no change within one turn and nothing starts. That
// flush was a bare `void cd.offsetWidth`, and closure ADVANCED deleted it as a
// pure read whose value goes nowhere — so two dead ends in a row shook once.
// Counts animationstart events rather than the class, which is present either
// way; only the event says the animation actually ran. Own board, own reset:
// this spends moves and nothing after it should care.
await reset();
await evalJs(`window.__anim = [];
  document.getElementById('cd').addEventListener('animationstart', e => window.__anim.push(e.animationName));`);
await click("red");
await click("green");             // -> Yellow, a discovery
await sleep(400);
await release();
await click("green");
await click("yellow");            // dead end
await sleep(500);
const shake1 = await evalJs(`window.__anim.length`);
await release();
await click("green");
await click("yellow");            // the SAME dead end again
await sleep(500);
const shake2 = await evalJs(`window.__anim.length`);
check("animation: a second dead end in a row shakes again", shake2 === shake1 + 1);

// --- the Encyclopedia lists EVERY route performed -------------------------
// The codex records a recipe when it is USED, so what a row can list depends on
// which pairs the runs took. The solve paths are derived from a minimum closure
// now, so every run picks the SAME cheapest route per element and no element is
// ever reached two ways — which quietly left this feature uncovered once the
// hand-written paths went. So build the case on purpose: White has three routes
// and all three are two moves deep, which makes it the cheapest place to prove
// a row lists more than one.
await reset();
await attempt("red", "green");     // Yellow
await release();
await attempt("green", "blue");    // Cyan
await release();
await attempt("red", "blue");      // Magenta
await release();
await attempt("blue", "yellow");   // White, route 1
await release();
await attempt("red", "cyan");      // White again, route 2
await release();
await attempt("green", "magenta"); // White again, route 3
await release();
await key("Escape");
await evalJs(`[...document.querySelectorAll('#mu button')].find(b => b.textContent === 'Encyclopedia').click()`);
const whiteRoutes = await evalJs(`(() => {
  const rows = [...document.getElementById('ml').children];
  const r = rows.find(x => x.textContent.startsWith("White"));
  return r ? r.querySelector('.X').textContent : '';
})()`);
check(`encyclopedia: a row lists every route performed — White: ${whiteRoutes}`,
  whiteRoutes.split("·").length === 3 &&
  whiteRoutes.includes("Blue + Yellow") && whiteRoutes.includes("Red + Cyan") &&
  whiteRoutes.includes("Green + Magenta"));

// --- the hint answers the quest while there is one ------------------------
// Last, because it spends moves freely and every move-count assertion is behind
// it. A fresh run taken 22 moves in: deep enough that the off-path branches (the
// animals, the drinks, the ornaments) are reachable, which is the whole point —
// at a six-element board EVERY reachable element is on the quest path and this
// check would pass with the priority switched off.
//
// Five hints, each bought and then MADE so the next one is a fresh answer rather
// than the standing one. With the priority on, every one is an ancestor of the
// Rainbow or the Unicorn. With it off, each has roughly a one-in-three chance of
// wandering — the failure this catches is a regression, and it catches it most
// runs rather than every run. The counts go in the label so a reader can see how
// strong the sample actually was.
//
// Only hints taken with a quest-path pair ACTUALLY AVAILABLE are graded. The
// narrowing in game.ts is deliberately a filter and not a veto — "if nothing
// within reach is on the quest path the full list stands" — so a hint offered
// when the path is momentarily exhausted is behaving correctly by wandering, and
// grading it would fail the check for doing the documented thing. That state got
// common enough to fail real builds as the tree grew past 120 elements. Grading
// only the decidable turns keeps this a test of the PRIORITY rather than of how
// the quest target happened to land.
await reset();
await run(PERFECT_QUEST.slice(0, 22));
let onPath = 0, offered = 0, offPath = 0, wandered = "", graded = 0, fellBack = 0;
for (let i = 0; i < 5; i++) {
  s = await state();
  const want = questWants(s.found);
  // what the game could have said, and how much of it was a detour
  let any = 0, offHere = 0;
  for (const [k, id] of Object.entries(RECIPE)) {
    const [a, b] = k.split("+");
    if (s.found.includes(a) && s.found.includes(b) && !s.found.includes(id)) {
      any++;
      if (!want.has(id)) offHere++;
    }
  }
  offered += any;
  offPath += offHere;
  const onAvail = any - offHere;   // quest-path pairs the hint could have picked
  await clearToast();
  await key("h");
  const pr = await hintedPair();
  if (!pr) break;
  const made = RECIPE[[pr[0], pr[1]].sort().join("+")];
  if (!onAvail) fellBack++;
  else if (want.has(made)) { graded++; onPath++; }
  else { graded++; wandered += " " + made; }
  await attempt(pr[0], pr[1]);      // spend it, so the next H is a new answer
  await release();
}
check(`hint: ${graded} graded of 5, ${offPath} of ${offered} offers off the quest path, ` +
  `${onPath} stayed on` + (fellBack ? `, ${fellBack} with no path pair left` : "") + wandered,
  offPath > 0 && graded > 0 && onPath === graded);

check("no uncaught exceptions", t.exceptions.length === 0);
if (t.exceptions.length) console.log(t.exceptions.join("\n"));
t.close();
