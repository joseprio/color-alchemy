// Searches for a top-level function order that packs smaller, and writes
// fn-order.json. Ported from galaxy-raid (OPTIMIZATIONS.md #134) and
// deliberately the same shape as find-rr-config.mjs, its companion: search,
// then A/B the candidate against the incumbent on the REAL zip, and only write
// when it strictly wins.
//
//   npm run fn-order-optimize [-- seconds] [--seed N] [--proposals N]
//     seconds      wall-clock budget, default 900. Do NOT shorten it casually:
//                  the climb does not converge quickly. Most of the win is in
//                  the first few hundred proposals, though, so a re-fit after a
//                  source change is cheap in practice — budget the long tail as
//                  insurance on the win, not as a hunt for more.
//     --seed       PRNG seed (default 1). The proposal SEQUENCE is fully
//                  determined by it.
//     --proposals  run exactly N proposals instead of a time budget. A time
//                  budget is machine-dependent, so a run is replayed by passing
//                  the seed it used and the proposal count it REPORTS, not by
//                  re-running the same seconds.
//
// BUILD FIRST: this searches dist/pre-roadroller.js and refuses if any src/
// file is newer, for the same reason the roadroller search does — a stale chunk
// fits an order to code that is no longer shipping. Then build again to apply
// what it wrote.
//
// The objective is the PACKED size (roadroller in-process, pinned params, no
// optimize() so it is deterministic). The winner is then re-checked on the real
// zip, because intermediate sizes are not evidence.
import { readFileSync, writeFileSync, copyFileSync, statSync, readdirSync, mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { Packer } from "roadroller";
import { reorderableFunctions, fnHash } from "./fn-order.mjs";

// Hand-rolled parse, but the value-consuming step is the point: `--seed 42`
// must not leave "42" looking like the positional seconds argument.
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = Number(argv[++i]);
  else positional.push(argv[i]);
}
for (const k of Object.keys(flags)) {
  if (!["seed", "proposals"].includes(k)) throw new Error(`unknown flag --${k}`);
  if (Number.isNaN(flags[k])) throw new Error(`--${k} needs a number`);
}
const SECONDS = Number(positional[0] ?? 900);
const SEED = flags.seed ?? 1;
const PROPOSALS = flags.proposals ?? null; // null = run to the time budget
const CHUNK = "dist/pre-roadroller.js";
const OUT = "fn-order.json";
const CANDIDATE_OUT = ".fn-order-candidate.json"; // crash/interrupt insurance

// ---- staleness guard ------------------------------------------------------
const chunkMtime = statSync(CHUNK).mtimeMs;
const newer = [];
const walkSrc = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkSrc(p);
    else if (statSync(p).mtimeMs > chunkMtime) newer.push(p);
  }
};
walkSrc("src");
if (newer.length) {
  console.error(`${CHUNK} is older than ${newer.length} src file(s), e.g. ${newer[0]}`);
  console.error("Run `npm run build` first — searching a stale chunk fits an order to code that is not shipping.");
  process.exit(1);
}

const src = readFileSync(CHUNK, "utf8");
const fns = reorderableFunctions(src);
if (!fns) {
  console.error("chunk has no safely reorderable function set (duplicate names, or fewer than 2)");
  process.exit(1);
}
const bodies = fns.map((f) => f.text);
const N = bodies.length;

const { _fittedTo, ...pinned } = JSON.parse(readFileSync("rr-config.json", "utf8"));
const render = (order) => {
  let out = "", prev = 0;
  fns.forEach((f, i) => { out += src.slice(prev, f.range[0]) + bodies[order[i]]; prev = f.range[1]; });
  return out + src.slice(prev);
};
const packedSize = (order) => {
  const data = render(order);
  const d = new Packer([{ data, type: "js", action: "eval" }], pinned).makeDecoder();
  return d.firstLine.length + d.secondLine.length;
};

// The zip A/B runs the SHIPPING pipeline rather than a copy of it: the packed
// chunk is written to dist/bundle.js and postbuild.mjs does the inline, the
// minify and the deterministic zip exactly as a real build would. galaxy-raid
// keeps a parallel harness (tools/pack-pinned.mjs) that has to be held in step
// with postbuild by hand; reusing postbuild here means these numbers cannot
// drift from the build's numbers, because they ARE the build's numbers.
const BUNDLE = "dist/bundle.js";
const SAVED = ".fn-order-bundle-backup.js";
const zipOf = (order) => {
  const data = render(order);
  const d = new Packer([{ data, type: "js", action: "eval" }], pinned).makeDecoder();
  writeFileSync(BUNDLE, d.firstLine + d.secondLine);
  execFileSync("node", ["postbuild.mjs"], { stdio: "pipe" });
  return statSync("dist/build.zip").size;
};

// ---- hill climb -----------------------------------------------------------
let s = SEED;
const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

const incumbent = bodies.map((_, i) => i); // the chunk as it stands
let best = incumbent.slice();
let bestScore = packedSize(best);
const start = bestScore;
const budget = PROPOSALS === null ? `${SECONDS}s` : `${PROPOSALS} proposals`;
console.log(`searching ${N} functions, ${budget}, seed ${SEED}; incumbent packs to ${start}`);
const deadline = Date.now() + SECONDS * 1000;
const done = (it) => (PROPOSALS === null ? Date.now() >= deadline : it >= PROPOSALS);

let it = 0;
for (; !done(it); it++) {
  const cand = best.slice();
  if (rnd() < 0.5) {
    const i = (rnd() * N) | 0, j = (rnd() * N) | 0;
    [cand[i], cand[j]] = [cand[j], cand[i]];
  } else {
    const [x] = cand.splice((rnd() * N) | 0, 1);
    cand.splice((rnd() * N) | 0, 0, x);
  }
  const score = packedSize(cand);
  if (score < bestScore) {
    bestScore = score;
    best = cand;
    console.log(`  it ${it}: packed ${score} (${score - start})`);
    // Checkpoint EVERY improvement: this runs for many minutes and the winner
    // would otherwise live only in memory until the zip A/B at the very end.
    // Not the shipping artifact — that is still only written after the A/B.
    writeFileSync(CANDIDATE_OUT, JSON.stringify({
      note: "crash/interrupt checkpoint — NOT validated against the real zip",
      packed: score, proposals: it, seed: SEED,
      order: best.map((i) => fnHash(bodies[i])),
    }, null, 2) + "\n");
  }
}

// Report the count so a time-budgeted run can be replayed exactly:
// `npm run fn-order-optimize -- --seed <seed> --proposals <it>`.
console.log(`\n${it} proposals evaluated (seed ${SEED})`);

if (bestScore >= start) {
  console.log(`no improvement over the incumbent order (${start}); ${OUT} left alone`);
  process.exit(0);
}

// ---- A/B on the real zip, and only then write -----------------------------
copyFileSync(BUNDLE, SAVED);
let zipIncumbent, zipBest;
try {
  zipIncumbent = zipOf(incumbent);
  zipBest = zipOf(best);
} finally {
  // Put the real build's artifacts back; the run ends with a rebuild anyway,
  // but leaving dist holding a measurement probe would be a trap.
  copyFileSync(SAVED, BUNDLE);
  execFileSync("node", ["postbuild.mjs"], { stdio: "pipe" });
  rmSync(SAVED, { force: true });
}
console.log(`\npacked ${start} -> ${bestScore}; zip ${zipIncumbent} -> ${zipBest}`);
if (zipBest >= zipIncumbent) {
  console.log(`the searched order packs smaller but zips no better — ${OUT} left alone`);
  console.log("(intermediate sizes are not evidence: only the zip ships)");
  process.exit(0);
}

writeFileSync(OUT, JSON.stringify({
  _fittedTo: { chunk: CHUNK, chars: src.length, functions: N, zip: zipBest, when: new Date().toISOString().slice(0, 10) },
  order: best.map((i) => fnHash(bodies[i])),
}, null, 2) + "\n");
rmSync(CANDIDATE_OUT, { force: true });
console.log(`wrote ${OUT} (${zipBest - zipIncumbent} zip). Run \`npm run build\` to apply it.`);
