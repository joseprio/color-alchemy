// The whole save file: ONE localStorage entry holding one array, with each
// section at a fixed index. game.ts owns slots 0-4 (tree, run, bests, codex)
// and sfx.ts owns slot 5 (mute) — it lives here rather than in either of them
// because game.ts already imports sfx.ts, so the other direction would cycle.
const K = "colorAlchemy";
export const cell: any[] = [];
// NO try/catch ON THE READ, deliberately, and it is worth knowing exactly what
// that trades because the failure is total rather than partial.
//
// Three things can throw here. `localStorage` throws a SecurityError on the
// PROPERTY ACCESS when storage is blocked — an iframe under third-party-cookie
// blocking, cookies disabled, some file:// configurations — before getItem is
// reached, so no `||` can guard it. JSON.parse throws on corrupt text. And
// valid JSON that is not an array ({}, "x", 5) passes the `|| []` and then has
// no .map. Measured with storage made to throw: WITH a catch the game boots
// normally and simply never saves (3 menu buttons, title screen up); WITHOUT
// one this module throws during evaluation, boot() never runs, and the page
// shows its static markup and nothing else.
//
// Taken anyway, at 13 B: a run that cannot be resumed and a codex that cannot
// accumulate is most of this game's point gone, so the degraded mode being
// rescued is not worth much. The whole of a single sitting still works in it,
// which is the part of the argument against — recorded here rather than lost.
// If the game is ever embedded somewhere it cannot reach storage, this line is
// the first thing to put back.
(JSON.parse(localStorage.getItem(K) || "[]") || []).map((v: unknown, i: number) => (cell[i] = v));
export function put(i: number, v: unknown): void {
  cell[i] = v;
  try { localStorage.setItem(K, JSON.stringify(cell)); } catch {}
}
