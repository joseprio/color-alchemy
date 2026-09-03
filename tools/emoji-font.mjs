// Builds the director's cut a COLRv1 emoji font from Noto's own source SVGs —
// exactly the 245 sequences this table shows, and nothing else.
//
// WHY THIS EXISTS. tools/fonts.mjs used to take nine of Google's ten CDN chunks
// of Noto Color Emoji, 1317 KB, because a unicode-range chunk was the smallest
// unit the CDN would sell and a real subset meant "a new toolchain in a project
// whose build is Node and nothing else". This is 237 KB of the same artwork.
//
// THE ROAD NOT TAKEN, and it is worth writing down because it looked certain.
// harfbuzzjs ships harfbuzz-subset.wasm — no Python, no native build — and
// subsetting Noto-COLRv1.ttf with it produces a 216 KB woff2 whose 245
// sequences all shape to one glyph. It renders NOTHING. That build of harfbuzz
// has no colour-table support: it drops COLR and CPAL (and CBDT/CBLC from the
// bitmap build, 10.18 MB -> 5 KB), leaving structurally valid glyphs with no
// paint. subset-font bundles the same harfbuzzjs and fails identically.
// Passing COLR through untouched cannot work either — the layer glyphs it
// references have no cmap entry, so they are dropped, and the glyph ids are
// remapped underneath it.
// The lesson is in the acceptance test below: SHAPING IS NOT RENDERING. The
// broken subset passed a shaping check. Only looking at pixels caught it.
//
// THE TOOLCHAIN IS PYTHON, which is the cost of doing this properly: nanoemoji
// is googlefonts' own tool and what noto-emoji itself is built with. It also
// needs ninja, which it drives the build through, and both land in pip's
// scripts directory — which is routinely NOT on PATH, and whose absence shows
// up as a bare `WinError 2` from deep inside a subprocess call. Both are
// located explicitly below rather than assumed.
//
// A MISSING TOOLCHAIN IS NOT FATAL. The cut still builds without Python: it
// falls back to the CDN chunks, loudly. What would be fatal is shipping a cut
// whose emoji are silently blank, which is why the shaping check throws.
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { createHash } from "crypto";
import { join, delimiter } from "path";
import { fetchEmojiSvgs } from "./emoji-svg.mjs";

const CACHE = ".fonts";

// pip's console scripts, which are what `nanoemoji` and `ninja` actually are.
// Asked of Python rather than guessed, and both the user and the base install
// are checked — a --user install and a system one land in different places.
function scriptDirs() {
  try {
    const out = execFileSync(
      "python",
      ["-c", "import sysconfig,os,json;print(json.dumps([sysconfig.get_path('scripts'),sysconfig.get_path('scripts',os.name+'_user')]))"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    return JSON.parse(out).filter(Boolean);
  } catch {
    return [];
  }
}

const exeIn = (dir, name) =>
  [name, `${name}.exe`].map((n) => join(dir, n)).find((p) => existsSync(p));

// Returns { nanoemoji, env } or null when the toolchain is not installed.
export function findNanoemoji() {
  const dirs = scriptDirs();
  for (const d of dirs) {
    const nano = exeIn(d, "nanoemoji");
    if (nano) {
      // ninja has to be findable BY nanoemoji, which spawns it, so the scripts
      // directory goes on the child's PATH whether or not it is on ours.
      return { nanoemoji: nano, env: { ...process.env, PATH: dirs.join(delimiter) + delimiter + process.env.PATH } };
    }
  }
  return null;
}

// The cache key is the SET OF SEQUENCES, not the file contents: add an element
// with a new emoji and the key changes and the font rebuilds; re-run a build
// with the same table and nanoemoji is never invoked.
//
// RECIPE is what the sequences alone cannot say: the same set of pictures built
// by a different post-step is a different font. Bump it whenever what this file
// does to nanoemoji's output changes, or every machine with a warm .fonts/ cache
// keeps serving the previous shape of the font forever.
const RECIPE = "colr1+nospace";
const keyOf = (stems) =>
  createHash("sha256").update(RECIPE + "\n" + stems.sort().join(",")).digest("hex").slice(0, 12);

export async function buildEmojiFont({ elementsTs, uiTs, log = () => {} }) {
  const { seqs } = await fetchEmojiSvgs({ elementsTs, uiTs, log });
  const stems = [...seqs.keys()];
  const key = keyOf(stems);
  const woff2Path = join(CACHE, `emoji-${key}.woff2`);
  const name = `emoji-${key}.woff2`;

  if (existsSync(woff2Path)) {
    const woff2 = readFileSync(woff2Path);
    log(`emoji-font: cached ${name}, ${(woff2.length / 1024).toFixed(0)} KB`);
    return { woff2, name, seqs };
  }

  const tools = findNanoemoji();
  if (!tools) return null; // caller falls back to the CDN chunks

  const buildDir = join(CACHE, `nano-${key}`);
  mkdirSync(buildDir, { recursive: true });
  const svgs = readdirSync(join(CACHE, "svg"))
    .filter((f) => f.endsWith(".svg") && stems.includes(f.slice(7, -4)))
    .map((f) => join(CACHE, "svg", f));
  log(`emoji-font: nanoemoji over ${svgs.length} SVGs (a minute or so)`);
  execFileSync(
    tools.nanoemoji,
    ["--color_format", "glyf_colr_1", "--build_dir", buildDir, "--output_file", "emoji.ttf", ...svgs],
    { env: tools.env, stdio: ["ignore", "ignore", "pipe"] }
  );

  const ttf = unclaimSpace(readFileSync(join(buildDir, "emoji.ttf")), log);
  await verifyRendering(ttf, seqs, log);
  const { compress } = await import("wawoff2");
  const woff2 = Buffer.from(await compress(ttf));
  writeFileSync(woff2Path, woff2);
  log(`emoji-font: ${(ttf.length / 1024).toFixed(0)} KB ttf -> ${(woff2.length / 1024).toFixed(0)} KB woff2`);
  return { woff2, name, seqs };
}

// TAKE THE SPACE BACK OFF THE FONT, because a font that claims U+0020 cannot
// lead a font stack. nanoemoji gives every font it builds a `space` glyph and a
// cmap entry pointing at it — reasonable for a font meant to set text, wrong for
// a subset that exists to draw 265 pictures. style.css puts this family FIRST
// (the low emoji codepoints need it to beat the platform's monospace), so while
// U+0020 was in the cmap every space in the UI was set at the emoji advance:
// 17px against monospace's 7.69px at 14px. The hosted build read visibly airier
// than a local one, where the protocol-relative URL cannot load at all.
//
// NOT A RESUBSET. Harfbuzz cannot subset COLRv1 — that is the road not taken at
// the top of this file — and it does not need to here: what matters is the
// mapping, not the glyph. Pointing U+0020 at glyph 0 is how a cmap says "not
// covered", and a shaper that resolves a character to .notdef reports no
// coverage, so the browser falls through to the next family. Every table keeps
// its size, every other glyph id keeps its value, and COLR is never touched.
//
// nanoemoji puts the space in its own single-codepoint segment (format 4) and
// group (format 12), which is what makes this a two-byte and four-byte edit.
// If a future build folds it into a range this throws rather than guessing.
export function unclaimSpace(ttf, log = () => {}) {
  const buf = Buffer.from(ttf);
  const numTables = buf.readUInt16BE(4);
  let dirEntry = 0, cmapOff = 0, cmapLen = 0, headOff = 0;
  for (let i = 0; i < numTables; i++) {
    const p = 12 + i * 16, tag = buf.toString("ascii", p, p + 4);
    if (tag === "cmap") { dirEntry = p; cmapOff = buf.readUInt32BE(p + 8); cmapLen = buf.readUInt32BE(p + 12); }
    if (tag === "head") headOff = buf.readUInt32BE(p + 8);
  }
  if (!cmapOff || !headOff) throw new Error("emoji-font: no cmap/head table");

  const seen = new Set();
  let patched = 0;
  for (let i = 0; i < buf.readUInt16BE(cmapOff + 2); i++) {
    const sub = cmapOff + buf.readUInt32BE(cmapOff + 4 + i * 8 + 4);
    if (seen.has(sub)) continue;          // the four records share two subtables
    seen.add(sub);
    const fmt = buf.readUInt16BE(sub);
    if (fmt === 4) {
      const segX2 = buf.readUInt16BE(sub + 6);
      const ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const st = buf.readUInt16BE(starts + s * 2), en = buf.readUInt16BE(ends + s * 2);
        if (st > 0x20 || en < 0x20) continue;
        if (st !== 0x20 || en !== 0x20) throw new Error(`emoji-font: U+0020 shares a format 4 segment (U+${st.toString(16)}..U+${en.toString(16)})`);
        if (buf.readUInt16BE(ranges + s * 2) !== 0) throw new Error("emoji-font: U+0020 segment uses a glyphIdArray");
        buf.writeInt16BE(-0x20, deltas + s * 2);   // 0x20 + delta === 0
        patched++;
      }
    } else if (fmt === 12 || fmt === 13) {
      const groups = buf.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g++) {
        const p = sub + 16 + g * 12;
        const st = buf.readUInt32BE(p), en = buf.readUInt32BE(p + 4);
        if (st > 0x20 || en < 0x20) continue;
        if (st !== 0x20 || en !== 0x20) throw new Error(`emoji-font: U+0020 shares a format ${fmt} group (U+${st.toString(16)}..U+${en.toString(16)})`);
        buf.writeUInt32BE(0, p + 8);               // startGlyphID -> .notdef
        patched++;
      }
    }
  }
  if (!patched) throw new Error("emoji-font: no U+0020 mapping found — has nanoemoji stopped emitting one?");

  // A table's checksum is the sum of its UInt32BEs, and head carries a
  // checkSumAdjustment over the whole file that has to be redone with it.
  const sumOver = (start, len) => {
    let s = 0;
    for (let i = 0; i < len; i += 4) s = (s + buf.readUInt32BE(start + i)) >>> 0;
    return s >>> 0;
  };
  buf.writeUInt32BE(sumOver(cmapOff, (cmapLen + 3) & ~3), dirEntry + 4);
  buf.writeUInt32BE(0, headOff + 8);
  buf.writeUInt32BE((0xb1b0afba - sumOver(0, buf.length & ~3)) >>> 0, headOff + 8);
  log(`emoji-font: U+0020 unclaimed in ${patched} cmap subtable(s) — the face is emoji-only now`);
  return buf;
}

// THE ACCEPTANCE TEST, and it counts VISIBLE glyphs rather than glyphs.
// A sequence carrying U+FE0F shapes to two: the emoji, and an invisible
// zero-advance glyph for the selector, because Noto's filenames drop FE0F so
// nanoemoji never builds a ligature for it. That renders correctly — checked
// against Chrome — and a strict glyph count calls 30 of 245 broken. What a
// real failure looks like is a sequence whose VISIBLE glyph is .notdef, or
// several visible glyphs where a ZWJ ligature was lost and the Farmer draws as
// a person, a joiner and a sheaf of wheat side by side.
export async function verifyRendering(ttf, seqs, log = () => {}) {
  const { Blob, Face, Font, Buffer: HbBuffer, shape } = await import("harfbuzzjs");
  const font = new Font(new Face(new Blob(new Uint8Array(ttf))));
  const bad = [];
  for (const [stem, { text }] of seqs) {
    const buf = new HbBuffer();
    buf.addText(text);
    buf.guessSegmentProperties();
    shape(font, buf);
    const visible = buf.getGlyphInfosAndPositions().filter((g) => g.xAdvance !== 0);
    if (visible.length !== 1 || visible[0].codepoint === 0) {
      bad.push(`emoji_u${stem} -> ${visible.length} visible glyph(s)`);
    }
  }
  if (bad.length) {
    throw new Error(
      `emoji-font: ${bad.length} of ${seqs.size} sequences do not render as one glyph:\n  ` +
      bad.slice(0, 10).join("\n  ")
    );
  }
  log(`emoji-font: all ${seqs.size} sequences render as one glyph`);
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const log = (m) => console.log(m);
  const r = await buildEmojiFont({ elementsTs: "src/elements.ts", uiTs: "src/game.ts", log });
  if (!r) {
    console.error(
      "emoji-font: nanoemoji not found. Install it with:\n" +
      "  python -m pip install nanoemoji ninja"
    );
    process.exit(1);
  }
}
