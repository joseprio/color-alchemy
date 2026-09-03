// Webfonts for the DIRECTOR'S CUT. Two of them, for two different reasons, and
// neither ever reaches a shipping build — 1.3 MB of font against a 13312-byte
// budget is not a trade, and the shipped game is meant to look native on the
// platform it is played on anyway.
//
//   NOTO COLOR EMOJI  pins the element artwork, so the cut wears the same
//                     emoji on every machine instead of Apple's here and
//                     Segoe's there. experiments/emoji-fonts.html is where
//                     that choice was made: of the sets checked, Noto and
//                     Twemoji are the only two covering all 183.
//   IM FELL ENGLISH   sets ALCHEMY on the title screen. A 17th-century
//                     English book face, which is the century the word belongs
//                     to; COLOR keeps its own rainbow-gradient sans above it,
//                     so the two halves of the title stop being the same
//                     lettering at two sizes.
//
// BOTH ARE CACHED in .fonts/ (gitignored) and keyed by the filename Google
// serves, which carries the font's revision — a font update lands as a new
// name and a fresh download, an unchanged one never re-downloads, and a
// director build with a warm cache needs no network at all. Delete .fonts/ to
// force a refresh.
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from "fs";
import { join } from "path";

// Chrome, because the UA is what decides whether Google serves woff2 or ttf
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const CACHE = ".fonts";

async function cached(name, fetchIt) {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, name);
  if (existsSync(path)) return readFileSync(path);
  const buf = Buffer.from(await fetchIt());
  writeFileSync(path, buf);
  return buf;
}
const getCss = (url, cacheAs) =>
  cached(cacheAs, async () => {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error(`fonts: ${url} said ${r.status}`);
    return r.text();
  }).then((b) => b.toString("utf8"));

const parseFaces = (css) =>
  [...css.matchAll(/src:\s*url\(([^)]+)\)[^;]*;\s*unicode-range:\s*([^;]+);/g)].map((m) => ({
    url: m[1],
    ranges: m[2].split(",").map((r) => {
      const [a, b] = r.trim().replace(/^U\+/i, "").split("-");
      return [parseInt(a, 16), parseInt(b ?? a, 16)];
    }),
    raw: m[2].trim(),
  }));

const face = (family, name, publicPath, range) =>
  `@font-face{font-family:"${family}";font-style:normal;font-weight:400;` +
  `src:url(${publicPath}${name}) format("woff2");unicode-range:${range}}`;

// Wipes the previous build's chunks so a font revision cannot leave a stale
// file riding along in the zip. Called once, before either font is fetched.
export function resetFontDir(outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const f of readdirSync(outDir)) if (f.endsWith(".woff2")) rmSync(join(outDir, f));
}

/* ------------------------------------------------------------------ emoji */
// Every codepoint the table can put on screen, read from the source of truth
// rather than a list kept in step by hand: add an element with a new emoji and
// the next director build fetches whatever chunk it needs.
export function codepointsOf(elementsTs) {
  const src = readFileSync(elementsTs, "utf8");
  const cps = new Set();
  for (const m of src.matchAll(/\be:\s*"((?:[^"\\]|\\.)*)"/g)) {
    const ch = m[1]
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    for (const c of ch) cps.add(c.codePointAt(0));
  }
  return cps;
}

// THE CARDS PUT EMOJI ON SCREEN THAT NO ELEMENT DOES, and the trophy on the
// completion screen is the one that proves it: it shipped for months outside
// every subset, falling back to whatever the viewer's OS draws, because the
// scanner above only ever read the element table. src/game.ts is the other
// source of truth, and every \u{...} escape in it is a card icon — the four
// quest strings, the trophy, and the Quests-screen rows that repeat them — so
// the file needs no marker and a new card icon is covered by the build that
// adds it.
//
// SPLIT, NEVER JOINED. A table entry is one string per picture, ZWJ included;
// a card's string is pictures side by side — "\u{1F308}\u{1F984}" is two, and
// asking Noto for a 1f308_1f984 file gets a 404. Each codepoint is its own
// glyph here, which is also what unicode-range wants.
export function uiCodepointsOf(uiTs) {
  const cps = new Set();
  for (const m of readFileSync(uiTs, "utf8").matchAll(/\\u\{([0-9a-fA-F]+)\}/g)) {
    const cp = parseInt(m[1], 16);
    if (cp !== 0xfe0f) cps.add(cp);   // presentation, not identity
  }
  return cps;
}

// TWO WAYS TO GET THE EMOJI, and the first one is tried first.
//
// BUILT (tools/emoji-font.mjs): nanoemoji compiles Noto's own source SVGs into
// a COLRv1 font holding exactly the 245 sequences this table shows — 237 KB.
// Needs Python with nanoemoji and ninja.
//
// FETCHED (below): nine of Google's ten CDN chunks, 1317 KB, because a
// unicode-range chunk is the smallest unit the CDN sells. No toolchain at all.
// This is what the cut did before the built path existed and it stays as the
// fallback, so a machine without Python still produces a working cut — five and
// a half times heavier, and identical on screen.
//
// The `text=` trick the title font uses below is no help to either: it is
// capped well under 245 emoji, and a ZWJ sequence is not a character it can
// subset by.
export async function emojiFontCss({ elementsTs, uiTs, outDir, publicPath, log = () => {} }) {
  const { buildEmojiFont } = await import("./emoji-font.mjs");
  const built = await buildEmojiFont({ elementsTs, uiTs, log });
  if (built) {
    writeFileSync(join(outDir, built.name), built.woff2);
    return (
      `@font-face{font-family:"Noto Color Emoji";font-style:normal;font-weight:400;` +
      `src:url(${publicPath}${built.name}) format("woff2")}` +
      `body{font-family:monospace,"Noto Color Emoji"}`
    );
  }
  log(
    `fonts: nanoemoji not found, falling back to the CDN chunks (5x heavier).\n` +
    `       install it with: python -m pip install nanoemoji ninja`
  );

  const css = await getCss("https://fonts.googleapis.com/css2?family=Noto+Color+Emoji", "noto-color-emoji.css");
  const faces = parseFaces(css);
  if (!faces.length) throw new Error("fonts: no @font-face rules for Noto Color Emoji — the API shape changed");

  const want = new Set([...codepointsOf(elementsTs), ...(uiTs ? uiCodepointsOf(uiTs) : [])]);
  const covers = (f, cp) => f.ranges.some(([a, b]) => cp >= a && cp <= b);
  const used = new Set();
  const orphans = [];
  for (const cp of want) {
    const i = faces.findIndex((f) => covers(f, cp));
    if (i < 0) orphans.push("U+" + cp.toString(16).toUpperCase());
    else used.add(i);
  }
  // Not fatal: an uncovered codepoint falls back to the viewer's own emoji
  // font, which is what the shipping build does everywhere. Worth saying out
  // loud though, because the whole point of the cut is that it does not.
  if (orphans.length) log(`fonts: ${orphans.length} codepoint(s) outside every chunk, left to the OS: ${orphans.join(" ")}`);

  let bytes = 0;
  const rules = [];
  for (const i of [...used].sort((a, b) => a - b)) {
    const f = faces[i];
    const name = f.url.split("/").pop();
    const buf = await cached(name, async () => {
      const r = await fetch(f.url, { headers: { "User-Agent": UA } });
      if (!r.ok) throw new Error(`fonts: ${name} said ${r.status}`);
      return r.arrayBuffer();
    });
    bytes += buf.length;
    writeFileSync(join(outDir, name), buf);
    rules.push(face("Noto Color Emoji", name, publicPath, f.raw));
  }
  log(`fonts: Noto Color Emoji — ${used.size} of ${faces.length} chunks, ${(bytes / 1024).toFixed(0)} KB`);

  // A STACK, not a replacement: monospace still sets the text and the emoji
  // font is reached only for characters monospace has no glyph for. On body
  // because everything that renders an emoji inherits from it — the three
  // rules in style.css that pin their own family are the title and the menu,
  // and neither ever holds one.
  return rules.join("") + `body{font-family:monospace,"Noto Color Emoji"}`;
}

/* ------------------------------------------------------------------ title */
// The letters the title actually spells, read out of the template so a rename
// cannot leave the subset behind. Both cases: #tb is font-variant: small-caps,
// and a browser synthesises those by SCALING THE CAPITALS, so the uppercase of
// every letter has to be in the file even though the markup never spells it.
export function titleLetters(indexHtml) {
  const html = readFileSync(indexHtml, "utf8");
  const m = html.match(/<div id="tb">([\s\S]*?)<\/div>/);
  if (!m) throw new Error("fonts: no <div id=\"tb\"> in the template — the title moved");
  const letters = new Set();
  for (const ch of m[1].replace(/<[^>]*>/g, "")) {
    if (!/\s/.test(ch)) letters.add(ch), letters.add(ch.toUpperCase());
  }
  return [...letters].sort().join("");
}

// Google will cut a font down to an exact character set with `text=`, which is
// the whole latin face at 60 KB against 13 KB for the dozen letters the title
// spells. Worth doing even here: it is the difference between a font the cut
// carries and one it barely notices.
export async function titleFontCss({ family, indexHtml, outDir, publicPath, log = () => {} }) {
  const text = titleLetters(indexHtml);
  const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}` +
    `&text=${encodeURIComponent(text)}`;
  const css = await getCss(url, `${slug}.css`);
  const faces = parseFaces(css);
  if (!faces.length) throw new Error(`fonts: no @font-face rules for ${family} — is the family name right?`);

  // The subset url is a `kit=` query with no filename of its own, so the cache
  // key and the shipped name come from the family plus the exact letters.
  const name = `${slug}-${Buffer.from(text).toString("hex").slice(0, 12)}.woff2`;
  const buf = await cached(name, async () => {
    const r = await fetch(faces[0].url, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error(`fonts: ${family} subset said ${r.status}`);
    return r.arrayBuffer();
  });
  writeFileSync(join(outDir, name), buf);
  log(`fonts: ${family} — "${text}" subset, ${(buf.length / 1024).toFixed(1)} KB`);
  return face(family, name, publicPath, faces[0].raw);
}
