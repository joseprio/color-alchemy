// What does a second of music cost, and how much of the audio callback's
// budget is that?
//
// The music runs on a ScriptProcessorNode, which calls back on the MAIN thread:
// whatever this costs is time the page is not drawing, and if a callback misses
// its deadline the output glitches. This compiles src/music.ts as it stands and
// measures it, then scales the answer to the phones that actually struggle.
//
// usage: node tools/audio-bench.mjs   (npm run audio-bench)
import { execFileSync } from "child_process";
import { createRequire } from "module";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const dir = mkdtempSync(path.join(tmpdir(), "ca-bench-"));
writeFileSync(path.join(dir, "package.json"), '{"type":"commonjs"}');
// tsc through this same node binary: the .bin shim is a .cmd on Windows, which
// execFile cannot spawn without a shell, and a shell here would need escaping
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "src/music.ts", "src/sfx.ts", "--outDir", dir,
  "--module", "commonjs", "--target", "es2020", "--skipLibCheck", "--lib", "es2020,dom"],
  { stdio: "inherit" });

const { sampler } = createRequire(import.meta.url)(path.join(dir, "music.js"));

const SR = 24000;                      // the rate the engine runs at

// The opening is the cheapest part of the song — one pad voice and the reverb —
// and it is the part a naive benchmark measures, because it starts at sample 0.
// What has to fit the callback deadline is the densest part: pattern 4, about
// 160s in, where the pad, the bass and two pulse voices all play and the second
// delay is live. Both are reported; the second one is the budget that matters.
const measure = (skipSeconds) => {
  const next = sampler(SR);
  for (let i = 0; i < skipSeconds * SR; i++) next();      // fast-forward, and warm the JIT
  for (let i = 0; i < 60000; i++) next();
  const n = 400000;
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < n; i++) next();
  return Number(process.hrtime.bigint() - t0) / n;
};

const sparse = measure(0);
const ns = measure(160);               // the dense stretch, and the number to size against
rmSync(dir, { recursive: true, force: true });

console.log(`\nopening (pad + reverb):  ${sparse.toFixed(0)} ns per sample`);
console.log(`densest part of the song: ${ns.toFixed(0)} ns per sample` +
  `  — ${((ns / (1e9 / SR)) * 100).toFixed(1)}% of one core on this machine\n`);
// The music renders ahead: a 200ms timer fills quarter-second buffers and keeps
// ~2.5s scheduled. So the question is not "does a callback meet its deadline"
// (there is no deadline any more) but "does a chunk render in well under the
// tick, and how much of the main thread does that take".
const CHUNK = 0.25, TICK = 200, LEAD = 2.5;
const frames = CHUNK * SR;
console.log(`         machine   chunk render   share of the 200ms tick   CPU`);
for (const slower of [1, 4, 6, 8, 16]) {
  const work = (frames * ns * slower) / 1e6;
  const share = (work / TICK) * 100;
  console.log(
    `${(slower === 1 ? "this machine" : slower + "x slower").padStart(16)}` +
    `${(work.toFixed(1) + "ms").padStart(15)}` +
    `${(share.toFixed(0) + "%").padStart(26)}` +
    `${((ns * slower * SR) / 1e7).toFixed(1).padStart(6)}%` +
    (work > TICK ? "  cannot keep up" : work > LEAD * 1000 ? "  would drain the lead" : "")
  );
}
console.log(`
A chunk is ${CHUNK}s of audio rendered inside a ${TICK}ms tick, with ${LEAD}s kept queued —
so a late or throttled tick costs nothing until the queue drains. The old
ScriptProcessorNode had to finish inside every callback, on the main thread,
which is what glitched when a phone's screen went off.`);
