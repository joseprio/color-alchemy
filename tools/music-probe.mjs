// Does the packed bundle actually make the sound the engine tests prove?
//
// The scratchpad comparison runs the TypeScript in node against the original
// floatbeat. This runs the SHIPPED page: the music renders ahead into
// AudioBuffers and schedules them, so this wraps AudioBufferSourceNode.start —
// the buffer is filled by then — and reads what the game queued, plus the gain
// the bus is set to. Silence, NaN or clipping here means the wiring or the
// closure pass broke something the node test cannot see.
//
// It also checks the mute path: muting stops the pump, so no new buffers get
// scheduled at all, which is the observable form of "costs nothing while off".
// The music only plays during the game, so the probe leaves the title screen
// first — on the title itself nothing is scheduled at all, by design.
// usage: node tools/music-probe.mjs   (npm run music-check)
import { launch } from "../cdp.mjs";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const blank = path.join(tmpdir(), "color-alchemy-blank.html");
writeFileSync(blank, "<!doctype html><title>blank</title>");

const t = await launch({ url: blank });
await t.send("Page.enable");
await t.send("Page.addScriptToEvaluateOnNewDocument", {
  // Everything is scoped inside the arrow: a `const` at the top level of a
  // document-start script is a global lexical binding, and the bundle declares
  // short names of its own — one collision is a SyntaxError that stops the whole
  // game from loading (which is exactly what happened the first time).
  source: `(() => {
    window.__scheduled = 0;
    window.__cap = [];
    window.__gain = null;
    const AC = (window.AudioContext || window.webkitAudioContext).prototype;
    const mkGain = AC.createGain;
    AC.createGain = function (...a) {
      const g = mkGain.apply(this, a);
      window.__gain = g;
      return g;
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (when, ...rest) {
      window.__scheduled++;
      window.__lastWhen = when;      // how far ahead of the clock the queue runs
      // capture a few buffers from a few seconds in, past the opening fade
      if (window.__cap.length < 6 && when > 8 && this.buffer) {
        window.__cap.push([
          [...this.buffer.getChannelData(0)],
          [...this.buffer.getChannelData(1)],
        ]);
      }
      return start.call(this, when, ...rest);
    };
  })()`,
});
await t.send("Page.navigate", {
  url: "file:///" + path.resolve("dist/bundle.html").split(path.sep).join("/"),
});
await t.sleep(1500);
// a real gesture is not needed headless (--autoplay-policy=no-user-gesture-required),
// but the game only starts the music on one, so dispatch it
await t.evalJs(`document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
await t.sleep(1800);

// --- the music plays during the GAME, not over the title screen -------------
const count = () => t.evalJs(`window.__scheduled`);
const onTitle = await count();
console.log(`title screen, ${1.8}s after a gesture: ${onTitle} buffer(s) scheduled` +
  (onTitle === 0 ? "  — silent, as intended" : "  — SHOULD BE SILENT"));

const enterGame = () =>
  t.evalJs(`[...document.querySelectorAll('#menu button')].find(b => /^(Continue|New game)$/.test(b.textContent)).click()`);
await enterGame();
await t.sleep(9000);
const inGame = await count();
console.log(`after Continue: ${inGame} buffer(s) scheduled — playing`);

const r = JSON.parse(await t.evalJs(`JSON.stringify({
  scheduled: window.__scheduled,
  blocks: window.__cap.length,
  gain: window.__gain ? window.__gain.gain.value : null,
  rate: window.__cap.length ? 1 : 0,
  samples: window.__cap.flatMap(b => b[0].concat(b[1])),
})`));

const s = r.samples || [];
let peak = 0, sum = 0, nan = 0;
for (const v of s) {
  if (!isFinite(v)) { nan++; continue; }
  peak = Math.max(peak, Math.abs(v));
  sum += v * v;
}
const rms = Math.sqrt(sum / (s.length || 1));
console.log(`${r.scheduled} buffer(s) scheduled, ${r.blocks} captured, ${s.length} samples`);
console.log(`bus gain ${r.gain}  |  raw peak ${peak.toFixed(4)}  rms ${rms.toFixed(4)}  non-finite ${nan}`);
console.log(`after the bus: peak ${(peak * r.gain).toFixed(4)}  rms ${(rms * r.gain).toFixed(4)}`);

// The buffers hold the engine's own level — the bus applies VOL — so raw peak
// runs up to about 1.22 where the arrangement is densest, and must stay under
// 1/VOL to leave the output unclipped.
const level = s.length > 0 && !nan && rms > 0.01 && peak * r.gain <= 1;
console.log(level ? "ok   the page is generating audio at a sane level" : "FAIL no usable audio from the page");

// --- does a stalled main thread still glitch? -------------------------------
// The whole point of rendering ahead: the audio thread plays what is queued, so
// the main thread can be blocked (a slow frame, a GC, a phone with the screen
// off throttling timers) and the sound continues as long as the queue holds. A
// 1.5s block against a 2.5s lead should leave the queue still ahead of the
// clock — under the old ScriptProcessor that same block was 1.5s of silence.
const lead = () =>
  t.evalJs(`(() => {
    const c = window.__gain ? window.__gain.context : null;
    return c ? +(window.__lastWhen - c.currentTime).toFixed(2) : -1;
  })()`);
const before = await lead();
await t.evalJs(`(() => { const end = Date.now() + 1500; while (Date.now() < end); return 1; })()`);
const after = await lead();
console.log(`queue ahead of the clock: ${before}s before a 1.5s main-thread block, ${after}s after`);
console.log(after > 0 ? "ok   the queue outlived the stall — no dropout"
                      : "FAIL the queue drained during the stall");

// --- the pause menu stops it, and coming back resumes -----------------------
await t.evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
await t.sleep(700);
const atMenu = await count();
await t.sleep(1500);
const stillMenu = await count();
await enterGame();
await t.sleep(1500);
const backIn = await count();
console.log(`menu: ${atMenu} -> ${stillMenu} a second and a half later -> ${backIn} back in the game`);
const gate = onTitle === 0 && inGame > 0 && stillMenu === atMenu && backIn > stillMenu;
console.log(gate ? "ok   music runs with the game and stops with the menu"
                 : "FAIL the music is not following the game's phase");

// --- and that M actually stops it -------------------------------------------
// Muting silences the bus AND stops the pump, so nothing new is scheduled: the
// counter freezing is the observable form of "no sound, and no CPU either".
const gain = () => t.evalJs(`window.__gain ? window.__gain.gain.value : -1`);
const press = () => t.evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }))`);
await press();
await t.sleep(600);
const atMute = await count();
const mutedGain = await gain();
await t.sleep(1500);
const stillMuted = await count();
await press();
await t.sleep(1500);
const afterUnmute = await count();
t.close();

console.log(`scheduled: ${atMute} at mute -> ${stillMuted} a second later -> ${afterUnmute} after unmute`);
console.log(`bus gain while muted: ${mutedGain}`);
const mute = stillMuted === atMute && afterUnmute > stillMuted && mutedGain === 0;
const survived = after > 0;
console.log(mute ? "ok   M stops the pump and silences the bus, and unmuting resumes it"
                 : "FAIL mute did not stop (or unmute did not restart) the rendering");

if (!level || !mute || !survived || !gate) process.exitCode = 1;
