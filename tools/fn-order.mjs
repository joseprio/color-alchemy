// Reorder the chunk's top-level function declarations into a fitted order.
// Ported from galaxy-raid (OPTIMIZATIONS.md #134), where it is one pass of
// paver.mjs; this project has no paver, so the pass and its two helpers live
// here on their own and rollup.config.mjs calls them directly.
//
// THE FINDING IS THAT THERE IS NO RULE. Every rule-based ordering galaxy-raid
// measured LOST — similarity clustering by 6-gram Jaccard cost it 50 bytes,
// reverse 51, size-sorted 71 and 78, lexical 81. "Put similar functions next
// to each other" is the pass anyone would write first and it is one of the
// worst. Compiler emission order already groups mutual callers and shared
// vocabulary; a text-similarity metric happily breaks that up to chase
// superficial token overlap. So this ships as a SEARCHED ARTIFACT — a stored
// permutation in fn-order.json, exactly as rr-config.json stores searched
// packer params — and tools/find-fn-order.mjs is what produces it.
//
// A permutation cannot change the chunk's length. It changes only how well
// roadroller's context model predicts it, which is why the payoff shows up in
// the packed size and not before it.
import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import * as espree from "espree";

const PARSE_OPTS = { ecmaVersion: 2021, range: true, sourceType: "script" };

// Short, stable identity for a function declaration: the hash of its exact
// text. NOT its name and NOT its index — see reorderFunctions for why both are
// unsafe.
export const fnHash = (text) =>
  createHash("sha256").update(text).digest("hex").slice(0, 12);

// The top-level function declarations, which are the only reorderable material
// in the chunk. Returns null when the set cannot be permuted safely.
export function reorderableFunctions(code) {
  const ast = espree.parse(code, PARSE_OPTS);
  const decls = ast.body.filter((n) => n.type === "FunctionDeclaration");
  if (decls.length < 2) return null;
  const names = decls.map((n) => n.id.name);
  // Duplicate names would make "last declaration wins" observable, so permuting
  // them would change which body survives. Hoisting makes every other
  // permutation safe: all of them are defined before any top-level statement
  // runs, whatever the textual order, and non-function statements never move.
  if (new Set(names).size !== names.length) return null;
  return decls.map((n) => ({ range: n.range, text: code.slice(n.range[0], n.range[1]) }));
}

// Rewrite the chunk with its top-level functions in the order stored in
// fn-order.json.
//
// The stored order is a list of TEXT HASHES, which is the whole safety story:
//   - by index would silently apply a WRONG permutation to a changed chunk, and
//     the result still parses and still runs, so nothing would catch it;
//   - by name is no better, since every name is one minified letter that moves
//     on any source edit.
// A hash mismatch means the chunk is not the one the order was fitted to, and
// the pass declines rather than guessing. A stale order costs bytes; a
// misapplied one costs bytes AND hides.
//
// Absolute order also makes this idempotent, which is what lets the search run
// on dist/pre-roadroller.js — a chunk this pass has already reordered.
export function reorderFunctions(code, log = () => {}) {
  if (!existsSync("fn-order.json")) return code;
  const { order } = JSON.parse(readFileSync("fn-order.json", "utf8"));
  const fns = reorderableFunctions(code);
  if (!fns) return code;

  // Pool the bodies by hash: identical texts are interchangeable, so duplicates
  // are fine as long as the multiset matches.
  const pool = new Map();
  for (const f of fns) {
    const h = fnHash(f.text);
    if (!pool.has(h)) pool.set(h, []);
    pool.get(h).push(f.text);
  }
  const wanted = new Map();
  for (const h of order) wanted.set(h, (wanted.get(h) || 0) + 1);
  const same =
    order.length === fns.length &&
    [...wanted].every(([h, n]) => (pool.get(h) || []).length === n);
  if (!same) {
    // console.warn, not the optional log: silently shipping the unordered chunk
    // is a regression that nothing else in the build reports.
    console.warn(
      `fn-order: fn-order.json does not match this chunk (${order.length} stored, ${fns.length} found) — NOT reordering.\n` +
      `          re-fit with: npm run fn-order-optimize`
    );
    return code;
  }

  let out = "", prev = 0;
  fns.forEach((f, i) => {
    out += code.slice(prev, f.range[0]) + pool.get(order[i]).pop();
    prev = f.range[1];
  });
  out += code.slice(prev);

  if (out.length !== code.length) throw new Error("reorderFunctions: not a permutation");
  espree.parse(out, PARSE_OPTS); // fail loudly on a broken transform
  log(`fn-order: ${fns.length} declarations placed in the fitted order`);
  return out;
}
