// Postbuild, mirroring galaxy-raid's postbuild.js: inline dist/bundle.js into
// the single-file dist/bundle.html, minify the page, then zip it
// deterministically and report the size against the js13k budget. The minifier
// is theirs (html-minifier-next, same options); their web-resource-inliner step
// is not needed for one script tag, and their archiver/ECT/advzip chain is
// replaced by node's own zlib and a minimal hand-rolled zip container — the
// fixed DOS-epoch timestamp keeps the archive byte-deterministic for the same
// reason theirs pins it (a rebuild must not change build.zip unless
// bundle.html changed).
import { readFileSync, writeFileSync, statSync, existsSync, readdirSync } from "fs";
import { deflateRawSync } from "zlib";
import { execFileSync, execSync } from "child_process";
import { resolve } from "path";
import ect from "ect-bin";
import advzip from "advzip-bin";
import { minify } from "html-minifier-next";

// `npm run build-director` builds the DIRECTOR'S CUT, which has no budget to
// answer to: rollup put it in dist/director/ with the whole size-golf tail
// switched off, and this script inlines and minifies the page exactly as it
// does for a shipping build, then stops. No zip, no ECT/advzip, no MAX — the
// zip only ever existed to be weighed, and there is nothing here to weigh.
// Its own output file, dist/director.html, keeps it off the committed
// at-budget artifacts (dist/bundle.html and dist/build.zip).
const DIRECTOR = process.env.npm_lifecycle_event === "build-director";
const IN_DIR = DIRECTOR ? "./dist/director" : "./dist";
const BUNDLE_FILE = DIRECTOR ? "./dist/director.html" : "./dist/bundle.html";
const ZIP_FILE = "./dist/build.zip";
const MAX = 13 * 1024;

// --- inline the script into the template ----------------------------------
// Comments are stripped BEFORE inlining so the regex can never touch the JS.
let html = readFileSync(`${IN_DIR}/index.html`, "utf8")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\n{2,}/g, "\n");
const js = readFileSync(`${IN_DIR}/bundle.js`, "utf8").trim();
if (js.includes("</script")) {
  throw new Error("bundle.js contains '</script' — cannot be inlined safely");
}
// function replacer: the bundle is full of `$`, which string replacement
// would otherwise interpret as substitution patterns
html = html.replace('<script src="bundle.js"></script>', () => `<script>${js}</script>`);
if (!html.includes("<script>")) {
  throw new Error(`postbuild: no script reference found in ${IN_DIR}/index.html — nothing was inlined`);
}
// --- minify the page ------------------------------------------------------
// Same html-minifier-next pass galaxy-raid runs, on the same options. The
// script is left alone (minifyJS defaults off): its content is already through
// closure, terser and roadroller, and re-parsing a packed payload could only
// break it. A director build wants it left alone for the opposite reason —
// nothing has been minified, and that is the point of the cut.
//
// minifyCSS matters for anything the template still styles inline — the
// stylesheet itself travels in the payload now (src/css.ts) — and pipes through
// the same postcss/cssnano config the rollup config uses, so the two treatments
// cannot drift. postcss errors on empty stdin, hence the trim guard.
html = await minify(html, {
  collapseWhitespace: true,
  collapseInlineTagWhitespace: true,
  decodeEntities: true,
  sortAttributes: true,
  collapseBooleanAttributes: true,
  removeEmptyAttributes: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeTagWhitespace: true,
  useShortDoctype: true,
  minifyCSS: (text) => (text.trim() ? execSync("npx postcss", { input: text }).toString() : ""),
});
if (!html.includes("<style id=st>") && !html.includes('<style id="st">')) {
  throw new Error("postbuild: the empty <style id=st> src/css.ts fills is gone from the page");
}

// removeOptionalTags drops <body>, and this page cannot spare it. The markup
// now travels in the packed payload and src/css.ts writes it with
// document.body.innerHTML — but a <script> is processed in the insertion mode
// it is PARSED in, and with the body empty there is nothing to move the parser
// out of head, where document.body is still null. Six bytes, and they are
// already inside the 48 the move measured.
if (!/<body[\s>]/.test(html)) html = html.replace("<script>", "<body><script>");

// THE PAGE DECLARES NO CHARSET, and this is what makes that safe. Dropping
// <meta charset=utf-8> is worth 11 B — the shell is deflated at the worst ratio
// in the build, so its characters are the dearest ones here — and it is only
// safe while every byte of the page is ASCII, which every ASCII-compatible
// default decodes identically. Nothing in the page is non-ASCII today: terser
// runs with ascii_only so the chunk escapes its emoji, and roadroller's packed
// output is printable ASCII.
//
// "Today" is the problem, so it is asserted rather than assumed. A roadroller
// re-fit that began emitting a byte above 0x7E, or a stray character pasted into
// src/index.html, would otherwise be decoded by whatever the browser guessed and
// silently corrupt the payload — a mojibake page rather than a build error.
const nonAscii = [...html].filter((c) => c.codePointAt(0) > 0x7e);
if (nonAscii.length) {
  throw new Error(
    `postbuild: ${nonAscii.length} non-ASCII character(s) in the page (first: ` +
    `U+${nonAscii[0].codePointAt(0).toString(16).toUpperCase()}), but it declares no ` +
    `charset. Either re-add <meta charset=utf-8> to src/index.html, or find what ` +
    `stopped being ASCII.`
  );
}

writeFileSync(BUNDLE_FILE, html);

// --- the crc the zip container needs, whichever kind we are writing --------
const crcTable = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 255];
  return (c ^ -1) >>> 0;
};

const dosDate = (1 << 5) | 1; // 1980-01-01, the DOS epoch — earliest representable

// --- a zip of N entries, for the cut --------------------------------------
// The shipping build's container below is hand-rolled for exactly one file and
// stays that way — it is on the critical path of a 13312-byte budget and every
// field in it is accounted for. This is the same format with a loop around it,
// for an artifact that is measured in megabytes and does not care.
function writeZip(path, entries) {
  const locals = [], central = [];
  let offset = 0;
  for (const [entryName, body] of entries) {
    const nm = Buffer.from(entryName), comp = deflateRawSync(body, { level: 9 }), crc = crc32(body);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(dosDate, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(body.length, 22); lh.writeUInt16LE(nm.length, 26);
    locals.push(lh, nm, comp);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(8, 10); ch.writeUInt16LE(dosDate, 14); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(body.length, 24);
    ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(offset, 42);   // where its local header starts
    central.push(ch, nm);
    offset += 30 + nm.length + comp.length;
  }
  const dir = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dir.length, 12); end.writeUInt32LE(offset, 16);
  writeFileSync(path, Buffer.concat([...locals, dir, end]));
  return statSync(path).size;
}

// --- the director's cut ends here -----------------------------------------
// Everything below weighs the page against the 13KB budget, and a director
// build is the one that does not have one. What it gets instead of a
// measurement is a PACKAGE: the page, plus the fonts it pins — Noto Color
// Emoji so the cut wears the same element artwork on every machine, and the
// IM Fell English subset that sets ALCHEMY on the title. They travel as
// fonts/, which is the href the stylesheet already carries, so the zip and
// the loose dist/director.html both resolve them without a second build.
if (DIRECTOR) {
  const page = readFileSync(BUNDLE_FILE);
  const entries = [["index.html", page]];
  const fontDir = "./dist/fonts";
  const fonts = existsSync(fontDir) ? readdirSync(fontDir).filter(f => f.endsWith(".woff2")).sort() : [];
  for (const f of fonts) entries.push([`fonts/${f}`, readFileSync(`${fontDir}/${f}`)]);
  if (!fonts.length) {
    throw new Error("postbuild: the cut has no font chunks in dist/fonts — did the emoji-font plugin run?");
  }
  const zipped = writeZip("./dist/director.zip", entries);
  console.log(`director.html: ${page.length} bytes (unpacked, no budget)`);
  console.log(`director.zip:  ${zipped} bytes — the page and ${fonts.length} bundled font files`);
  process.exit(0);
}

const data = readFileSync(BUNDLE_FILE);
const comp = deflateRawSync(data, { level: 9 });
const name = Buffer.from("index.html");
const crc = crc32(data);

const local = Buffer.alloc(30);
local.writeUInt32LE(0x04034b50, 0);
local.writeUInt16LE(20, 4);            // version needed
local.writeUInt16LE(8, 8);             // method: deflate
local.writeUInt16LE(dosDate, 12);      // time 0, fixed date
local.writeUInt32LE(crc, 14);
local.writeUInt32LE(comp.length, 18);
local.writeUInt32LE(data.length, 22);
local.writeUInt16LE(name.length, 26);

const central = Buffer.alloc(46);
central.writeUInt32LE(0x02014b50, 0);
central.writeUInt16LE(20, 4);          // version made by
central.writeUInt16LE(20, 6);          // version needed
central.writeUInt16LE(8, 10);          // method: deflate
central.writeUInt16LE(dosDate, 14);
central.writeUInt32LE(crc, 16);
central.writeUInt32LE(comp.length, 20);
central.writeUInt32LE(data.length, 24);
central.writeUInt16LE(name.length, 28);

const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(1, 8);              // entries on this disk
eocd.writeUInt16LE(1, 10);             // entries total
eocd.writeUInt32LE(46 + name.length, 12);                  // central dir size
eocd.writeUInt32LE(30 + name.length + comp.length, 16);    // central dir offset

writeFileSync(ZIP_FILE, Buffer.concat([local, name, comp, central, name, eocd]));

const bytes = data.length;
const zipped = 30 + name.length + comp.length + 46 + name.length + 22;
console.log(`bundle.html: ${bytes} bytes`);
console.log(`zlib -9:     ${zipped} bytes`);

// --- recompress: ECT, then advzip ------------------------------------------
// Both rewrite the SAME deflate stream harder than zlib can; neither touches
// the file inside, so the game is byte-identical and only the container shrinks.
// Determinism survives because both are deterministic for a given input, and
// the input is the fixed-timestamp zip written above.
//
// ECT -100500: above 10000 the number means "repeat the blocksplitting cycle
// #/10000 times", i.e. 10 cycles at 500 deflate iterations per block. -strip
// drops the archive metadata that a single-entry zip has no use for.
const zipPath = resolve(ZIP_FILE);
execFileSync(ect, ["-100500", "-strip", "-zip", zipPath]);
const afterEct = statSync(zipPath).size;
// advzip after ECT is a cheap safety net rather than an expected gain: on
// roadroller-packed, high-entropy payloads ECT at -100500 has largely caught up
// with zopfli. -i 100 is the knee; higher iteration counts cost seconds and
// have not been observed to find anything more.
execFileSync(advzip, ["--recompress", "--pedantic", "--shrink-insane", "-i", "100", zipPath]);
const final = statSync(zipPath).size;
console.log(`ECT:         ${afterEct} bytes (${zipped - afterEct} saved)`);
console.log(`advzip:      ${final} bytes (${afterEct - final} saved)`);

const percent = ((final / MAX) * 100).toFixed(2);
if (final > MAX) console.error(`Size overflow: ${final} bytes (${percent}%)`);
else console.log(`Size: ${final} bytes (${percent}% of 13KB)`);
