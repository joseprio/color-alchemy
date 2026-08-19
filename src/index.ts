// Entry point: boots the game, wires inputs, runs the frame loop (gamepad
// polling), and exposes the window.CA test hooks check.mjs drives.
import "./css";                     // the stylesheet, before anything renders
import { ELEMENTS, RECIPE } from "./elements";
import { boot, attempt, selectAt, dismissModal, reset, caState, phase } from "./game";
import { initKeyboard, pollPad } from "./input";
import { wakeAudio, musicPlaying } from "./music";

boot();
initKeyboard();

// The music needs a user gesture before the AudioContext may run, so it starts
// on the first one of either kind — and keeps trying on later ones, because a
// context can come back suspended. wakeAudio is idempotent, so no removal.
document.addEventListener("pointerdown", wakeAudio);
document.addEventListener("keydown", wakeAudio);

// the frame loop does two things: poll the gamepad, which has no event API, and
// tell the music whether the game is being played — it plays over the board and
// its cards and overlays, never over the title screen. musicPlaying ignores
// anything but a change, so this is a comparison per frame.
const frame = (t: number): void => {
  pollPad(t);
  musicPlaying(phase() !== "menu");
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
