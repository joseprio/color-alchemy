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
let sel = -1;                       // index (into order) of the first selection
let cursor = 0;                     // keyboard/gamepad focus index
let padMode = false;                // show the focus ring only once kb/pad is used

const $ = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const tiles: HTMLElement[] = [];    // DOM nodes parallel to `order`

const rkey = (a: string, b: string): string => [a, b].sort().join("+");

function save(): void {
  store.set(K_RUN, JSON.stringify({ f: order, m: moves, q: questDone, c: fullDone }));
}
const K_CODEX = "colorAlchemy.codex";
function saveCodex(): void {
  store.set(K_CODEX, JSON.stringify({ f: codexF, k: [...codexK] }));
}

/* -------------------------------------------------------------------- HUD */
function hud(): void {
  $("moves").textContent = String(moves);
  $("count").textContent = found.size + " / " + ELEMENTS.length;
  const bq = store.get(K_QUEST);
  $("bestq").textContent = bq ? "Best quest: " + bq : "";
  $("goal").innerHTML = fullDone
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
  const b = $("snd");
  (b.firstChild as Text).textContent = muted ? "Muted" : "Sound";
  b.classList.toggle("off", muted);
}

export function muteToggle(): void {
  toast(toggleMute() ? "Sound off" : "Sound on");
  paintSound();
}

export function toast(msg: string): void {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1900);
}

/* -------------------------------------------------------------------- grid */
function iconHtml(el: ElementDef): string {
  // an SVG icon rides on .sw too, so every size rule the swatches have applies
  if (el.s) {
    return '<svg class="sw" viewBox="0 0 32 32" style="--g:' + (el.c || "#8a5cf0") + '55">' +
           el.s + "</svg>";
  }
  if (el.c || el.bg) {
    // bg (a full CSS background stack) overrides the flat color; the plain
    // color always supplies the glow, since "gradient…55" is not a color
    return '<div class="sw" style="background:' + (el.bg || el.c) +
           ";--g:" + (el.c || "#8a5cf0") + '55"></div>';
  }
  return el.e || "";
}
function addTile(id: string): void {
  const el = BY_ID[id];
  const d = document.createElement("div");
  d.className = "tile";
  d.dataset.id = id;
  d.innerHTML = '<div class="ico">' + iconHtml(el) + '</div><div class="nm">' + el.n + "</div>";
  const i = order.length;
  d.addEventListener("click", () => {
    if (performance.now() < clickGuard) return; // that click ended a drag
    padMode = false;
    renderFocus();
    selectAt(i);
  });
  // a reaction class clears itself; the arrival pop ends here too, and marks
  // the tile settled so no later class change replays it
  d.addEventListener("animationend", () => {
    d.classList.remove("bad", "hit");
    d.classList.add("settled");
  });
  d.addEventListener("pointerdown", e => startPress(e, i));
  d.addEventListener("pointermove", onPressMove);
  d.addEventListener("pointerup", onPressUp);
  d.addEventListener("pointercancel", cancelPress);
  order.push(id);
  tiles.push(d);
  $("grid").appendChild(d);
}
// One-shot tile reactions: "bad" shakes the pair that produced nothing, "hit"
// pulses the element a known combination just remade. Dropping both classes
// and forcing a reflow re-arms the CSS animation, so repeating the same combo
// reacts every time instead of only the first — and the two never overlap.
function flash(cls: "bad" | "hit", ...ids: string[]): void {
  for (const id of ids) {
    const t = tiles[order.indexOf(id)];
    if (!t) continue;
    t.classList.remove("bad", "hit");
    void t.offsetWidth;
    t.classList.add(cls);
  }
}
function renderFocus(): void {
  tiles.forEach((t, i) => {
    t.classList.toggle("sel", i === sel);
    t.classList.toggle("cur", padMode && i === cursor);
  });
}
function gridCols(): number {
  return Math.max(1, getComputedStyle($("grid")).gridTemplateColumns.split(" ").length);
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
  renderFocus();
  const src = tiles[pressIdx];
  src.classList.add("dragsrc");
  ghost = src.cloneNode(true) as HTMLElement;
  ghost.classList.add("ghost");
  document.body.appendChild(ghost);
  moveGhost();
  SFX.select();
}
function tileAt(x: number, y: number): HTMLElement | null {
  const el = document.elementFromPoint(x, y);
  return el ? (el.closest(".tile") as HTMLElement | null) : null;
}
function moveGhost(): void {
  if (!ghost) return;
  ghost.style.left = lastX + "px";
  ghost.style.top = lastY + "px";
  const t = tileAt(lastX, lastY);
  const next = t && t !== tiles[pressIdx] && t !== ghost ? t : null;
  if (dropEl !== next) {
    if (dropEl) dropEl.classList.remove("drop");
    dropEl = next;
    if (dropEl) dropEl.classList.add("drop");
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
  if (pressIdx >= 0 && tiles[pressIdx]) tiles[pressIdx].classList.remove("dragsrc");
  if (dropEl) { dropEl.classList.remove("drop"); dropEl = null; }
  if (ghost) { ghost.remove(); ghost = null; }
  pressIdx = -1;
  dragging = false;
}

/* --------------------------------------------------------------- gameplay */
export type Phase = "modal" | "overlay" | "menu" | "play";
export function phase(): Phase {
  return $("modal").classList.contains("show") ? "modal"
       : $("overlay").classList.contains("show") ? "overlay"
       : $("title").classList.contains("show") ? "menu" : "play";
}
export function selectAt(i: number): void {
  if (phase() !== "play" || i < 0 || i >= order.length) return;
  cursor = i;
  if (sel === i) { sel = -1; SFX.cancel(); }
  else if (sel < 0) { sel = i; SFX.select(); }
  else {
    const a = order[sel], b = order[i];
    sel = -1;
    renderFocus();
    attempt(a, b);
    return;
  }
  renderFocus();
}
// keyboard/gamepad select: mark pad mode so the focus ring shows
export function padSelect(): void {
  padMode = true;
  selectAt(cursor);
}
export function clearSel(): boolean {
  if (sel >= 0) { sel = -1; SFX.cancel(); renderFocus(); return true; }
  return false;
}
export function attempt(aId: string, bId: string): void {
  moves++;
  const res = RECIPE[rkey(aId, bId)];
  if (res && !codexK.has(rkey(aId, bId))) { codexK.add(rkey(aId, bId)); saveCodex(); }
  if (res && !found.has(res)) {
    found.add(res);
    addTile(res);
    const firstEver = !codexF.includes(res);
    if (firstEver) { codexF.push(res); saveCodex(); }
    openModal(res, aId, bId, firstEver);
    SFX.discover();
  } else if (res) {
    toast(N(aId) + " + " + N(bId) + " = " + N(res) + " — already discovered");
    flash("hit", res); // point at the element you already own
    SFX.dupe();
  } else {
    toast(N(aId) + " + " + N(bId) + " … nothing happens");
    flash("bad", aId, bId);
    SFX.fail();
  }
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
  flash("hit", a, b); // the same pulse a known combination gets: look here
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

/* ------------------------------------------------- discovery card (modal) */
let modalAt = 0;
function openModal(id: string, aId: string, bId: string, firstEver?: boolean): void {
  const el = BY_ID[id];
  // A first-EVER discovery (never seen in any previous run) opens with the
  // merge animation: the two ingredients fly together, flash, and the new
  // element pops out; the card text fades in after. All pure CSS with
  // animation delays — nothing to cancel if the card is dismissed early.
  const stage = firstEver
    ? '<div class="mstage">' +
        '<span class="mhalf mA">' + iconHtml(BY_ID[aId]) + "</span>" +
        '<span class="mhalf mB">' + iconHtml(BY_ID[bId]) + "</span>" +
        '<span class="mring"></span>' +
        '<span class="mres">' + iconHtml(el) + "</span>" +
      "</div>"
    : '<div class="big">' + iconHtml(el) + "</div>";
  $("mcard").innerHTML = stage +
    '<div class="mbody' + (firstEver ? " anim" : "") + '">' +
    '<div class="tag">NEW ELEMENT</div>' +
    "<h2>" + el.n + "</h2>" +
    '<div class="quote">“' + el.q + "”</div>" +
    '<div class="recipe">' + N(aId) + " + " + N(bId) + "</div>" +
    '<div class="hint">tap / Enter / Ⓐ</div>' +
    "</div>";
  $("modal").classList.add("show");
  modalAt = performance.now();
}
export function dismissModal(force?: boolean): void {
  if (phase() !== "modal") return;
  if (!force && performance.now() - modalAt < 250) return; // eat the double-click that opened it
  $("modal").classList.remove("show");
  checkMilestones();
}

/* ------------------------------------------------------- goals & overlays */
type OverlayButton = [string, () => void];
let obFns: (() => void)[] = [];
let obCur = 0;
function openOverlay(html: string, buttons: OverlayButton[]): void {
  $("ocard").innerHTML = html + '<div id="obtns"></div>';
  const box = $("obtns");
  obFns = [];
  obCur = 0;
  buttons.forEach(([label, fn]) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.addEventListener("click", fn);
    box.appendChild(b);
    obFns.push(fn);
  });
  obPaint();
  $("overlay").classList.add("show");
}
function obPaint(): void {
  [...$("obtns").children].forEach((b, i) => b.classList.toggle("obfocus", i === obCur));
}
export function obMove(d: number): void {
  obCur = (obCur + d + obFns.length) % obFns.length;
  obPaint();
}
export function obGo(): void {
  if (obFns[obCur]) obFns[obCur]();
}
function closeOverlay(): void {
  $("overlay").classList.remove("show");
  $("ocard").innerHTML = ""; // the hidden best must not linger in the DOM
}

// Compare-and-store; returns the HTML line describing the result.
function bestLine(key: string, val: number): string {
  const prev = +(store.get(key) || 0);
  if (!prev || val < prev) {
    store.set(key, val);
    return '<div class="line newbest">★ NEW BEST ★</div>' +
           (prev ? '<div class="line best">previous best: ' + prev + "</div>" : "");
  }
  return '<div class="line best">best: ' + prev + "</div>";
}
function checkMilestones(): void {
  if (!questDone && found.has("rainbow") && found.has("unicorn")) {
    questDone = true;
    const q = bestLine(K_QUEST, moves);
    save();
    hud();
    if (found.size === ELEMENTS.length) return finishFull(q); // unicorn was the last element
    SFX.fanfare();
    openOverlay(
      '<div class="big">\u{1F308}\u{1F984}</div>' +
      '<div class="tag">QUEST COMPLETE</div>' +
      "<h2>Rainbow &amp; Unicorn</h2>" +
      '<div class="line">forged in <b>' + moves + "</b> moves</div>" + q,
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
    '<div class="big">\u{1F451}</div>' +
    '<div class="tag">GRAND ALCHEMIST</div>' +
    "<h2>All " + ELEMENTS.length + " elements</h2>" +
    (questHtml ? '<div class="line">quest also completed — in <b>' + moves + "</b> moves</div>" : "") +
    '<div class="line">complete run: <b>' + moves + "</b> moves</div>" + f,
    [["New game", () => { closeOverlay(); reset(); }]],
  );
}

/* ------------------------------------------------------- title screen menu */
// Boot lands here; Escape / Start / the HUD "Menu" button reopen it. The
// title floats over the bare background (body.menu hides the game UI), and
// Highscore / Encyclopedia swap the button column for the #mpanel subscreen.
let mCur = 0;
let ngArmed = false;       // "New game" double-press confirm, like the old Restart
let ngTimer = 0;

function menuButtons(): HTMLElement[] {
  return [...$("menu").querySelectorAll("button")] as HTMLElement[];
}
function mPaint(): void {
  menuButtons().forEach((b, i) => b.classList.toggle("obfocus", i === mCur));
}
function disarmNg(): void {
  ngArmed = false;
  clearTimeout(ngTimer);
  const b = menuButtons()[1];
  if (b) { b.textContent = "New game"; b.classList.remove("armed"); }
}
function newGame(): void {
  if (!ngArmed && (moves > 0 || found.size > STARTERS.length)) {
    ngArmed = true;
    const b = menuButtons()[1];
    b.textContent = "Sure? (wipes the run)";
    b.classList.add("armed");
    ngTimer = setTimeout(disarmNg, 2500);
    return;
  }
  disarmNg();
  reset();
  closeMenu();
}
function continueGame(): void {
  closeMenu();
  // a run that completed the game comes back to its completion screen
  if (fullDone) showRestoredCompletion();
  hud();
}
const MENU: [string, () => void][] = [
  ["Continue", continueGame],
  ["New game", newGame],
  ["Highscore", () => openPanel("HIGHSCORES", highscoreHtml())],
  ["Encyclopedia", () => openPanel("ENCYCLOPEDIA", encycloHtml())],
];
export function openMenu(): void {
  if (phase() !== "play") return;
  cancelPress();
  clearSel();
  const box = $("menu");
  box.innerHTML = "";
  MENU.forEach(([label, fn], i) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.addEventListener("click", fn);
    b.addEventListener("pointerenter", () => { mCur = i; mPaint(); });
    box.appendChild(b);
  });
  mCur = 0;
  ngArmed = false;
  closePanel();
  mPaint();
  $("title").classList.add("show");
  document.body.classList.add("menu");
}
function closeMenu(): void {
  disarmNg();
  closePanel();
  $("title").classList.remove("show");
  document.body.classList.remove("menu");
}
function openPanel(head: string, listHtml: string): void {
  $("mhead").textContent = head;
  $("mlist").innerHTML = listHtml;
  $("mlist").scrollTop = 0;
  $("menu").hidden = true;
  $("mpanel").hidden = false;
}
function closePanel(): void {
  $("mpanel").hidden = true;
  $("menu").hidden = false;
}
export function menuMove(d: number): void {
  if (!$("mpanel").hidden) { $("mlist").scrollTop += d * 60; return; }
  disarmNg();
  mCur = (mCur + d + MENU.length) % MENU.length;
  mPaint();
  SFX.select();
}
export function menuGo(): void {
  if (!$("mpanel").hidden) { closePanel(); return; }
  const b = menuButtons()[mCur];
  if (b) b.click(); // through click, so the New game arming flow is identical
}
export function menuBack(): void {
  if (!$("mpanel").hidden) { closePanel(); return; }
  if (ngArmed) { disarmNg(); return; }
  continueGame();
}
function highscoreHtml(): string {
  const q = store.get(K_QUEST), f = store.get(K_FULL);
  return (
    '<div class="hsrow"><span>Quest — Rainbow &amp; Unicorn</span><b>' +
    (q ? q + " moves" : "—") + "</b></div>" +
    '<div class="hsrow"><span>Complete run — all ' + ELEMENTS.length + " elements</span><b>" +
    (f ? f + " moves" : "???") + "</b></div>" +
    (f ? "" : '<div class="hsnote">the complete-run best reveals itself only to a Grand Alchemist</div>')
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
      '<div class="erow"><span class="eico">' + iconHtml(el) + "</span><span>" +
      "<b>" + el.n + '</b><i class="erec">' + rec + "</i>" +
      '<div class="equote">' + el.q + "</div></span></div>"
    );
  }).join("");
  return rows +
    '<div class="hsnote">' + codexF.length + " / " + ELEMENTS.length + " elements &middot; " +
    codexK.size + " / " + Object.keys(RECIPE).length + " combinations</div>";
}

/* ---------------------------------------------------------------- restart */
export function reset(): void {
  cancelPress();
  closeOverlay();
  $("modal").classList.remove("show");
  found = new Set(); // the codex deliberately survives — New game wipes the board, not the knowledge
  order.length = 0;
  tiles.length = 0;
  $("grid").innerHTML = "";
  moves = 0;
  questDone = fullDone = false;
  sel = -1;
  cursor = 0;
  lastHint = null;  // its ingredients just left the board
  STARTERS.forEach(id => { found.add(id); addTile(id); });
  renderFocus();
  hud();
  save();
}

/* -------------------------------------------------------------------- boot */
export function boot(): void {
  $("mnu").addEventListener("click", openMenu);
  $("snd").addEventListener("click", muteToggle);
  paintSound();
  $("hnt").addEventListener("click", hint);
  $("mback").addEventListener("click", menuBack);
  $("modal").addEventListener("click", () => dismissModal());
  // non-passive so an active drag can stop a pan from starting; until the
  // long-press lifts the tile, touch scrolling behaves normally
  window.addEventListener("touchmove", e => { if (dragging) e.preventDefault(); }, { passive: false });

  // restore the codex (all-time knowledge) first
  try {
    const cx = JSON.parse(store.get(K_CODEX) || "null");
    if (cx) {
      (Array.isArray(cx.f) ? (cx.f as string[]) : []).filter(id => BY_ID[id])
        .forEach(id => { if (!codexF.includes(id)) codexF.push(id); });
      (Array.isArray(cx.k) ? (cx.k as string[]) : []).filter(k => RECIPE[k])
        .forEach(k => codexK.add(k));
    }
  } catch {}
  STARTERS.forEach(id => { if (!codexF.includes(id)) codexF.push(id); });

  // then the saved run
  let run: { f?: unknown; k?: unknown; m?: number; q?: boolean; c?: boolean } | null = null;
  const raw = store.get(K_RUN);
  try { run = raw ? JSON.parse(raw) : null; } catch {}
  if (run && Array.isArray(run.f)) {
    const ids = (run.f as string[]).filter(id => BY_ID[id]);
    STARTERS.forEach(id => { if (!ids.includes(id)) ids.unshift(id); });
    ids.forEach(id => { found.add(id); addTile(id); });
    // migrate pre-codex saves: a run's discoveries and combos are knowledge
    ids.forEach(id => { if (!codexF.includes(id)) codexF.push(id); });
    if (Array.isArray(run.k)) (run.k as string[]).filter(k => RECIPE[k]).forEach(k => codexK.add(k));
    moves = Math.max(0, (run.m as number) | 0);
    questDone = !!run.q;
    fullDone = !!run.c;
  } else {
    STARTERS.forEach(id => { found.add(id); addTile(id); });
  }
  hud();
  save();
  saveCodex();
  openMenu(); // every session starts on the title screen
}
// A run that completed the game returns to its completion screen on Continue.
function showRestoredCompletion(): void {
  openOverlay(
    '<div class="big">\u{1F451}</div>' +
    '<div class="tag">GRAND ALCHEMIST</div>' +
    "<h2>All " + ELEMENTS.length + " elements</h2>" +
    '<div class="line">complete run: <b>' + moves + "</b> moves</div>" +
    '<div class="line best">best: ' + (+(store.get(K_FULL) || 0) || moves) + "</div>",
    [["New game", () => { closeOverlay(); reset(); }]],
  );
}

/* -------------------------------------------------------------- test hooks */
// Consumed by check.mjs through window.CA (wired in index.ts).
export function caState() {
  return { found: [...found], moves, questDone, fullDone, sel, cursor, phase: phase() };
}
