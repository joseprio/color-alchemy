// The whole save file: ONE localStorage entry holding one array, with each
// section at a fixed index. game.ts owns slots 0-4 (tree, run, bests, codex)
// and sfx.ts owns slot 5 (mute) — it lives here rather than in either of them
// because game.ts already imports sfx.ts, so the other direction would cycle.
const K = "colorAlchemy";
export const cell: any[] = [];
try { (JSON.parse(localStorage.getItem(K) || "[]") || []).map((v: unknown, i: number) => (cell[i] = v)); } catch {}
export function put(i: number, v: unknown): void {
  cell[i] = v;
  try { localStorage.setItem(K, JSON.stringify(cell)); } catch {}
}
