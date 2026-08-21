// Core game: state, the element grid, combining, discovery cards, the two
// goal overlays, and persistence.
//
// Scoring: every combination ATTEMPT counts as a move — successes, failures
// and rediscoveries alike — and so does a HINT, which buys a productive pair
// for the same price — though repeating a hint you have not acted on yet is
// free (a perfect quest is 34 moves; a perfect full clear is 66). Two
// persistent bests:
//   colorAlchemy.bestQuest : fewest moves to hold both Rainbow and Unicorn.
//     Shown in the HUD once it exists.
//   colorAlchemy.bestFull  : fewest total moves to find ALL elements. The
//     HIDDEN highscore — only ever compared and shown on the completion
//     screen, which only a full clear reaches (closeOverlay wipes the card so
//     it cannot linger in the DOM either).
// The current run also persists (colorAlchemy.run), so closing the tab loses
// nothing; Restart (double-press to confirm) wipes the run, never the bests.
import { ELEMENTS, STARTERS, BY_ID, RECIPE, N, type ElementDef } from "./elements";
import { SFX, muted } from "./sfx";
import { toggleMute } from "./music";

/* ------------------------------------------------------------- persistence */
// Bests are only meaningful against one recipe tree: a quest record set on an
// older, shorter tree would sit unbeatable forever after a balance change.
// Scope the best-score keys by a fingerprint of the tree, so any change to
// recipes or element count quietly starts a fresh board. The run itself stays
// unversioned — an in-flight run survives balance patches.
let vh = 5381;
for (const ch of JSON.stringify(Object.entries(RECIPE).sort()) + ELEMENTS.length) {
  vh = ((vh * 33) ^ ch.charCodeAt(0)) >>> 0;
}
const TREE = vh.toString(36);
const K_RUN = "colorAlchemy.run";
const K_QUEST = "colorAlchemy.bestQuest." + TREE;
const K_FULL = "colorAlchemy.bestFull." + TREE;
const store = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string | number): void { try { localStorage.setItem(k, String(v)); } catch {} },
  del(k: string): void { try { localStorage.removeItem(k); } catch {} },
};

/* ------------------------------------------------------------------- state */
let found = new Set<string>();      // discovered element ids (this run)
const order: string[] = [];         // discovery order (drives the grid)
// The codex is all-time knowledge, persisted separately from the run: every
// element ever discovered (in first-discovery order) and every recipe ever
// performed. New game wipes the board, never the codex — it is what the
// Encyclopedia shows, and what decides whether a discovery is a first EVER,
// which is what earns the merge animation. Not tree-scoped: knowledge
// survives balance patches, with stale entries filtered on load.
const codexF: string[] = [];
const codexK = new Set<string>();
let moves = 0;                      // every combination attempt, incl. failures
let questDone = false;              // Rainbow + Unicorn found this run
let fullDone = false;               // all elements found this run
// "Unlock all" hands you the whole board, so the run must never score again.
// Persisted with the run: a reload cannot launder a cheated run into a best.
let cheated = false;
let sel = -1;                       // index (into order) of the picked element, -1 when none
let held = false;                   // ...and whether that pick is LOCKED (gold) or loose (cyan)
let slotA: string | null = null;    // A when nothing is locked (a drag, or CA.attempt)
let slotB: string | null = null;    // the second element, until the attempt resolves
let slotR: string | null = null;    // the result, likewise
let clearTimer = 0;
let cursor = 0;                     // keyboard/gamepad focus index
let padMode = false;                // show the focus ring only once kb/pad is used

const tiles: HTMLElement[] = [];    // DOM nodes parallel to `order`

const rkey = (a: string, b: string): string => [a, b].sort().join("+");

function save(): void {
  store.set(K_RUN, JSON.stringify({ f: order, m: moves, q: questDone, c: fullDone, x: cheated }));
}
const K_CODEX = "colorAlchemy.codex";
function saveCodex(): void {
  store.set(K_CODEX, JSON.stringify({ f: codexF, k: [...codexK] }));
}

/* -------------------------------------------------------------------- HUD */
function hud(): void {
  mv.textContent = String(moves);
  ct.textContent = found.size + " / " + ELEMENTS.length;
  const q = store.get(K_QUEST);
  bq.textContent = q ? "Best quest: " + q : "";
  gl.innerHTML = cheated
    ? "Unlocked &mdash; this run does not score"
    : fullDone
    ? "Complete. \u{1F451}"
    : questDone
      ? "Endgame: discover all " + ELEMENTS.length + " elements"
      : "Forge the \u{1F308} <b>Rainbow</b> and the \u{1F984} <b>Unicorn</b>";
}

let toastTimer = 0;
// The one mute path: the key, the pad button and the HUD button all land here,
// so the label can never disagree with the state. Called at boot too, since the
// preference outlives the run.
function paintSound(): void {
  (sn.firstChild as Text).textContent = muted ? "Muted" : "Sound";
  sn.classList.toggle("Y", muted);
}

export function muteToggle(): void {
  toast(toggleMute() ? "Sound off" : "Sound on");
  paintSound();
}

export function toast(msg: string): void {
  to.textContent = msg;
  to.classList.add("w");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => to.classList.remove("w"), 1900);
}

/* -------------------------------------------------------------------- grid */
function iconHtml(el: ElementDef): string {
  // an SVG icon rides on .s too, so every size rule the swatches have applies
  if (el.s) {
    return '<svg class="s" viewBox="0 0 32 32" style="--g:' + (el.c || "#8a5cf0") + '55">' +
           el.s + "</svg>";
  }
  if (el.c || el.bg) {
    // bg (a full CSS background stack) overrides the flat color; the plain
    // color always supplies the glow, since "gradient…55" is not a color
    return '<div class="s" style="background:' + (el.bg || el.c) +
           ";--g:" + (el.c || "#8a5cf0") + '55"></div>';
  }
  return el.e || "";
}
function addTile(id: string): void {
  const el = BY_ID[id];
  const d = document.createElement("div");
  d.className = "t";
  d.dataset.id = id;
  d.innerHTML = '<div class="o">' + iconHtml(el) + '</div><div class="n">' + el.n + "</div>";
  const i = order.length;
  d.onclick = () => {
    if (performance.now() < clickGuard) return; // that click ended a drag
    padMode = false;
    renderFocus();
    selectAt(i);
  };
  // a reaction class clears itself; the arrival pop ends here too, and marks
  // the tile settled so no later class change replays it
  d["onanimationend"] = () => {
    d.classList.remove("x", "h");
    d.classList.add("z");
  };
  d["onpointerdown"] = e => startPress(e, i);
  d["onpointermove"] = onPressMove;
  d["onpointerup"] = onPressUp;
  d["onpointercancel"] = cancelPress;
  order.push(id);
  tiles.push(d);
  gd.appendChild(d);
}
// One-shot tile reactions: "bad" shakes the pair that produced nothing, "hit"
// pulses the element a known combination just remade. Dropping both classes
// and forcing a reflow re-arms the CSS animation, so repeating the same combo
// reacts every time instead of only the first — and the two never overlap.
function flash(cls: "x" | "h", ...ids: string[]): void {
  for (const id of ids) {
    const t = tiles[order.indexOf(id)];
    if (!t) continue;
    t.classList.remove("x", "h");
    void t.offsetWidth;
    t.classList.add(cls);
  }
}
function renderFocus(): void {
  tiles.map((t, i) => {
    // one element wears one of the two: gold for a locked pick, cyan for a
    // loose one. Nothing else on the board is marked — a mix leaves the pair
    // in the altar, not on the tiles.
    t.classList.toggle("e", i === sel && held);
    t.classList.toggle("E", i === sel && !held);
    t.classList.toggle("u", padMode && i === cursor);
  });
}
function gridCols(): number {
  return Math.max(1, getComputedStyle(gd).gridTemplateColumns.split(" ").length);
}
export function moveCursor(dx: number, dy: number): void {
  const n = tiles.length, c = gridCols();
  if (dx) cursor = Math.min(n - 1, Math.max(0, cursor + dx));
  if (dy) {
    const x = cursor % c, y = (cursor / c) | 0;
    const ny = Math.min(((n - 1) / c) | 0, Math.max(0, y + dy));
    cursor = Math.min(n - 1, ny * c + x);
  }
  padMode = true;
  renderFocus();
  if (tiles[cursor]) tiles[cursor].scrollIntoView({ block: "nearest" });
}

/* ------------------------------------------------------------ drag & drop */
// Drag one tile onto another to combine. Mouse/pen lift after a small
// movement threshold; touch lifts on a 220ms long-press so page scrolling
// stays possible: before the lift nothing is preventDefaulted, so the
// browser is free to claim the gesture as a pan (which fires pointercancel
// and quietly cancels the pending drag). Once lifted, boot()'s non-passive
// touchmove listener preventDefaults, so a pan can no longer start.
// The pointer is captured on the source tile, so its listeners see the whole
// gesture and the drop target is found with elementFromPoint (the ghost is
// pointer-events: none and cannot occlude it).
let pressIdx = -1;          // tile index under an active press, -1 when idle
let pressX = 0, pressY = 0; // press origin, for the lift threshold
let lastX = 0, lastY = 0;
let dragging = false;       // true once the tile is lifted
let ghost: HTMLElement | null = null;
let dropEl: HTMLElement | null = null;
let pressTimer = 0;
let clickGuard = 0;         // clicks before this timestamp ended a drag, not a select

function startPress(e: PointerEvent, i: number): void {
  if (phase() !== "play" || pressIdx >= 0) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  pressIdx = i;
  pressX = lastX = e.clientX;
  pressY = lastY = e.clientY;
  try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
  if (e.pointerType !== "mouse") pressTimer = setTimeout(lift, 220);
}
function lift(): void {
  if (pressIdx < 0 || dragging || phase() !== "play") return;
  dragging = true;
  sel = -1;                 // a pending click-selection mid-drag would confuse; clear silently
  held = false;
  renderFocus();
  const src = tiles[pressIdx];
  src.classList.add("d");
  ghost = src.cloneNode(true) as HTMLElement;
  ghost.classList.add("G");
  document.body.appendChild(ghost);
  moveGhost();
  SFX.select();
}
function tileAt(x: number, y: number): HTMLElement | null {
  const el = document.elementFromPoint(x, y);
  return el ? (el.closest(".t") as HTMLElement | null) : null;
}
function moveGhost(): void {
  if (!ghost) return;
  ghost.style.left = lastX + "px";
  ghost.style.top = lastY + "px";
  const t = tileAt(lastX, lastY);
  const next = t && t !== tiles[pressIdx] && t !== ghost ? t : null;
  if (dropEl !== next) {
    if (dropEl) dropEl.classList.remove("p");
    dropEl = next;
    if (dropEl) dropEl.classList.add("p");
  }
}
function onPressMove(e: PointerEvent): void {
  if (pressIdx < 0) return;
  lastX = e.clientX;
  lastY = e.clientY;
  if (!dragging) {
    const dx = lastX - pressX, dy = lastY - pressY;
    if (dx * dx + dy * dy > 36) {
      if (e.pointerType === "mouse") lift();
      else cancelPress();   // touch moved before the long-press: that's a scroll
    }
    return;
  }
  moveGhost();
}
function onPressUp(e: PointerEvent): void {
  if (pressIdx < 0) return;
  if (!dragging) { cancelPress(); return; } // sub-threshold press: the click event selects
  lastX = e.clientX;
  lastY = e.clientY;
  const t = tileAt(lastX, lastY);
  const srcId = order[pressIdx];
  const dstId = t ? t.dataset.id : undefined;
  clickGuard = performance.now() + 350;
  cancelPress();
  if (dstId && dstId !== srcId) attempt(srcId, dstId);
  else SFX.cancel();        // dropped on nothing / on itself: no move
}
function cancelPress(): void {
  clearTimeout(pressTimer);
  if (pressIdx >= 0 && tiles[pressIdx]) tiles[pressIdx].classList.remove("d");
  if (dropEl) { dropEl.classList.remove("p"); dropEl = null; }
  if (ghost) { ghost.remove(); ghost = null; }
  pressIdx = -1;
  dragging = false;
}

/* --------------------------------------------------------------- gameplay */
export type Phase = "overlay" | "menu" | "play";
export function phase(): Phase {
  return ov.classList.contains("w") ? "overlay"
       : ti.classList.contains("w") ? "menu" : "play";
}
/* ---------------------------------------------------------------- cauldron */
// The altar is the whole discovery UI now: a result lands in #cr instead of
// behind a veil, so nothing has to be dismissed before the next attempt.
function fill(box: HTMLElement, id: string | null): void {
  const el = id ? BY_ID[id] : null;
  box.innerHTML = el
    ? (el.c || el.bg || el.s ? iconHtml(el) : '<span class="i">' + el.e + "</span>") +
      "<span>" + el.n + "</span>"
    : "";
}
function paintCauldron(): void {
  // a locked element wins; otherwise show whatever the last attempt used, so a
  // drag fills the altar too instead of leaving A empty beside a full B
  fill(ca, sel >= 0 ? order[sel] : slotA);
  fill(cb, slotB);
  fill(cr, slotR);
  ca.classList.toggle("y", held);   // the gold ring and its X mean LOCKED
  renderFocus();   // the board mirrors both slots, so they change together
}
// B and the result are transient: they clear a beat after the attempt so the
// locked element is left facing an empty second slot, ready for the next try.
function clearSlots(): void {
  clearTimeout(clearTimer);
  slotA = slotB = slotR = null;
  cq.innerHTML = "";
}
function sweep(ms: number): void {
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => { clearSlots(); paintCauldron(); }, ms);
}
// Letting go empties the WHOLE altar, not just the lock: leaving a stale cyan
// secondary behind would mean the next tap on it promoted rather than mixed.
/* ------------------------------------------- first-ever discovery (full screen) */
let discTimer = 0;
export function closeDisc(): void {
  clearTimeout(discTimer);
  ds.classList.remove("y");
  ds.innerHTML = "";
}
// Only ever for an element never discovered in ANY previous run — the codex is
// what decides that. Rediscoveries and repeats stay in the cauldron.
function openDisc(id: string, aId: string, bId: string): void {
  let k = "";
  for (let i = 0; i < 14; i++) {
    k += '<span class="k" style="transform:rotate(' + (i * 25.7 + 8) +
      "deg);--c:hsl(" + ((i * 360 / 14) | 0) + ' 95% 62%);animation-delay:' +
      (1.05 + i * 0.012) + 's"></span>';
  }
  const el = BY_ID[id];
  ds.innerHTML = k + '<span class="f"></span>' +
    '<span class="m"><span class="g a">' + iconHtml(BY_ID[aId]) + "</span></span>" +
    '<span class="m"><span class="g b">' + iconHtml(BY_ID[bId]) + "</span></span>" +
    '<span class="m"><span class="g r">' + iconHtml(el) + "</span></span>" +
    '<span class="c"><b>' + el.n + "</b><i>“" + el.q + "”</i></span>";
  void ds.offsetWidth;   // re-arm the fade when one discovery follows another
  ds.classList.add("y");
  discTimer = setTimeout(closeDisc, 2750);
}

export function unlock(): void {
  if (sel < 0 && !slotB) return;
  sel = -1;
  held = false;
  clearSlots();
  SFX.cancel();
  renderFocus();
  paintCauldron();
}
// One element, three states, on the tile you keep tapping: picked (cyan),
// then LOCKED (gold), then nothing. A different element mixes with whatever is
// picked — and the difference the lock buys is what happens next: a loose pick
// is spent by the mix, so the board comes back empty and the next pair starts
// from scratch, while a locked one survives every mix, which is what makes
// trying Fire against ten things ten taps instead of twenty.
export function selectAt(i: number): void {
  if (phase() !== "play" || i < 0 || i >= order.length) return;
  cursor = i;
  if (sel === i) {
    if (held) { sel = -1; held = false; SFX.cancel(); }   // third tap: let go
    else { held = true; SFX.select(); }                   // second tap: lock it
  } else if (sel < 0) { sel = i; SFX.select(); }          // first tap: pick it
  else {
    const a = order[sel];
    if (!held) sel = -1;   // a loose pick is spent by the mix it just made
    renderFocus();
    attempt(a, order[i]);
    return;
  }
  renderFocus();
  paintCauldron();
}
// keyboard/gamepad select: mark pad mode so the focus ring shows
export function padSelect(): void {
  padMode = true;
  selectAt(cursor);
}
export function clearSel(): boolean {
  if (sel >= 0) { unlock(); return true; }
  return false;
}
export function attempt(aId: string, bId: string): void {
  closeDisc();   // a new attempt cuts any discovery still playing
  moves++;
  const res = RECIPE[rkey(aId, bId)];
  if (res && !codexK.has(rkey(aId, bId))) { codexK.add(rkey(aId, bId)); saveCodex(); }
  slotA = aId;
  slotB = bId;
  slotR = res || null;
  if (res && !found.has(res)) {
    found.add(res);
    addTile(res);
    if (!codexF.includes(res)) { codexF.push(res); saveCodex(); openDisc(res, aId, bId); }
    const el = BY_ID[res];
    cq.innerHTML = "<b>" + el.n + "</b> &mdash; &ldquo;" + el.q + "&rdquo;";
    SFX.discover();
    sweep(2200);
  } else if (res) {
    cq.innerHTML = "<b>" + N(res) + "</b> <i>&mdash; already discovered</i>";
    flash("h", res); // point at the element you already own
    SFX.dupe();
    sweep(1500);
  } else {
    cq.innerHTML = "<i>nothing happens</i>";
    SFX.fail();
    sweep(1100);
  }
  paintCauldron();
  checkMilestones();
  // re-arm both one-shots: the same pair tried twice has to react twice
  cd.classList.remove("x");
  cr.classList.remove("P");
  void cd.offsetWidth;
  (res ? cr : cd).classList.add(res ? "P" : "x");
  hud();
  save();
}

/* -------------------------------------------------------------------- hint */
// Names two elements you already hold that make something you do not — and
// charges a move for it, exactly like an attempt. That price is the whole
// design: a hint is progress bought with score, so a hinted run can never
// quietly out-rank an unhinted one, and spamming the button is self-limiting.
// It reveals the PAIR and never the result, so the discovery card still lands.
//
// One hint at a time: until you have actually made it, pressing hint again
// just shows the same pair, free. You paid for that answer, so re-reading it
// is not a second purchase — only moving on to a NEW answer is. Which also
// means the price cannot be dodged by re-rolling for an easier pair.
//
// A hint expires the moment its result exists, however that happened: the
// standing pair is checked against the found set rather than remembered as done, so
// discovering it the long way, or through an alternate recipe, retires the
// hint just as well. Not persisted — a reload simply forgets it, which only
// ever costs the player, never the other way round.
let lastHint: [string, string] | null = null;
function showHint([a, b]: [string, string], tail: string): void {
  toast("Hint: try " + N(a) + " + " + N(b) + tail);
  flash("h", a, b); // the same pulse a known combination gets: look here
  SFX.hint();
}
export function hint(): void {
  if (phase() !== "play") return;
  if (lastHint && !found.has(RECIPE[rkey(lastHint[0], lastHint[1])])) {
    showHint(lastHint, " — already paid for");
    return;
  }
  const picks: [string, string][] = [];
  for (const el of ELEMENTS) {
    if (found.has(el.id)) continue;
    for (const p of el.r || []) if (found.has(p[0]) && found.has(p[1])) picks.push(p);
  }
  // Nothing within reach is free — no move, no score. Defensive: running out of
  // productive pairs means the board is complete, which opens the completion
  // overlay and leaves play phase, so today this cannot be reached.
  if (!picks.length) {
    lastHint = null;
    toast("Nothing new within reach — no hint to give");
    SFX.cancel();
    return;
  }
  lastHint = picks[(Math.random() * picks.length) | 0];
  moves++;
  showHint(lastHint, " — costs a move");
  hud();
  save();
}

/* ------------------------------------------------------- goals & overlays */
type OverlayButton = [string, () => void];
let obFns: (() => void)[] = [];
let obCur = 0;
function openOverlay(html: string, buttons: OverlayButton[]): void {
  oc.innerHTML = html + '<div id="ob"></div>';
  obFns = [];
  obCur = 0;
  buttons.map(([label, fn]) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = fn;
    ob.appendChild(b);
    obFns.push(fn);
  });
  obPaint();
  ov.classList.add("w");
}
function obPaint(): void {
  [...ob.children].map((b, i) => b.classList.toggle("F", i === obCur));
}
export function obMove(d: number): void {
  obCur = (obCur + d + obFns.length) % obFns.length;
  obPaint();
}
export function obGo(): void {
  if (obFns[obCur]) obFns[obCur]();
}
function closeOverlay(): void {
  ov.classList.remove("w");
  oc.innerHTML = ""; // the hidden best must not linger in the DOM
}

// Compare-and-store; returns the HTML line describing the result.
function bestLine(key: string, val: number): string {
  const prev = +(store.get(key) || 0);
  if (!prev || val < prev) {
    store.set(key, val);
    return '<div class="L N">★ NEW BEST ★</div>' +
           (prev ? '<div class="L S">previous best: ' + prev + "</div>" : "");
  }
  return '<div class="L S">best: ' + prev + "</div>";
}
function checkMilestones(): void {
  if (cheated) return;   // nothing an unlocked board reaches is earned
  if (!questDone && found.has("rainbow") && found.has("unicorn")) {
    questDone = true;
    const q = bestLine(K_QUEST, moves);
    save();
    hud();
    if (found.size === ELEMENTS.length) return finishFull(q); // unicorn was the last element
    SFX.fanfare();
    openOverlay(
      '<div class="B">\u{1F308}\u{1F984}</div>' +
      '<div class="T">QUEST COMPLETE</div>' +
      "<h2>Rainbow &amp; Unicorn</h2>" +
      '<div class="L">forged in <b>' + moves + "</b> moves</div>" + q,
      [["Keep playing", () => { closeOverlay(); hud(); }],
       ["New game", () => { closeOverlay(); reset(); }]],
    );
    return;
  }
  if (!fullDone && found.size === ELEMENTS.length) finishFull("");
}
function finishFull(questHtml: string): void {
  fullDone = true;
  // The HIDDEN highscore: compared and shown only here, on a full clear.
  const f = bestLine(K_FULL, moves);
  save();
  hud();
  SFX.grand();
  openOverlay(
    '<div class="B">\u{1F451}</div>' +
    '<div class="T">GRAND ALCHEMIST</div>' +
    "<h2>All " + ELEMENTS.length + " elements</h2>" +
    (questHtml ? '<div class="L">quest also completed — in <b>' + moves + "</b> moves</div>" : "") +
    '<div class="L">complete run: <b>' + moves + "</b> moves</div>" + f,
    [["New game", () => { closeOverlay(); reset(); }]],
  );
}

/* ------------------------------------------------------- title screen menu */
// Boot lands here; Escape / Start / the HUD "Menu" button reopen it. The
// title floats over the bare background (body.M hides the game UI), and
// Highscore / Encyclopedia write their subscreen into #mu, over the column.
let mCur = 0;
let panel = false;         // the subscreen is up, and #ti.j says so
let armIdx = -1;           // menu button awaiting its confirming second press
let armLabel = "";         // ...and the label to put back when it disarms
let armTimer = 0;
// "Continue" is only offered when there is something to continue: a fresh
// boot, and a Reset everything, both leave nothing behind it
const inRun = (): boolean => moves > 0 || found.size > STARTERS.length;

function menuButtons(): HTMLElement[] {
  return [...mu.querySelectorAll("button")] as HTMLElement[];
}
function mPaint(): void {
  menuButtons().map((b, i) => b.classList.toggle("F", i === mCur));
}
function disarm(): void {
  const b = armIdx >= 0 ? menuButtons()[armIdx] : null;
  if (b) { b.textContent = armLabel; b.classList.remove("R"); }
  armIdx = -1;
  clearTimeout(armTimer);
}
// First press relabels the button with the warning and arms it; a second
// press within 2.5s goes through. Anything destructive routes through here.
function armed(i: number, warn: string): boolean {
  if (armIdx === i) { disarm(); return true; }
  disarm();
  armIdx = i;
  const b = menuButtons()[i];
  armLabel = b.textContent as string;
  b.textContent = warn;
  b.classList.add("R");
  armTimer = setTimeout(disarm, 2500);
  return false;
}
function newGame(i: number): void {
  if ((moves > 0 || found.size > STARTERS.length) && !armed(i, "Sure? (wipes the run)")) return;
  disarm();
  reset();
  closeMenu();
}
// Hands you every element. Costs no moves and earns nothing: the run is
// flagged from here on, so no best can come out of it.
function unlockAll(i: number): void {
  if (!armed(i, "Sure? (ends scoring)")) return;
  ELEMENTS.map(e => { if (!found.has(e.id)) { found.add(e.id); addTile(e.id); } });
  cheated = true;
  renderFocus();
  hud();
  save();
  closeMenu();
}
// The factory reset New game deliberately is not: run, both bests, and the
// all-time codex.
function wipeAll(i: number): void {
  if (!armed(i, "Sure? (scores and codex too)")) return;
  [K_RUN, K_QUEST, K_FULL, K_CODEX].map(k => store.del(k));
  codexF.length = 0;
  codexK.clear();
  reset();
  paintMenu();
  // deliberately NOT closeMenu(): New game means "start playing", this means
  // "put everything back" — you stay where you were, on the title screen
  toast("Everything reset");
}
function continueGame(): void {
  closeMenu();
  // a run that completed the game comes back to its completion screen
  if (fullDone) showRestoredCompletion();
  hud();
}
// the index is handed to the handler so the confirm flow never hardcodes a
// position — reorder this list freely
const MENU: [string, (i: number) => void][] = [
  ["Continue", continueGame],
  ["New game", newGame],
  ["Highscore", () => openPanel("HIGHSCORES", highscoreHtml())],
  ["Encyclopedia", () => openPanel("ENCYCLOPEDIA", encycloHtml())],
  ["Unlock all", unlockAll],
  ["Reset everything", wipeAll],
];
// Rebuilt rather than toggled, because which buttons exist depends on state:
// Reset everything calls this too, so Continue leaves with the run it pointed at.
function paintMenu(): void {
  mu.innerHTML = "";
  let n = 0;
  MENU.map(([label, fn], i) => {
    if (!i && !inRun()) return;
    const j = n++;
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => fn(j);
    b["onpointerenter"] = () => { mCur = j; mPaint(); };
    mu.appendChild(b);
  });
  mCur = 0;
  armIdx = -1;
  mPaint();
}
export function openMenu(): void {
  if (phase() !== "play") return;
  cancelPress();
  clearSel();
  closePanel();          // paints the column
  ti.classList.add("w");
  document.body.classList.add("M");
}
function closeMenu(): void {
  disarm();
  closePanel();
  ti.classList.remove("w");
  document.body.classList.remove("M");
}
function openPanel(head: string, listHtml: string): void {
  mu.innerHTML = '<div id="mh">' + head + '</div><div id="ml">' + listHtml +
    '</div><button id="mb">Back</button>';
  mb.onclick = menuBack;   // the button is rebuilt with the panel, so is this
  panel = true;
  mu.classList.add("j");
}
// Putting the column back IS closing the panel, so this paints rather than
// unhides: the two share the one container.
function closePanel(): void {
  panel = false;
  mu.classList.remove("j");
  paintMenu();
}
export function menuMove(d: number): void {
  if (panel) { ml.scrollTop += d * 60; return; }
  disarm();
  mCur = (mCur + d + menuButtons().length) % menuButtons().length;
  mPaint();
  SFX.select();
}
export function menuGo(): void {
  if (panel) { closePanel(); return; }
  const b = menuButtons()[mCur];
  if (b) b.click(); // through click, so the New game arming flow is identical
}
export function menuBack(): void {
  if (panel) { closePanel(); return; }
  if (armIdx >= 0) { disarm(); return; }
  continueGame();
}
function highscoreHtml(): string {
  const q = store.get(K_QUEST), f = store.get(K_FULL);
  return (
    '<div class="H"><span>Quest — Rainbow &amp; Unicorn</span><b>' +
    (q ? q + " moves" : "—") + "</b></div>" +
    '<div class="H"><span>Complete run — all ' + ELEMENTS.length + " elements</span><b>" +
    (f ? f + " moves" : "???") + "</b></div>" +
    (f ? "" : '<div class="O">the complete-run best reveals itself only to a Grand Alchemist</div>')
  );
}
function encycloHtml(): string {
  // The all-time codex, in first-discovery order — the player's journal, and
  // it survives New game. Only recipes actually performed are listed;
  // alternates stay unspoiled.
  const rows = codexF.map(id => {
    const el = BY_ID[id];
    const known = (el.r || []).filter(p => codexK.has(rkey(p[0], p[1])));
    const rec = known.length
      ? known.map(p => N(p[0]) + " + " + N(p[1])).join(" &nbsp;&middot;&nbsp; ")
      : el.r ? "?" : "primordial";
    return (
      '<div class="J"><span class="I">' + iconHtml(el) + "</span><span>" +
      "<b>" + el.n + '</b><i class="X">' + rec + "</i>" +
      '<div class="Q">' + el.q + "</div></span></div>"
    );
  }).join("");
  return rows +
    '<div class="O">' + codexF.length + " / " + ELEMENTS.length + " elements &middot; " +
    codexK.size + " / " + Object.keys(RECIPE).length + " combinations</div>";
}

/* ---------------------------------------------------------------- restart */
export function reset(): void {
  cancelPress();
  closeOverlay();
  closeDisc();
  clearSlots();
  found = new Set(); // the codex deliberately survives — New game wipes the board, not the knowledge
  order.length = 0;
  tiles.length = 0;
  gd.innerHTML = "";
  moves = 0;
  questDone = fullDone = cheated = false;
  sel = -1;
  held = false;
  cursor = 0;
  lastHint = null;  // its ingredients just left the board
  STARTERS.map(id => { found.add(id); addTile(id); });
  renderFocus();
  paintCauldron();
  hud();
  save();
}

/* -------------------------------------------------------------------- boot */
export function boot(): void {
  mn.onclick = openMenu;
  sn.onclick = muteToggle;
  paintSound();
  ht.onclick = hint;
  ca.onclick = unlock;                  // the X empties the locked slot
  ds["onpointerdown"] = closeDisc;      // a tap anywhere skips it
  // non-passive so an active drag can stop a pan from starting; until the
  // long-press lifts the tile, touch scrolling behaves normally
  window.addEventListener("touchmove", e => { if (dragging) e.preventDefault(); }, { passive: false });

  // restore the codex (all-time knowledge) first
  try {
    const cx = JSON.parse(store.get(K_CODEX) || "null");
    if (cx) {
      (cx.f && cx.f.map ? (cx.f as string[]) : []).filter(id => BY_ID[id])
        .map(id => { if (!codexF.includes(id)) codexF.push(id); });
      (cx.k && cx.k.map ? (cx.k as string[]) : []).filter(k => RECIPE[k])
        .map(k => codexK.add(k));
    }
  } catch {}
  STARTERS.map(id => { if (!codexF.includes(id)) codexF.push(id); });

  // then the saved run
  let run: { f?: unknown; k?: unknown; m?: number; q?: boolean; c?: boolean; x?: boolean } | null = null;
  const raw = store.get(K_RUN);
  try { run = raw ? JSON.parse(raw) : null; } catch {}
  if (run && run.f && (run.f as string[]).map) {
    const ids = (run.f as string[]).filter(id => BY_ID[id]);
    STARTERS.map(id => { if (!ids.includes(id)) ids.unshift(id); });
    ids.map(id => { found.add(id); addTile(id); });
    // migrate pre-codex saves: a run's discoveries and combos are knowledge
    ids.map(id => { if (!codexF.includes(id)) codexF.push(id); });
    if (run.k && (run.k as string[]).map) (run.k as string[]).filter(k => RECIPE[k]).map(k => codexK.add(k));
    moves = Math.max(0, (run.m as number) | 0);
    questDone = !!run.q;
    fullDone = !!run.c;
    cheated = !!run.x;
  } else {
    STARTERS.map(id => { found.add(id); addTile(id); });
  }
  hud();
  save();
  saveCodex();
  openMenu(); // every session starts on the title screen
}
// A run that completed the game returns to its completion screen on Continue.
function showRestoredCompletion(): void {
  openOverlay(
    '<div class="B">\u{1F451}</div>' +
    '<div class="T">GRAND ALCHEMIST</div>' +
    "<h2>All " + ELEMENTS.length + " elements</h2>" +
    '<div class="L">complete run: <b>' + moves + "</b> moves</div>" +
    '<div class="L S">best: ' + (+(store.get(K_FULL) || 0) || moves) + "</div>",
    [["New game", () => { closeOverlay(); reset(); }]],
  );
}

