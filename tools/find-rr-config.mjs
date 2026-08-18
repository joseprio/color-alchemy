// Search roadroller parameters for the current chunk and pin the winner in
// rr-config.json, which is what makes the packed build byte-deterministic.
//
//   npm run roadroller-optimize [-- --force]
//
// Build first: this fits against dist/pre-roadroller.js (written by the
// snapshotChunk plugin) and refuses a snapshot older than src/, because params
// fitted to a chunk that no longer exists cost bytes silently — the build still
// succeeds, just worse than it should.
//
// Unlike galaxy-raid's version this searches in-process rather than driving the
// CLI and parsing its log: the fork's optimize() returns its winning params
// directly, so every option it decides to enable (matchModel, wordModel, sse,
// the mixer knobs) lands in the config without a parser that has to be kept in
// step with the option list.
//
// The search is stochastic, so a re-fit is NOT automatically an improvement.
// The candidate replaces the incumbent only if it actually packs this chunk
// smaller; --force writes it regardless.
import { Packer } from "roadroller";
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from "fs";
import { createHash } from "crypto";

const CHUNK = "dist/pre-roadroller.js";
const OUT = "rr-config.json";
const force = process.argv.includes("--force");

// Must stay identical to rollup.config.mjs's copy, or every build reports stale.
const chunkHash = (s) => createHash("sha256").update(s, "utf8").digest("hex").slice(0, 12);

if (!existsSync(CHUNK)) throw new Error(`${CHUNK} missing — run \`npm run build\` first`);
const chunkTime = statSync(CHUNK).mtimeMs;
const stale = readdirSync("src", { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => `${e.parentPath ?? e.path}/${e.name}`)
  .filter((f) => statSync(f).mtimeMs > chunkTime);
if (stale.length) {
  throw new Error(
    `${CHUNK} is older than ${stale.length} source file(s) — run \`npm run build\` first.\n` +
    `  newest: ${stale.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0]}`
  );
}

const data = readFileSync(CHUNK, "utf8");
const hash = chunkHash(data);
const inputs = () => [{ data, type: "js", action: "eval" }];
// maxMemoryMB must match rollup.config.mjs: params fitted under a different
// decoder memory budget are not the params we ship.
const BASE = { maxMemoryMB: 150, allowFreeVars: true };

// Packed length is the honest metric here: roadroller output is already
// high-entropy, so what ECT and advzip do to it downstream is near-constant.
const packedSize = (options) => {
  const decoder = new Packer(inputs(), options).makeDecoder();
  return Buffer.byteLength(decoder.firstLine + decoder.secondLine, "utf8");
};

console.log(`fitting against ${CHUNK} (${Buffer.byteLength(data)} bytes, ${hash})`);
const packer = new Packer(inputs(), BASE);
const started = Date.now();
const { best, bestSize } = await packer.optimize(2);
const candidate = { ...BASE, ...best };
console.log(`searched ${Math.round((Date.now() - started) / 1000)}s — estimate ${bestSize} bytes`);

const candidateSize = packedSize(candidate);
let incumbent = null;
if (existsSync(OUT)) {
  const { _fittedTo, ...opts } = JSON.parse(readFileSync(OUT, "utf8"));
  incumbent = opts;
}
const incumbentSize = incumbent ? packedSize(incumbent) : Infinity;
console.log(`candidate ${candidateSize} B  vs incumbent ${incumbent ? incumbentSize + " B" : "(none)"}`);

if (!force && incumbent && incumbentSize <= candidateSize) {
  // The incumbent won a direct measurement ON THIS CHUNK, so it is the best
  // config known for this code even though it was searched against different
  // code. Re-stamp it: _fittedTo is what the build reads to decide whether the
  // params match what it is packing, and leaving a stale stamp on a config we
  // just validated would print STALE on every build and train everyone to
  // ignore the one warning that catches genuinely unfitted params.
  writeFileSync(OUT, JSON.stringify({ ...incumbent, _fittedTo: { hash, bytes: Buffer.byteLength(data) } }, null, 2) + "\n");
  console.log(
    `keeping the incumbent — it packs this chunk ${incumbentSize - candidateSize} B better than the new search\n` +
    `re-stamped ${OUT} for this chunk (pass --force to take the searched config anyway)`
  );
  process.exit(0);
}
writeFileSync(OUT, JSON.stringify({ ...candidate, _fittedTo: { hash, bytes: Buffer.byteLength(data) } }, null, 2) + "\n");
console.log(`wrote ${OUT} — builds are now deterministic against this chunk`);
