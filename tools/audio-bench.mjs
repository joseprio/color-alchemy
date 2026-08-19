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
const next = sampler(SR);
for (let i = 0; i < 60000; i++) next();   // warm up the JIT
const n = 600000;
const t0 = process.hrtime.bigint();
for (let i = 0; i < n; i++) next();
const ns = Number(process.hrtime.bigint() - t0) / n;
rmSync(dir, { recursive: true, force: true });

console.log(`\n${ns.toFixed(0)} ns per sample — ${((ns / (1e9 / SR)) * 100).toFixed(1)}% of one core on this machine\n`);
console.log("      buffer   engine work   callback budget   share");
for (const size of [4096, 16384]) {
  for (const slower of [1, 4, 6, 8]) {
    const work = ((size / 2) * ns * slower) / 1e6;     // engine runs at half the output rate
    const budget = (size / 48000) * 1000;
    const share = (work / budget) * 100;
    console.log(
      `${(slower === 1 ? "this machine" : slower + "x slower").padStart(14)}` +
      `${String(size).padStart(8)}` +
      `${(work.toFixed(1) + "ms").padStart(14)}` +
      `${(budget.toFixed(1) + "ms").padStart(18)}` +
      `${(share.toFixed(0) + "%").padStart(8)}` +
      (share > 100 ? "  UNDERRUN — this would glitch" : share > 50 ? "  tight" : "")
    );
  }
}
console.log(`
A share of 100% means the callback takes as long as the audio it produces, so
anything else on the main thread pushes it over. Under about 20% there is room
for the game, a GC pause and a slow phone at the same time.`);
