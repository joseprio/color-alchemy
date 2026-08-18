// Keyboard and gamepad. Mouse/touch need no module: tiles and buttons carry
// their own click handlers, and drag-and-drop lives with the tiles too
// (see game.ts — addTile and the drag & drop section).
import {
  phase, dismissModal, obMove, obGo, moveCursor, padSelect, clearSel,
  openMenu, menuMove, menuGo, menuBack, hint, muteToggle,
} from "./game";

// Mute answers in every phase — a title screen or an open discovery card is
// exactly when someone reaches for it — so both bindings jump the phase handling
// below. muteToggle is the HUD button's handler too, so the label always agrees.

/* --------------------------------------------------------------- keyboard */
export function initKeyboard(): void {
  window.addEventListener("keydown", e => {
    const k = e.key;
    if (!e.repeat && k === "m") { muteToggle(); e.preventDefault(); return; }
    const p = phase();
    if (p === "modal") {
      // e.repeat guard: a held Enter must not dismiss the card it just opened
      if (!e.repeat && (k === "Enter" || k === " " || k === "Escape")) {
        dismissModal();
        e.preventDefault();
      }
      return;
    }
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
  });
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
let prevA = false, prevB = false, prevX = false, prevY = false, prevStart = false;
const dirHeld: Partial<Record<Dir, { since: number; last: number }>> = {};

export function pollPad(now: number): void {
  let pad: Gamepad | null = null;
  try {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of gps) if (g && g.connected) { pad = g; break; }
  } catch {}
  if (!pad) return;
  const p0 = pad; // const-bind: let-narrowing does not survive into closures
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
  const a = bt(0), b = bt(1), x = bt(2), y = bt(3), st = bt(9);
  if (a && !prevA) {
    const p = phase();
    if (p === "modal") dismissModal();
    else if (p === "overlay") obGo();
    else if (p === "menu") menuGo();
    else padSelect();
  }
  if (b && !prevB) {
    const p = phase();
    if (p === "modal") dismissModal();
    else if (p === "menu") menuBack();
    else if (p === "play") { if (!clearSel()) openMenu(); } // Ⓑ mirrors Escape
  }
  if (x && !prevX) muteToggle();                 // Ⓧ mirrors M, in every phase
  if (y && !prevY && phase() === "play") hint(); // Ⓨ mirrors H; ignored elsewhere
  if (st && !prevStart) {
    const p = phase();
    if (p === "modal") dismissModal();
    else if (p === "overlay") obGo();
    else if (p === "menu") menuBack();  // Start toggles the pause menu closed
    else openMenu();                    // and open
  }
  prevA = a;
  prevB = b;
  prevX = x;
  prevY = y;
  prevStart = st;
}
