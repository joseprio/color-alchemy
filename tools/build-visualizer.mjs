// Regenerates the engine half of the visualizer experiments.
//
// A visualizer has to run against the REAL music, not a stand-in, so this
// compiles src/music.ts and splices the compiled engine into each experiment
// page between its two markers. Only `sampler` is wanted — the playback half of
// the module talks to src/sfx.ts and to a live AudioContext — so the import is
// stubbed and everything from the playback section on is dropped.
//
// TWO pages carry the engine now, the canvas one and the GL one, and they get
// the same splice from the same compile: an option that looks better only
// because it is running a different song is not evidence.
//
// Run it after changing src/music.ts:  node tools/build-visualizer.mjs
// Name a page to splice only that one:
//   node tools/build-visualizer.mjs experiments/visualizer-gl.html
import { execFileSync } from "child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

const OUTS = process.argv.length > 2
  ? process.argv.slice(2)
  : ["experiments/visualizer.html", "experiments/visualizer-gl.html"];
const START = "/* === engine: generated from src/music.ts by tools/build-visualizer.mjs === */";
const END = "/* === end engine === */";

const dir = mkdtempSync(path.join(tmpdir(), "ca-viz-"));
writeFileSync(path.join(dir, "package.json"), '{"type":"commonjs"}');
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "src/music.ts", "src/sfx.ts",
  "--outDir", dir, "--module", "commonjs", "--target", "es2020", "--skipLibCheck", "--lib", "es2020,dom"],
  { stdio: "inherit" });

let js = readFileSync(path.join(dir, "music.js"), "utf8");
rmSync(dir, { recursive: true, force: true });

// keep everything up to the playback section, which is the part that needs sfx
const cut = js.indexOf("/* ------------------------------------------------------------------ playback */");
if (cut < 0) throw new Error("playback marker missing from the compiled music.js");
js = js.slice(0, cut);
// drop the CommonJS preamble and the sfx import; export nothing, since the page
// pulls `sampler` straight out of the surrounding scope
js = js.replace(/^"use strict";[\s\S]*?const sfx_1 = require\("\.\/sfx"\);\n/, "");
js = js.replace(/^Object\.defineProperty[^\n]*\n/gm, "");
js = js.replace(/^exports\.[^\n]*\n/gm, "");
js = js.replace(/^function sampler/m, "function sampler");

for (const out of OUTS) {
  const page = readFileSync(out, "utf8");
  const a = page.indexOf(START), b = page.indexOf(END);
  if (a < 0 || b < 0) throw new Error(`markers missing from ${out}`);
  writeFileSync(out, page.slice(0, a + START.length) + "\n" + js.trim() + "\n" + page.slice(b));
  console.log(`spliced ${(js.length / 1024).toFixed(1)}KB of engine into ${out}`);
}
