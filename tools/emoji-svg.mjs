// Fetches the Noto Emoji SOURCE SVGs for exactly the emoji this table uses.
//
// The director's cut currently pins its artwork by downloading nine of Google's
// ten CDN chunks of Noto Color Emoji — 1.3 MB to render 183 pictures, because a
// unicode-range chunk is the smallest thing the CDN will sell and a real subset
// meant pyftsubset or harfbuzz (tools/fonts.mjs says so at length). The SVGs in
// googlefonts/noto-emoji are the other way in: one file per emoji, fetched by
// name, so the payload is the artwork this game actually shows and nothing else.
//
// This module ONLY fetches and caches them. Turning them into a woff2 is a
// separate and much larger question — see the header of tools/emoji-font.mjs,
// or the summary here: a font built from these with the usual Node chain
// (svg2ttf -> ttf2woff2) is MONOCHROME, because glyf stores outlines and has
// nowhere to put a fill colour. Colour needs COLRv1 (what Noto itself ships,
// what Chrome renders, what nanoemoji builds and nothing in npm does), OT-SVG
// (Firefox and Safari only — Chrome has never supported it, and Chrome is what
// check.mjs drives), or CBDT bitmaps (a rasteriser dependency). So these SVGs
// are useful on their own — they are the reference artwork for hand-drawn `s:`
// icons like the Wheat's — and the font step is a decision, not a detail.
//
// THE FILENAME RULE, which is the only fiddly part. Noto names a file after the
// codepoint sequence, lowercase hex, underscore-separated, `emoji_u` prefixed:
//   U+1F308                     -> emoji_u1f308.svg
//   U+1F9D1 U+200D U+1F52C      -> emoji_u1f9d1_200d_1f52c.svg
// and it DROPS U+FE0F, the variation selector, because the file is the picture
// and the selector only ever asked for the picture. Our table carries FE0F on
// the eleven glyphs that need it to render as emoji at all (the Skiing and the
// Ice Skate among them), so it is stripped here and only here.
//
// Cached under .fonts/svg/ (the whole .fonts/ tree is gitignored), so a second
// run is offline. Delete the directory to refetch.
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const REPO = "https://raw.githubusercontent.com/googlefonts/noto-emoji/main/svg";
const CACHE = join(".fonts", "svg");

// Every `e:` field as a SEQUENCE of codepoints, not a flat set of them: a ZWJ
// emoji is one picture with one filename, and codepointsOf() in tools/fonts.mjs
// deliberately flattens (it is feeding unicode-range, which only knows single
// codepoints). This is the other reading of the same field.
export function sequencesOf(elementsTs, uiTs) {
  const src = readFileSync(elementsTs, "utf8");
  const seqs = new Map(); // filename stem -> { text, cps }
  for (const m of src.matchAll(/\be:\s*"((?:[^"\\]|\\.)*)"/g)) {
    const text = m[1]
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    const cps = [...text].map((c) => c.codePointAt(0));
    // FE0F is presentation, not identity: Noto files never carry it.
    const named = cps.filter((c) => c !== 0xfe0f);
    if (!named.length) continue;
    seqs.set(named.map((c) => c.toString(16)).join("_"), { text, cps });
  }
  // THE CARD ICONS TOO, one stem per codepoint rather than one per string:
  // see uiCodepointsOf() in tools/fonts.mjs for why the two files are read by
  // opposite rules. Added after the table so an icon an element already owns
  // is a no-op rather than a second entry for the same picture.
  if (uiTs) {
    for (const m of readFileSync(uiTs, "utf8").matchAll(/\\u\{([0-9a-fA-F]+)\}/g)) {
      const cp = parseInt(m[1], 16);
      if (cp === 0xfe0f) continue;
      seqs.set(cp.toString(16), { text: String.fromCodePoint(cp), cps: [cp] });
    }
  }
  return seqs;
}

const CONCURRENCY = 8;

// Fetch one stem into the cache. Returns "cached" | "fetched" | "missing".
async function grab(stem) {
  const file = join(CACHE, `emoji_u${stem}.svg`);
  if (existsSync(file) && statSync(file).size) return "cached";
  const r = await fetch(`${REPO}/emoji_u${stem}.svg`);
  if (r.status === 404) return "missing";
  if (!r.ok) throw new Error(`emoji-svg: emoji_u${stem}.svg said ${r.status}`);
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return "fetched";
}

export async function fetchEmojiSvgs({ elementsTs, uiTs, log = () => {} }) {
  mkdirSync(CACHE, { recursive: true });
  const seqs = sequencesOf(elementsTs, uiTs);
  const stems = [...seqs.keys()];
  const missing = [];
  let fetched = 0, cached = 0;

  // A small fixed pool rather than 280 parallel requests at raw.githubusercontent.
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < stems.length) {
        const stem = stems[next++];
        const r = await grab(stem);
        if (r === "missing") missing.push(stem);
        else if (r === "fetched") fetched++;
        else cached++;
      }
    })
  );

  const bytes = readdirSync(CACHE)
    .filter((f) => f.endsWith(".svg"))
    .reduce((t, f) => t + statSync(join(CACHE, f)).size, 0);

  log(
    `emoji-svg: ${stems.length} sequences — ${fetched} fetched, ${cached} cached, ` +
    `${missing.length} missing, ${(bytes / 1024).toFixed(0)} KB in ${CACHE}`
  );
  // Not fatal, and worth naming: a missing file means the cut would fall back
  // to the OS for that one glyph, which is the thing the cut exists to avoid.
  if (missing.length) {
    log(
      `emoji-svg: NOT IN THE REPO, would fall back to the OS: ` +
      missing.map((s) => "U+" + s.toUpperCase().replace(/_/g, " U+")).join(", ")
    );
  }
  return { seqs, missing, bytes };
}

// `node tools/emoji-svg.mjs` fetches and reports; nothing else runs it yet.
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  await fetchEmojiSvgs({ elementsTs: "src/elements.ts", uiTs: "src/game.ts", log: (m) => console.log(m) });
}
