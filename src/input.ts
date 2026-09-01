// Keyboard and gamepad. Mouse/touch need no module: tiles and buttons carry
// their own click handlers, and drag-and-drop lives with the tiles too
// (see game.ts — addTile and the drag & drop section).
import {
  phase, obMove, obGo, moveCursor, padSelect, clearSel,
  openMenu, menuMove, menuGo, menuBack, hint, muteToggle,
} from "./game";

// Mute answers in every phase — a title screen or an open discovery card is
// exactly when someone reaches for it — so both bindings jump the phase handling
// below. muteToggle is the HUD button's handler too, so the label always agrees.

/* --------------------------------------------------------------- keyboard */
export function initKeyboard(): void {
  window.onkeydown = e => {
    const k = e.key;
    if (!e.repeat && k === "m") { muteToggle(); e.preventDefault(); return; }
    const p = phase();
    if (p === "overlay") {
      if (k === "ArrowLeft" || k === "ArrowRight" || k === "Tab") {
        obMove(k === "ArrowLeft" ? -1 : 1);
        e.preventDefault();
      } else if (!e.repeat && (k === "Enter" || k === " ")) {
        obGo();
        e.preventDefault();
      }
      return;
    }
    if (p === "menu") {
      if (k === "ArrowUp" || k === "w") menuMove(-1);
      else if (k === "ArrowDown" || k === "s") menuMove(1);
      else if (!e.repeat && (k === "Enter" || k === " ")) menuGo();
      else if (k === "Escape") menuBack();
      else return;
      e.preventDefault();
      return;
    }
    if (k === "ArrowLeft" || k === "a") moveCursor(-1, 0);
    else if (k === "ArrowRight" || k === "d") moveCursor(1, 0);
    else if (k === "ArrowUp" || k === "w") moveCursor(0, -1);
    else if (k === "ArrowDown" || k === "s") moveCursor(0, 1);
    else if (!e.repeat && (k === "Enter" || k === " ")) padSelect();
    else if (!e.repeat && k === "h") hint();                  // costs a move, so never on repeat
    else if (k === "Escape") { if (!clearSel()) openMenu(); } // Esc: cancel, else pause
    else return;
    e.preventDefault();
  };
}

/* ---------------------------------------------------------------- gamepad */
// Polled from the rAF loop (index.ts). Directions unify d-pad and left stick
// into virtual buttons with hold-repeat; face buttons are edge-triggered so
// the A press that forges an element cannot also dismiss its discovery card.
// Ⓨ (index 3) is the hint: the top face button is the info slot by convention,
// and it sits diagonally opposite Ⓐ, so a thumb roll off confirm cannot spend
// a move on a hint. Ⓧ (index 2) is what was left, and mute is the right thing to
// put there: it is the one action that costs nothing and is wanted in any phase.
// 0-3 are also the indices every Standard Gamepad agrees on, unlike the
// triggers, which some drivers surface as axes instead.
type Dir = "left" | "right" | "up" | "down";
const DELTA: Record<Dir, [number, number]> = {
  left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1],
};
// One slot per button index rather than five named flags: an empty array
// reads undefined, which is already falsy, so this needs no initialiser at
// all — where five booleans cost an "=0" apiece.
const held: boolean[] = [];
const dirHeld: Partial<Record<Dir, { since: number; last: number }>> = {};

export function pollPad(now: number): void {
  // The feature test stays — getGamepads is [SecureContext], so it is undefined
  // when the phone probe serves the page over plain http, and calling it would
  // throw out of the rAF loop that polls this, killing the loop and not just
  // the pad. (?. would say it in fewer bytes, but the closure plugin re-parses
  // closure's output with an acorn too old to walk a ChainExpression.)
  const p0 = (navigator.getGamepads ? navigator.getGamepads() : [])
    .find(g => g && g.connected);
  if (!p0) return;
  const bt = (i: number): boolean => !!(p0.buttons[i] && p0.buttons[i].pressed);
  const ax = (i: number): number => (p0.axes && p0.axes[i]) || 0;
  const dirs: Record<Dir, boolean> = {
    left:  bt(14) || ax(0) < -0.5,
    right: bt(15) || ax(0) > 0.5,
    up:    bt(12) || ax(1) < -0.5,
    down:  bt(13) || ax(1) > 0.5,
  };
  for (const d of Object.keys(dirs) as Dir[]) {
    if (dirs[d]) {
      const h = dirHeld[d];
      const fire = !h || (now - h.since > 330 && now - h.last > 140);
      if (!h) dirHeld[d] = { since: now, last: now };
      if (fire) {
        dirHeld[d]!.last = now;
        const p = phase();
        if (p === "play") moveCursor(DELTA[d][0], DELTA[d][1]);
        else if (p === "overlay" && (d === "left" || d === "right")) obMove(d === "left" ? -1 : 1);
        else if (p === "menu" && (d === "up" || d === "down")) menuMove(d === "up" ? -1 : 1);
      }
    } else delete dirHeld[d];
  }
  // Rising edge: true only on the frame a button goes down. Called once per
  // button per frame as the `if` condition itself, so the state still updates
  // for every button despite the && below.
  const edge = (i: number): boolean => {
    const v = bt(i), was = held[i];
    held[i] = v;
    return v && !was;
  };
  if (edge(0)) {
    const p = phase();
    if (p === "overlay") obGo();
    else if (p === "menu") menuGo();
    else padSelect();
  }
  if (edge(1)) {
    const p = phase();
    if (p === "menu") menuBack();
    else if (p === "play") { if (!clearSel()) openMenu(); } // Ⓑ mirrors Escape
  }
  if (edge(2)) muteToggle();                 // Ⓧ mirrors M, in every phase
  if (edge(3) && phase() === "play") hint(); // Ⓨ mirrors H; ignored elsewhere
  if (edge(9)) {
    const p = phase();
    if (p === "overlay") obGo();
    else if (p === "menu") menuBack();  // Start toggles the pause menu closed
    else openMenu();                    // and open
  }
}
