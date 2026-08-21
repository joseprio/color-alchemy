// Entry point: boots the game, wires inputs, and runs the frame loop (gamepad
// polling). Nothing is exposed on window: check.mjs drives the real DOM, so
// the bundle carries no test surface at all.
import "./css";                     // the stylesheet, before anything renders
import { boot, phase } from "./game";
import { initKeyboard, pollPad } from "./input";
import { musicPlaying } from "./music";

boot();
initKeyboard();

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

