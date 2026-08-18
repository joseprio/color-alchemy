// Does the packed bundle actually make the sound the engine tests prove?
//
// The equivalence test in the scratchpad compares src/music.ts against the
// original floatbeat sample for sample, but that runs the TypeScript in node.
// This runs the SHIPPED page: it wraps createScriptProcessor before the bundle
// loads, captures what the game's own audio callback writes, and reports level.
// Silence, NaN or clipping here means the wiring or the closure pass broke
// something the node test cannot see.
// usage: node tools/music-probe.mjs   (npm run music-check)
import { launch } from "../cdp.mjs";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const blank = path.join(tmpdir(), "color-alchemy-blank.html");
writeFileSync(blank, "<!doctype html><title>blank</title>");

const t = await launch({ url: blank });
await t.send("Page.enable");
// installed before the bundle parses, so the wrap is in place when it calls
await t.send("Page.addScriptToEvaluateOnNewDocument", {
  // Everything is scoped inside the arrow: a `const` at the top level of a
  // document-start script is a global lexical binding, and the bundle declares
  // short names of its own — one collision is a SyntaxError that stops the
  // whole game from loading (which is exactly what happened first time).
  //
  // The handler has to be installed through the REAL onaudioprocess setter:
  // Chrome only pulls audio through the node when that property is assigned, so
  // an addEventListener('audioprocess') wrapper captures nothing.
  source: `(() => {
    window.__cap = [];
    window.__blocks = 0;
    const P = (window.AudioContext || window.webkitAudioContext).prototype;
    const make = P.createScriptProcessor;
    const desc = Object.getOwnPropertyDescriptor(ScriptProcessorNode.prototype, 'onaudioprocess');
    P.createScriptProcessor = function (...args) {
      const node = make.apply(this, args);
      Object.defineProperty(node, 'onaudioprocess', {
        set(fn) {
          desc.set.call(node, (e) => {
            fn(e);
            window.__blocks++;
            if (window.__cap.length < 8 && e.playbackTime > 8) {
              const l = e.outputBuffer.getChannelData(0), r = e.outputBuffer.getChannelData(1);
              window.__cap.push([[...l].slice(0, 2048), [...r].slice(0, 2048)]);
            }
          });
        },
        get() { return desc.get.call(node); },
      });
      return node;
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
await t.sleep(11000);   // capture a window ~8s in, past the opening fade-in

const r = JSON.parse(await t.evalJs(`JSON.stringify({
  blocks: window.__cap.length,
  rate: (window.AudioContext ? 1 : 0),
  ctx: window.__cap.length ? 1 : 0,
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
console.log(`captured ${r.blocks} callback block(s), ${s.length} samples`);
console.log(`peak ${peak.toFixed(4)}  rms ${rms.toFixed(4)}  non-finite ${nan}`);

// The tune's own level is peak ~0.73 / rms ~0.11, scaled by the 0.4 the player
// applies, so a window past the opening fade-in should land near rms 0.04.
const level = s.length > 0 && !nan && rms > 0.005 && peak <= 1;
console.log(level ? "ok   the page is generating audio at a sane level" : "FAIL no usable audio from the page");

// --- and that M actually stops it ------------------------------------------
// Mute disconnects the node, so the callback stops being pulled entirely: the
// block counter freezing is the observable form of "no sound", and it also
// shows muting costs no CPU. Unmuting has to start it moving again.
const blocks = () => t.evalJs(`window.__blocks`);
const press = () => t.evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }))`);
await press();
await t.sleep(400);
const atMute = await blocks();
await t.sleep(1200);
const stillMuted = await blocks();
await press();
await t.sleep(1200);
const afterUnmute = await blocks();
t.close();

console.log(`blocks: ${atMute} at mute -> ${stillMuted} a second later -> ${afterUnmute} after unmute`);
const mute = stillMuted === atMute && afterUnmute > stillMuted;
console.log(mute ? "ok   M silences the node and unmutes it again" : "FAIL mute did not stop (or unmute did not restart) the audio");

if (!level || !mute) process.exitCode = 1;
