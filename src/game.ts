// Core game: state, the element grid, combining, discovery cards, the two
// goal overlays, and persistence.
//
// Scoring: every combination ATTEMPT counts as a move — successes, failures
// and rediscoveries alike — and so does a HINT, which buys a productive pair
// for the same price — though repeating a hint you have not acted on yet is
// free (a perfect quest is 32 moves; a perfect full clear is 98).
//
// PERSISTENCE IS ONE localStorage ENTRY, `colorAlchemy`, holding one array;
// src/store.ts owns it and the S_* constants below name the slots:
//   0 tree      the recipe-tree fingerprint. A mismatch drops both bests and
//               keeps everything else — the two bests are only meaningful
//               against the tree that set them.
//   1 run       the current run, so closing the tab loses nothing. Restart
//               (double-press to confirm) wipes it, never the bests.
//   2 bestQuest fewest moves to hold both Rainbow and Unicorn. Shown in the
//               HUD once it exists.
//   3 bestFull  fewest total moves to find ALL elements. The HIDDEN highscore
//               — only ever compared and shown on the completion screen,
//               which only a full clear reaches (closeOverlay wipes the card
//               so it cannot linger in the DOM either).
//   4 codex     all-time knowledge, outliving every run.
//   5 mute      a preference, which is why Reset everything leaves it alone.
// Five separate keys became this and it measured -41 B: the win is not the
// repeated `colorAlchemy.` prefix (roadroller charges almost nothing for an
// exact repeat) but the code the shape removes — a three-method wrapper, two
// JSON.parse/stringify pairs, and the fingerprint concatenated onto two key
// names. Shortening all five keys to one character each was measured first as
// an upper bound and only reached -25, so the structure is where the bytes are.
import { ELEMENTS, STARTERS, BY_ID, RECIPE, N, type ElementDef } from "./elements";
// Director's-cut only: three markup helpers over a table of 101 strings, all
// four of them behind the __DIRECTOR__ literal at every call site below, which
// is what lets closure delete the lot from a shipping build.
import { cardQuote, wellQuote, codexQuote } from "./quotes";
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
// ONE localStorage entry, sections by index: [tree, run, bestQuest, bestFull,
// codex, mute]. The tree hash rides in slot 0 instead of being suffixed onto two
// key names — a mismatch drops the two bests and keeps everything else, which is
// what the suffixed keys did by orphaning them.
import { cell, put } from "./store";
const S_RUN = 1, S_QUEST = 2, S_FULL = 3, S_CODEX = 4;
if (cell[0] !== TREE) { cell[0] = TREE; cell[S_QUEST] = cell[S_FULL] = 0; }

/* ------------------------------------------------------------------- state */
let found = new Set<string>();      // discovered element ids (this run)
const order: string[] = [];         // discovery order (drives the grid)
// EVERY PAIR PUT IN THE CAULDRON THIS RUN, successes included. RUN state, so
// it rides the run save and New game wipes it with the board. It was failures
// only until now, under the name `dead`, and it lived with the all-time codex
// instead. Two things fall out of the move:
//   - THE SUCCESSES CAN JOIN IT, which is the point. A pair already performed
//     greys out on the next pick of either half, instead of silently repeating
//     itself and answering "already discovered" after the fact.
//   - NO FILTER IS NEEDED AT EITHER END. `dead` claimed "nothing here, ever" —
//     a statement about the TREE, which a balance patch could falsify, hence
//     the mirrored load filters this replaces. "Tried" is a statement about
//     the player within one run, and inside a run `found` only ever grows, so
//     a tried pair that made something means you still hold that something.
//     "Tried" and "nothing left to give" are therefore the same statement, and
//     no second clause is needed to keep the board honest.
// The price is that failures are no longer remembered across runs: New game
// now genuinely starts the search over.
//
// A PLAIN OBJECT RATHER THAN A Set, because this one is persisted and a Set is
// not JSON: as a Set it needs `[...tried]` on every save and a `.map` loop on
// every load, where the object IS the saved shape and both ends become an
// assignment. `__proto__` is the usual hazard with an object-as-dictionary and
// cannot arise here — every key is rkey() output, so every key contains a "+".
let tried: Record<string, 1> = {};
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

// Restarting a CSS animation is remove-class, FLUSH, add-class — and the flush
// is a layout read. A bare `void el.offsetWidth` does not survive the build:
// closure ADVANCED sees a pure property read whose value is discarded and
// deletes the statement, which silently broke every repeat animation in the
// game (a second dead end in a row did not shake, a repeated dupe did not
// pulse, back-to-back discoveries did not re-fade). Feeding the value into a
// branch is what makes it undroppable: closure cannot prove which way it goes,
// so it has to do the read.
function reflow(el: HTMLElement): void {
  if (el.offsetWidth < 0) el.hidden = true;
}

function save(): void {
  put(S_RUN, { f: order, t: tried, m: moves, q: questDone, c: fullDone, x: cheated });
}
function saveCodex(): void {
  put(S_CODEX, { f: codexF, k: [...codexK] });
}

/* -------------------------------------------------------------------- HUD */
function hud(): void {
  mv.textContent = String(moves);
  ct.textContent = found.size + " / " + ELEMENTS.length;
  const q = cell[S_QUEST];
  bq.textContent = q ? "Best quest: " + q : "";
  gl.innerHTML = cheated
    ? "Unlocked &mdash; this run does not score"
    : fullDone
    ? "Complete. \u{1F3C6}"
    : questDone
      ? "Endgame: discover all " + ELEMENTS.length + " elements"
      : "Forge the \u{1F308} <b>Rainbow</b> and the \u{1F984} <b>Unicorn</b>";
}

let toastTimer = 0;
// The label names the ACTION, not the state: Mute while there is something to
// mute, Unmute once there is not. It still wears one LOOK — no dim class, no
// second border — so it sits with Hint and Menu; only the word changes.
// Called at boot too, since the preference outlives the run.
function paintMute(): void {
  (sn.firstChild as Text).textContent = muted ? "Unmute" : "Mute";
}

// The one mute path: the key, the pad button and the HUD button all land here,
// so the word can never disagree with the state.
export function muteToggle(): void {
  toast(toggleMute() ? "Sound off" : "Sound on");
  paintMute();
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
  d.innerHTML = '<div class="o">' + iconHtml(el) + '</div><div class="n">' + el.n;
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
    d.classList.remove("h");
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
// The one-shot tile reaction, and now the only one: the element a known
// combination just remade pulses, so the toast is not the only thing pointing
// at it. Dropping the class and forcing a reflow re-arms the CSS animation, so
// repeating the same combo reacts every time instead of only the first.
// A pair that makes NOTHING shakes the CAULDRON rather than the two tiles
// (#cd.x), so "x" has not reached a tile for some time — it was still being
// passed and still being cleared here, and both are gone with the parameter.
function flash(...ids: string[]): void {
  for (const id of ids) {
    const t = tiles[order.indexOf(id)];
    if (!t) continue;
    t.classList.remove("h");
    reflow(t);
    t.classList.add("h");
  }
}
function renderFocus(): void {
  const h = standingHint();
  // What the PICK has already been tried against this run — whether that made
  // nothing or made something now on the board; either way there is nothing
  // left to find there. Only ever while something is picked: with nothing in
  // hand there is no pair to be spent, and a board that stayed half-greyed
  // would just look broken.
  const p = sel >= 0 ? order[sel] : "";
  // EVERY ID STILL WORTH MIXING: one named by a recipe of an element THIS RUN
  // has not found. Anything else is SPENT — every combination it has left
  // either makes nothing or remakes something already on the board. That
  // includes the 40 terminal elements, which no recipe names at all and which
  // are therefore spent from the moment they are discovered.
  //
  // Against `found`, the RUN, and deliberately not against the codex: a New
  // game is a fresh search, so every label comes back with the empty board.
  // The partner does not have to be in hand either — an id stays live while
  // any recipe of a missing element names it, even one whose other half is
  // still undiscovered. That only ever errs late, never early.
  //
  // Derived here rather than kept in state: one pass over the tree, against a
  // render that only runs on an interaction, and derived state cannot drift
  // out of step with `found`. It is monotonic anyway — the missing set only
  // shrinks — so nothing ever un-spends and no label flickers.
  const live: Record<string, 1> = {};
  for (const el of ELEMENTS) if (!found.has(el.id))
    (el.r || []).map(q => (live[q[0]] = live[q[1]] = 1));
  tiles.map((t, i) => {
    // one element wears one of the two: gold for a locked pick, cyan for a
    // loose one. Nothing else on the board is marked — a mix leaves the pair
    // in the altar, not on the tiles.
    t.classList.toggle("e", i === sel && held);
    t.classList.toggle("E", i === sel && !held);
    t.classList.toggle("u", padMode && i === cursor);
    // both halves of an unspent hint glow, and stop glowing the moment
    // standingHint() goes null — which is why nothing has to clear it
    t.classList.toggle("g", !!h && h.includes(order[i]));
    // the name turns green the moment an element has nothing left to give
    const done = !live[order[i]];
    t.classList.toggle("S", done);
    // ...and the tile greys for any of three reasons, all of them the same
    // sentence: there is nothing left down this pair. EITHER HALF being spent
    // is enough — a spent element makes nothing new with anything, so it greys
    // against every pick, and a spent PICK greys the whole board in one go —
    // and so is having already tried the pair. Never on the pick itself: an
    // element is never tried against itself, so it stays lit over whatever
    // board it just proved.
    t.classList.toggle("x", !!p && i !== sel &&
      (done || !live[p] || !!tried[rkey(p, order[i])]));
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
// The pick a lift suspended. A drag has to clear sel/held to keep the board
// readable while the ghost is out, but a drag that comes back to where it
// started is not a drag at all — the player changed their mind — so the pick
// is put back and the drop is handled as the tap it turned out to be.
let dragSel = -1, dragHeld = false;

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
  dragSel = sel;            // remembered, in case the drop lands back on the source
  dragHeld = held;
  sel = -1;                 // a pending click-selection mid-drag would confuse; clear silently
  held = false;
  renderFocus();
  const src = tiles[pressIdx];
  src.classList.add("d");
  // The lift clears the pick so the drop can decide what it becomes, but the
  // board must not look like the pick evaporated: put the ring straight back on
  // the tile it belongs to. .d fades the source because it is in the air; the
  // ring is what still says whether it was LOCKED (gold, with its padlock) or
  // merely picked (cyan). Added before the clone on purpose, so when the tile in
  // the air is the picked one the ghost carries the ring too — .t.G comes later
  // in the sheet and keeps its own opacity and transform, so only the border,
  // background and badge come across. cancelPress() renders it away again.
  if (dragSel >= 0) tiles[dragSel].classList.add(dragHeld ? "e" : "E");
  // The tile in the air ALWAYS wears a ring, even when it was picked up cold:
  // cyan, the same mark the board puts on a second element, so a drag off an
  // untouched tile still shows what is being carried instead of a grey gap.
  // Skipped when it is the picked one, which already has its own ring above —
  // gold if it is locked, and gold must win.
  if (dragSel !== pressIdx) src.classList.add("E");
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
  const idx = pressIdx;     // cancelPress() clears it, and the self-drop needs it
  const srcId = order[idx];
  const dstId = t ? t.dataset.id : undefined;
  clickGuard = performance.now() + 350;
  cancelPress();
  if (dstId && dstId !== srcId) {
    // A LOCK SURVIVES EVERY MIX — that is the whole thing a lock buys, and it
    // has to hold whether the mix was tapped or dragged. Put it back before the
    // attempt, because attempt() paints the altar and paintCauldron() gives the
    // A slot to the locked element.
    // Only when the locked element is actually IN this mix, though. Dragging two
    // other tiles together while something else is locked is a different pair,
    // and showing the locked one in the A slot would be a lie about what was
    // just combined.
    const lockId = dragHeld && dragSel >= 0 ? order[dragSel] : null;
    if (lockId === srcId || lockId === dstId) {
      sel = dragSel;
      held = true;
      // the locked one goes in first whichever end of the drag it was, or the
      // altar would show it in A and the other in B when it was the target
      attempt(lockId, lockId === srcId ? dstId : srcId);
    } else attempt(srcId, dstId);
  }
  else if (dstId) {         // back on the source: exactly the tap it turned out to be
    padMode = false;        // it was a pointer, so the focus ring stays down
    sel = dragSel;
    held = dragHeld;
    selectAt(idx);          // pick it, lock it, let it go, or mix it — selectAt owns that
  } else {
    // Dropped on nothing: the gesture is off, so NOTHING changed — put the pick
    // back exactly as the lift found it. A lock especially: it is the one state
    // the player set deliberately and expects to survive until they drop it
    // deliberately, and letting a drag that landed on empty space destroy it was
    // the opposite of that. This also covers a lock held on some OTHER tile while
    // a third is dragged nowhere.
    sel = dragSel;
    held = dragHeld;
    renderFocus();          // cancelPress() just rendered it away
    SFX.cancel();           // the gesture was cancelled, not the pick
  }
}
function cancelPress(): void {
  clearTimeout(pressTimer);
  if (pressIdx >= 0 && tiles[pressIdx]) tiles[pressIdx].classList.remove("d");
  if (dropEl) { dropEl.classList.remove("p"); dropEl = null; }
  if (ghost) { ghost.remove(); ghost = null; }
  pressIdx = -1;
  dragging = false;
  renderFocus();   // drops the ring lift() put back by hand
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
      "<span>" + el.n
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
    '<span class="c"><b>' + el.n + "</b>" + (__DIRECTOR__ ? cardQuote(id) : "");
  reflow(ds);            // re-arm the fade when one discovery follows another
  ds.classList.add("y");
  discTimer = setTimeout(closeDisc, 3250);
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
  const k = rkey(aId, bId);
  const res = RECIPE[k];
  // Remembered from here on, so the next pick of either half says so on the
  // board. Unguarded and unsaved: it is run state, and the save() at the tail
  // of this function carries it either way.
  tried[k] = 1;
  if (res && !codexK.has(k)) { codexK.add(k); saveCodex(); }
  slotA = aId;
  slotB = bId;
  slotR = res || null;
  if (res && !found.has(res)) {
    found.add(res);
    addTile(res);
    if (!codexF.includes(res)) { codexF.push(res); saveCodex(); openDisc(res, aId, bId); }
    const el = BY_ID[res];
    cq.innerHTML = "<b>" + el.n + "</b>" + (__DIRECTOR__ ? wellQuote(res) : "");
    SFX.discover();
    sweep(2200);
  } else if (res) {
    cq.innerHTML = "<b>" + N(res) + "</b> <i>&mdash; already discovered";
    flash(res); // point at the element you already own
    SFX.dupe();
    sweep(1500);
  } else {
    cq.innerHTML = "<i>nothing happens";
    SFX.fail();
    sweep(1100);
  }
  paintCauldron();
  // a discovery can be the one that spends an ingredient — or both halves of
  // the pair — so the labels are re-derived here rather than at the next tap
  renderFocus();
  checkMilestones();
  // re-arm both one-shots: the same pair tried twice has to react twice
  cd.classList.remove("x");
  cr.classList.remove("P");
  reflow(cd);
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
// [a, b, what it makes]. The result rides along because hint() is holding the
// element it picked the pair off — re-deriving it through RECIPE[rkey(a, b)] on
// every render was the same answer at a price.
let lastHint: [string, string, string] | null = null;
// The hint still standing, or null once its result exists. DERIVED on every
// read rather than cleared on discovery, so a pair reached the long way — or
// through an alternate recipe — retires the glow exactly as it retires the
// hint, with no second piece of state that could disagree with this one.
function standingHint() {
  return lastHint && !found.has(lastHint[2]) ? lastHint : null;
}
function showHint([a, b]: [string, string, string], tail: string): void {
  toast("Hint: try " + N(a) + " + " + N(b) + tail);
  renderFocus();    // the pair lights and STAYS lit; see .t.g in style.css
  SFX.hint();
}
// EVERYTHING THE QUEST STILL NEEDS: walk back from the two goals through every
// recipe that makes them, and keep what is not owned yet. 34 of the 101 are off
// that path entirely — the animals, the drinks, the ornaments — so an unbiased
// hint spends about a third of its answers sending you shopping for a Penguin
// while the Rainbow stands unforged. Measured from a fresh board: 64 of 101 are
// on the path, and it narrows as the run goes (18 left by the time 70 are held).
//
// The `want.has` guard is not just for speed: Magic and the Crystal Ball make
// each other, so the walk would not terminate without it. A found element is not
// walked THROUGH either — owning it makes its own prerequisites irrelevant,
// which is what keeps the set to things still worth having.
//
// Deliberately generous: an element on ANY route to a goal counts, not only the
// cheapest one. A hint that named only the shortest path would be telling the
// player which route to take, and the hint's whole contract is that it reveals
// the pair and never the plan.
function questWants(): Set<string> {
  const want = new Set<string>();
  const walk = (id: string): void => {
    if (found.has(id) || want.has(id)) return;
    want.add(id);
    (BY_ID[id].r || []).map(p => { walk(p[0]); walk(p[1]); });
  };
  walk("rainbow");
  walk("unicorn");
  return want;
}
export function hint(): void {
  if (phase() !== "play") return;
  const std = standingHint();
  if (std) {
    showHint(std, " — already paid for");
    return;
  }
  let picks: [string, string, string][] = [];
  for (const el of ELEMENTS) {
    if (found.has(el.id)) continue;
    for (const p of el.r || []) if (found.has(p[0]) && found.has(p[1])) picks.push([p[0], p[1], el.id]);
  }
  // While the quest stands, answer it. Narrowing rather than replacing: if
  // nothing within reach is on the quest path the full list stands, so a hint is
  // never refused for being off-plan — and once the quest is done every
  // reachable pair is fair game again, which is what the endgame asks for.
  if (!questDone) {
    const want = questWants();
    const on = picks.filter(p => want.has(p[2]));
    if (on.length) picks = on;
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
  // A COMPLETION SCREEN CANCELS THE DISCOVERY LAYER, first-ever or not. The
  // element that finishes the quest or the board is a first discovery like any
  // other, so attempt() has already opened the full-screen card by the time
  // checkMilestones gets here — and the card would then play for its 3.25s in
  // front of the screen that actually matters, or worse, land on top of it.
  // Cancelled in the SAME synchronous turn it was opened in, so nothing of it
  // is ever painted. Every overlay this game opens is a completion screen, so
  // the rule belongs here rather than at the two places that raise one.
  closeDisc();
  oc.innerHTML = html + '<div id="ob">';
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
  // Behind __DIRECTOR__ with the rest of the fireworks: in a shipping build
  // this is the last reference to fwRaf and to the canvas, and closure needs
  // every one of them gone before it will delete the effect itself.
  if (__DIRECTOR__) {
    cancelAnimationFrame(fwRaf);
    fw.width = 0;    // resizing the bitmap IS the clear, and it is one word
  }
}

/* ------------------------------------------------------ completion fireworks */
// COMETS, chosen in experiments/fireworks-gl.html. Shells go up across `span`
// seconds, spread over the width; each spark keeps its last six positions and is
// stroked as a path through them, so it reads as a comet rather than as a dot
// with a smear behind it. The trails come from FADING the canvas each frame
// instead of clearing it — one fillRect, and the frame before shows through.
//
// The only canvas in the game, and it earns that by being the only moment worth
// it: this runs once or twice in a whole run. It never blocks — every button on
// the card works on frame one — and it stops itself when the last comet dies.
// A restored completion screen does NOT raise it: that moment already happened.
// prefers-reduced-motion gets no still, because a trail system held still is a
// blank canvas; style.css hides it outright and the card stands on its own.
let fwRaf = 0;
function fireworks(span: number): void {
  const g = fw.getContext("2d") as CanvasRenderingContext2D;
  // the bitmap is device pixels and the drawing code is CSS pixels, or every
  // tail is soft on the phones most likely to see this screen
  const r = Math.min(devicePixelRatio || 1, 2);
  const w = innerWidth, h = innerHeight;
  fw.width = w * r;
  fw.height = h * r;
  g.setTransform(r, 0, 0, r, 0, 0);
  g.lineCap = "round";
  const P: { x: number; y: number; vx: number; vy: number; c: string; l: number; t: number; h: number[] }[] = [];
  let last = 0, at = 0, next = 0;
  const step = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000) || 0;
    last = now;
    at += dt;
    if (at > next && at < span) {
      const x = (0.16 + Math.random() * 0.68) * w, y = (0.2 + Math.random() * 0.24) * h;
      // the discovery rays' own colour formula, so a shell is never a colour the
      // game does not already use somewhere
      const c = "hsl(" + ((Math.random() * 360) | 0) + " 95% 62%)";
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * 6.283, s = 60 + Math.random() * 100;
        P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c, l: 1.1 + Math.random() * 0.8, t: 0, h: [] });
      }
      next = at + 0.12 + Math.random() * 0.12;
    }
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#04060c4d";
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = "lighter";
    for (let i = P.length; i--;) {
      const p = P[i];
      p.t += dt;
      if (p.t > p.l) { P.splice(i, 1); continue; }
      p.vy += 88 * dt;                       // gravity
      p.vx -= p.vx * dt;                     // drag
      p.vy -= p.vy * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.h.push(p.x, p.y);
      if (p.h.length > 12) p.h.splice(0, 2); // six positions is the whole tail
      const k = 1 - p.t / p.l;
      g.globalAlpha = k * 0.9;
      g.strokeStyle = p.c;
      g.lineWidth = 1 + k * 1.6;
      g.beginPath();
      g.moveTo(p.h[0], p.h[1]);
      for (let j = 2; j < p.h.length; j += 2) g.lineTo(p.h[j], p.h[j + 1]);
      g.stroke();
    }
    g.globalAlpha = 1;
    if (P.length || at < span) fwRaf = requestAnimationFrame(step);
    else fw.width = 0;
  };
  fwRaf = requestAnimationFrame(now => { last = now; step(now); });
}

// Compare-and-store; returns the HTML line describing the result.
function bestLine(slot: number, val: number): string {
  const prev = +(cell[slot] || 0);
  if (!prev || val < prev) {
    put(slot, val);
    return '<div class="L N">★ NEW BEST ★</div>' +
           (prev ? '<div class="L S">previous best: ' + prev + "</div>" : "");
  }
  return '<div class="L S">best: ' + prev + "</div>";
}
function checkMilestones(): void {
  if (cheated) return;   // nothing an unlocked board reaches is earned
  if (!questDone && found.has("rainbow") && found.has("unicorn")) {
    questDone = true;
    const q = bestLine(S_QUEST, moves);
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
    if (__DIRECTOR__) fireworks(1.6);
    return;
  }
  if (!fullDone && found.size === ELEMENTS.length) finishFull("");
}
function finishFull(questHtml: string): void {
  fullDone = true;
  // The HIDDEN highscore: compared and shown only here, on a full clear.
  const f = bestLine(S_FULL, moves);
  save();
  hud();
  SFX.grand();
  openOverlay(
    '<div class="B">\u{1F3C6}</div>' +
    '<div class="T">GRAND ALCHEMIST</div>' +
    "<h2>All " + ELEMENTS.length + " elements</h2>" +
    (questHtml ? '<div class="L">quest also completed — in <b>' + moves + "</b> moves</div>" : "") +
    '<div class="L">complete run: <b>' + moves + "</b> moves</div>" + f,
    [["New game", () => { closeOverlay(); reset(); }]],
  );
  if (__DIRECTOR__) fireworks(3.2);
}

/* ------------------------------------------------------- title screen menu */
// Boot lands here; Escape / Start / the HUD "Menu" button reopen it. The
// title floats over the bare background (body.M hides the game UI), and
// Highscores / Encyclopedia write their subscreen into #mu, over the column.
// The panel head is the BUTTON'S OWN LABEL, uppercased at write time, rather
// than a second string saying the same word in caps: "Highscore" against
// "HIGHSCORES" was a near-miss repeat, and a near miss is what roadroller
// actually pays for. Worth 13 B, and 6 more were on the table for dropping the
// caps altogether — declined, the letter-spaced head is the look.
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
  [S_RUN, S_QUEST, S_FULL, S_CODEX].map(i => put(i, 0));
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
  ["Highscores", () => openPanel("Highscores", highscoreHtml())],
  ["Encyclopedia", () => openPanel("Encyclopedia", encycloHtml())],
];
// DEVELOPMENT TOOLS, and not in the shipped build. Pushed inside an if rather
// than spread into the list above so that with __DEV__ a literal false closure
// deletes the branch, then finds unlockAll and wipeAll unreferenced and deletes
// those too — `npm run build-dev` is the build that keeps them.
if (__DEV__) MENU.push(["Unlock all", unlockAll], ["Reset everything", wipeAll]);
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
  mu.innerHTML = '<div id="mh">' + head.toUpperCase() + '</div><div id="ml">' + listHtml +
    '</div><button id="mb">Back';
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
  const q = cell[S_QUEST], f = cell[S_FULL];
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
      (__DIRECTOR__ ? codexQuote(id) : "") + "</span></div>"
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
  tried = {};
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
  paintMute();
  ht.onclick = hint;
  ca.onclick = unlock;                  // clicking the locked slot empties it
  ds["onpointerdown"] = closeDisc;      // a tap anywhere skips it
  // non-passive so an active drag can stop a pan from starting; until the
  // long-press lifts the tile, touch scrolling behaves normally
  window.addEventListener("touchmove", e => { if (dragging) e.preventDefault(); }, { passive: false });

  // restore the codex (all-time knowledge) first
  try {
    const cx = cell[S_CODEX];
    if (cx) {
      (cx.f && cx.f.map ? (cx.f as string[]) : []).filter(id => BY_ID[id])
        .map(id => { if (!codexF.includes(id)) codexF.push(id); });
      (cx.k && cx.k.map ? (cx.k as string[]) : []).filter(k => RECIPE[k])
        .map(k => codexK.add(k));
    }
  } catch {}
  STARTERS.map(id => { if (!codexF.includes(id)) codexF.push(id); });

  // then the saved run
  let run: { f?: unknown; t?: unknown; k?: unknown; m?: number; q?: boolean; c?: boolean; x?: boolean } | null = null;
  run = cell[S_RUN] || null;
  if (run && run.f && (run.f as string[]).map) {
    const ids = (run.f as string[]).filter(id => BY_ID[id]);
    STARTERS.map(id => { if (!ids.includes(id)) ids.unshift(id); });
    ids.map(id => { found.add(id); addTile(id); });
    // migrate pre-codex saves: a run's discoveries and combos are knowledge
    ids.map(id => { if (!codexF.includes(id)) codexF.push(id); });
    if (run.k && (run.k as string[]).map) (run.k as string[]).filter(k => RECIPE[k]).map(k => codexK.add(k));
    tried = (run.t as Record<string, 1>) || {};
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
    '<div class="B">\u{1F3C6}</div>' +
    '<div class="T">GRAND ALCHEMIST</div>' +
    "<h2>All " + ELEMENTS.length + " elements</h2>" +
    '<div class="L">complete run: <b>' + moves + "</b> moves</div>" +
    '<div class="L S">best: ' + (+(cell[S_FULL] || 0) || moves) + "</div>",
    [["New game", () => { closeOverlay(); reset(); }]],
  );
}

