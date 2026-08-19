// Entry point: boots the game, wires inputs, runs the frame loop (gamepad
// polling), and exposes the window.CA test hooks check.mjs drives.
import "./css";                     // the stylesheet, before anything renders
import { ELEMENTS, RECIPE } from "./elements";
import { boot, attempt, selectAt, dismissModal, reset, caState } from "./game";
import { initKeyboard, pollPad } from "./input";
import { wakeAudio } from "./music";

boot();
initKeyboard();

// The music needs a user gesture before the AudioContext may run, so it starts
// on the first one of either kind — and keeps trying on later ones, because a
// context can come back suspended. wakeAudio is idempotent, so no removal.
document.addEventListener("pointerdown", wakeAudio);
document.addEventListener("keydown", wakeAudio);

// the only thing left needing a frame: the gamepad, which has no event API
const frame = (t: number): void => {
  pollPad(t);
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

(window as any).CA = {
  ELEMENTS,
  RECIPE,
  attempt,
  selectAt,
  dismiss: () => dismissModal(true),
  reset,
  state: caState,
};
