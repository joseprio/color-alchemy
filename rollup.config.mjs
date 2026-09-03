// Color Alchemy build — now the full galaxy-raid shape including its size-golf
// tail: TypeScript entry, an HTML-template step, and in production a
// closure(ADVANCED) -> terser -> roadroller chain, with postbuild.mjs adding
// ECT + advzip on the zip. Dev is untouched: watch + serve on :8080 with none
// of the above, so a dev build stays readable and fast.
// The CSS handling is theirs too: src/style.css -> cssnano -> the __MARKUP__
// constant -> src/css.ts, so the stylesheet packs with the JS instead of riding
// along in the HTML (their OPTIMIZATIONS.md #18/#71).
// Still NOT carried over from galaxy-raid (all fitted to that game's chunk, see
// its OPTIMIZATIONS.md): the oxc/swc re-minifies, paver, fn-order.json.
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import serve from "rollup-plugin-serve";
import closureCompiler from "@ampproject/rollup-plugin-closure-compiler";
// NOT the npm package: package.json points "roadroller" at file:../roadroller, the
// fork with a decoder-golf pass and an optional match model. The build prints the
// resolved path so a silent fallback to the registry copy — which would drop
// matchModel from rr-config.json as an unknown option and quietly pack worse —
// cannot go unnoticed.
import { Packer } from "roadroller";
import { reorderFunctions } from "./tools/fn-order.mjs";
import { emojiFontCss, titleFontCss, resetFontDir } from "./tools/fonts.mjs";
import { ESLint } from "eslint";
import { createRequire } from "module";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import { minify as minifyHtml } from "html-minifier-next";

// The page CSS ships inside the JS bundle: src/css.ts assigns it to the empty
// <style id=sty> in the template (galaxy-raid OPTIMIZATIONS.md #18/#71 — the
// packed payload compresses it better than index.html's deflate stream does).
// src/style.css stays the readable source of truth; it is minified here with
// the SAME cssnano pass postbuild.mjs hands to html-minifier, and injected as
// the __MARKUP__ constant. Read ONCE at config load: a watch-mode rebuild does
// NOT pick up edits to style.css, so restart the watcher after touching it.
// The minified text is built below, once DIRECTOR is known.

/* ------------------------------------------------- the cut's emoji font */
// DIRECTOR ONLY. The shipping build renders emoji in whatever set the player's
// OS provides, which is the right call for it — native artwork, zero bytes. The
// cut pins Noto Color Emoji instead so it looks identical everywhere, and pays
// 1.3 MB for it out of a budget it does not have. tools/emoji-font.mjs explains
// the chunking and the cache; this only has to run it and hand the rules to
// injectCss, which appends them AFTER cssnano so nothing can rewrite a
// unicode-range or a src url on the way through.
//
// buildStart, not config load: the fetch is async and a rollup config cannot
// await. It still finishes before any transform hook, so injectCss always sees
// the finished rules.
let fontCss = "";
const emojiFont = {
  name: "emoji-font",
  async buildStart() {
    const log = (m) => console.log(m);
    resetFontDir(FONT_DIR);
    const shared = { outDir: FONT_DIR, publicPath: FONT_HREF, log };
    fontCss =
      (await emojiFontCss({ elementsTs: "src/elements.ts", uiTs: "src/game.ts", ...shared })) +
      (await titleFontCss({ family: "IM Fell English", indexHtml: "src/index.html", ...shared })) +
      // ALCHEMY only. #tl above it keeps the rainbow-gradient sans, so the
      // two halves of the title read as two things rather than one word set
      // twice. The weight goes back to 400 with it: style.css asks for 700,
      // IM Fell English ships one weight, and a browser answering that with
      // synthetic bold smears a face whose whole character is its thin
      // strokes.
      //
      // AND THE TRACKING COMES WITH THE FACE, which is the thing this rule
      // was missing. style.css says .87em in as many words: "fitted to Arial's
      // metrics at this size ratio", the price it paid for dropping the
      // space-between flex version that needed no number at all. Swap the
      // family and that number is fitted to the wrong face -- IM Fell English
      // is narrower, and AlchemY came out 14.44px short of COLOR's right edge
      // against a 2px tolerance, breaking the lockup the whole trick exists to
      // hold. Nobody saw it because the cut had not built since the face
      // landed; the charset guard was killing it first.
      // .93em is measured, not derived: the ink spans SIX gaps for seven
      // letters, so 14.44/6 = 2.41px per gap on a 40px size, .87 + .0602 =
      // .9302, taken to .93 for -0.04px of residual. The margin is equal and
      // opposite, the same as in style.css -- the two must move together or
      // the phantom trailing gap swells #tw and slides the pair off-centre.
      `#tb{font-family:"IM Fell English",Georgia,serif;font-weight:400;` +
      `letter-spacing:.93em;margin-right:-.93em}`;
  },
};

// Substitutes the CSS text for the __MARKUP__ token in src/css.ts. Listed
// before typescript() so it sees the raw source; galaxy-raid does the same job
// with @rollup/plugin-replace, which would be a dependency for one token here.
const injectCss = {
  name: "inject-css",
  transform(code, id) {
    if (!id.endsWith("css.ts")) return null;
    if (!code.includes("__MARKUP__ = ") && !code.includes("__MARKUP__;")) {
      throw new Error("inject-css: src/css.ts no longer mentions __MARKUP__");
    }
    // GOLF_EMOJI_CSS is empty unless this is a shipping build, fontCss unless
    // it is a director one — the two are never both set.
    const sheet = minCss + GOLF_EMOJI_CSS + fontCss;
    return { code: code.replace(/__MARKUP__/g, () => JSON.stringify(sheet)), map: null };
  },
};

// `npm run build` -> production; `npm start` (watch) -> dev
const production = !process.env.ROLLUP_WATCH;
// The two development-only menu entries (Unlock all, Reset everything) ship
// only when this is true: always in watch mode, and in a production build only
// for `npm run build-dev`. That reads npm_lifecycle_event rather than an env var
// because `DEV=1 rollup -c` is not portable to the cmd.exe npm runs scripts in.
const DEV = !production || process.env.npm_lifecycle_event === "build-dev";
// `npm run build-director` -> the DIRECTOR'S CUT: the same game with no 13KB
// budget behind it. Read the same way DEV is, and for the same reason.
// It is a RELEASE build, not a development one — DEV stays false, so the two
// menu tools are absent from it exactly as they are from a shipping bundle.
// What it drops is nearly the whole size-golf tail (closure, the two
// respellings, fn-order, roadroller): every one of those exists to fit 13312
// bytes,
// and each one costs something a cut with no budget has no reason to pay —
// ADVANCED's dead-code hazards, mangled names in a stack trace, an eval'd
// payload with a decoder that leaks globals. Content meant for it goes behind
// __DIRECTOR__, which closure deletes from the shipping build the way it
// deletes __DEV__.
const DIRECTOR = process.env.npm_lifecycle_event === "build-director";
// It builds into dist/director/ and postbuild writes dist/director.html, so a
// director build can never overwrite the committed at-budget artifacts.
const OUT_DIR = DIRECTOR ? "dist/director" : "dist";
// The cut's font chunks sit beside the page postbuild.mjs writes, so the same
// relative href works whether the file is opened from dist/ or unpacked from
// the zip, where they travel as fonts/.
const FONT_DIR = "dist/fonts";
const FONT_HREF = "fonts/";
// Every pass in the size-golf tail is gated on this one flag rather than on
// `production` alone, so "what a director build skips" is one grep -- with
// exactly one exception, terser, which is gated on `production` and runs in
// both cuts. The reason is in the comment on the plugin itself.
const golf = production && !DIRECTOR;

// DIRECTOR-ONLY RULES. src/style.css marks spans that style something only the
// director's cut has — currently the fireworks canvas, whose effect is behind
// __DIRECTOR__ in src/game.ts and which closure deletes from a shipping build,
// canvas and all. The markers are CSS comments; a shipping build cuts
// everything between them, a director build drops just the markers. Done on the
// RAW text, before postcss, so cssnano never sees the dead rules and cannot
// merge one into a live selector.
const cutDirectorCss = (css) =>
  DIRECTOR
    ? css.replace(/\/\*[><]director\*\//g, "")
    : css.replace(/\/\*>director\*\/[\s\S]*?\/\*<director\*\//g, "");
// GOLF-ONLY: the shipping build pins its emoji too, from a URL rather than from
// the payload. The cut compiles its own 237 KB COLRv1 font and carries it in
// the zip (tools/emoji-font.mjs); a 13312-byte build can afford neither the
// font nor a fraction of it, so this is the same artwork fetched at runtime for
// the cost of the rule that names it.
//
// THE TRADE, said plainly because it is not free: the page stops being
// self-contained. Every other byte of this game is inside the zip, and this is
// a reference OUT of it — offline the rule simply does not resolve and the
// emoji fall back to the platform's own, which is exactly what shipped before,
// so the failure mode is the old behaviour rather than a broken page. Worth
// knowing that most size-limited competitions require an entry to run with no
// network at all; under those rules this rule is the one thing to take out.
//
// Protocol-relative so the page works from file:// as well as over https.
// Appended AFTER cssnano for the reason the director's font rules are: nothing
// should get to rewrite a src url on the way through.
// NOT in src/style.css, because that file is shared with the cut, and the cut
// has a real font of its own to name.
// Only the @font-face: the family is NAMED in style.css's own body shorthand
// (`font: 14px/1.45 emoji, monospace`), which is 7 characters there against 33
// for a `body{font-family:emoji,monospace}` rule appended here. The name is
// inert in the builds that do not define it.
//
// NO unicode-range, and that is a claim about the FONT: style.css leads with
// this family so the colour artwork beats whatever emoji coverage the platform
// monospace has, which is only safe while the face answers for nothing but
// emoji. It did not, for a while — nanoemoji gives every font it builds a
// `space` glyph, so U+0020 was in the cmap and every space in the UI came back
// at the emoji advance, 17px against monospace's 7.69px. The fix is in
// tools/emoji-font.mjs, which unclaims U+0020 before the font is packed; a
// range here would have papered over a font that was still lying about itself.
const GOLF_EMOJI_CSS = golf
  ? `@font-face{font-family:emoji;src:url(//joseprio.github.io/color-alchemy/emoji.woff2)}`
  : "";
const minCss = execSync("npx postcss", {
  input: cutDirectorCss(readFileSync("src/style.css", "utf8")),
}).toString().trim();
if (/<\/script|[\`]|\$\{/.test(minCss)) {
  throw new Error("style.css contains a sequence unsafe inside an inline script");
}

const defines = {
  name: "defines",
  transform(code, id) {
    if (!id.endsWith(".ts")) return null;
    if (!code.includes("__DEV__") && !code.includes("__DIRECTOR__")) return null;
    return {
      code: code.replace(/__DEV__/g, String(DEV)).replace(/__DIRECTOR__/g, String(DIRECTOR)),
      map: null,
    };
  },
};

/* -------------------------------------------------------- body markup */
// The page's body is AUTHORED in src/index.html and SHIPPED inside the packed
// payload: this lifts it out, minifies it with the same html-minifier pass
// postbuild.mjs runs on the page, and hands it to src/css.ts as __BODY__.
// emit-html then writes the template with an empty body.
//
// Same trade as the stylesheet (galaxy-raid #18), and the same reason: markup
// left in the page is compressed by the zip's deflate stream at about 0.44
// bytes per character — the worst ratio anywhere in this build — while
// roadroller models it at roughly a third of that. Measured worth 48 B.
//
// Comments are stripped BEFORE the body is located: the template's header
// comment talks about these tags, and a match inside it would take the wrong
// span. postbuild.mjs strips them first for the same reason.
const BODY_MIN_OPTS = {
  collapseWhitespace: true,
  collapseInlineTagWhitespace: true,
  decodeEntities: true,
  sortAttributes: true,
  collapseBooleanAttributes: true,
  removeEmptyAttributes: true,
  removeAttributeQuotes: true,
  removeComments: true,
  removeRedundantAttributes: true,
  removeTagWhitespace: true,
};
// An element carrying `data-director` exists only for the director's cut — the
// fireworks canvas is the one, and closure deletes the effect that draws to it
// from a shipping build. A shipping build drops the whole element, a director
// build keeps it and drops just the attribute. The partner of cutDirectorCss
// above, and the two must stay in step: the canvas and the rules that style it
// are one feature and have to leave together.
//
// EMPTY ELEMENTS ONLY. The cut removes an open tag and the close tag straight
// after it; a marked element with children would lose its tags and leave the
// children behind in a shipping build, silently. There is no such element
// today, and the throw is what keeps it that way.
const cutDirectorHtml = (html) => {
  if (DIRECTOR) return html.replace(/ data-director/g, "");
  for (const m of html.matchAll(/<(\w+)[^>]*\sdata-director[^>]*>/g)) {
    if (!html.slice(m.index + m[0].length).startsWith(`</${m[1]}>`)) {
      throw new Error(`template: data-director on a non-empty <${m[1]}> — only empty elements can be cut this way`);
    }
  }
  return html.replace(/<(\w+)[^>]*\sdata-director[^>]*><\/\1>/g, "");
};
const bodyOf = (html) => {
  const m = html.replace(/<!--[\s\S]*?-->/g, "").match(/<body>([\s\S]*)<\/body>/);
  if (!m) throw new Error("template: no <body> … </body> to lift the markup out of");
  return cutDirectorHtml(m[1]);
};
const injectBody = {
  name: "inject-body",
  async transform(code, id) {
    if (!id.endsWith("css.ts")) return null;
    if (!code.includes("__BODY__")) {
      throw new Error("inject-body: src/css.ts no longer mentions __BODY__");
    }
    // TRAILING CLOSE TAGS ARE IMPLIED, and this is the one place that can act
    // on it without lying to anyone. The markup is assigned with innerHTML, and
    // a fragment parser closes whatever is still open when the string ends — so
    // every `</div>` in a run at the very end is describing something the
    // parser was going to do anyway. html-minifier will not do this, and it is
    // right not to: `removeOptionalTags` only drops what the SPEC calls
    // optional (`</li>`, `</td>`, `</p>` — none of which this page uses) and
    // what is left would not be a valid document. It does not have to be one.
    // It is an innerHTML payload, and src/index.html stays a real, valid,
    // well-formed HTML file that opens in a browser and that the dev build
    // serves as-is.
    // Only the trailing RUN, never an interior tag: dropping `</div>` in the
    // middle would nest the next element inside the previous one instead of
    // making it a sibling, silently and visibly.
    const closed = (await minifyHtml(bodyOf(readFileSync("src/index.html", "utf8")), BODY_MIN_OPTS)).trim();
    const body = closed.replace(/(?:<\/[a-z]+>)+$/, "");
    if (closed.length !== body.length) {
      console.log(`inject-body: dropped ${closed.length - body.length} chars of implied trailing close tags`);
    }
    if (body.includes("</script")) {
      throw new Error("inject-body: the template body contains '</script' — cannot ride in an inline script");
    }
    console.log(`inject-body: ${body.length} chars of markup moved into the payload`);
    return { code: code.replace(/__BODY__/g, () => JSON.stringify(body)), map: null };
  },
};

/* ---------------------------------------------------- recipe id encoding */
// The recipe pairs in src/elements.ts are AUTHORED as words — ["king","house"]
// — and SHIPPED as two-character codes indexing the table — ["A%","Bf"]. The
// table keeps its comments, its types and its deliberate ordering; only the
// emitted strings change. Measured worth 161 B packed.
//
// Three things about the encoding were measured rather than assumed, and each
// went the opposite way to the obvious guess:
//
//  1. TABLE-INDEX ORDER, NOT FREQUENCY ORDER. Giving the most-referenced ids
//     the lowest codes measured 7 B WORSE. The table is deliberately ordered so
//     a recipe's ingredient is defined a line or two above it, so index order
//     puts related codes next to each other and roadroller's sparse models
//     predict that; frequency order scrambles exactly that locality.
//  2. UNIFORM TWO CHARACTERS, NEVER ONE. A variable-length scheme (one char for
//     the first 88 ids, two for the rest) removes 500 MORE characters and costs
//     65 B MORE. Fixed alignment is what the context models want.
//  3. THE PAIRS STAY NESTED. Running the codes together into one string per
//     element — r:"A%Bf" — removes twice as many characters as this and saves
//     half as much, which is the same finding the table's own header records
//     for flattening, reproduced with a different alphabet.
//
// Base 92, alphabet from '#' (35) up. Code 92 is a backslash and two of the
// ids land on one; JSON.stringify escapes it and the decoder reads the real
// character value, so no skip arithmetic is needed on either side.
//
// Listed BEFORE typescript() so it sees raw source, exactly as injectCss is.
// __DECODE__ is declared in src/dom.d.ts, not in elements.ts, because the
// replacement below is a blunt string swap that would rewrite a declaration
// sitting in the same file.
const RECIPE_BASE = 92;
const encodeRecipes = {
  name: "encode-recipes",
  transform(code, id) {
    if (!id.endsWith("elements.ts")) return null;
    if (!code.includes("__DECODE__")) {
      throw new Error("encode-recipes: src/elements.ts no longer mentions __DECODE__");
    }

    // The ids in source order ARE the alphabet, so this list and the table are
    // the same fact twice; a duplicate would silently alias two elements.
    const ids = [...code.matchAll(/\bid:\s*"([^"]+)"/g)].map(m => m[1]);
    if (!ids.length) throw new Error("encode-recipes: no id: fields found in elements.ts");
    const dupes = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
    if (dupes.length) throw new Error(`encode-recipes: duplicate element ids: ${dupes.join(", ")}`);
    // Element ids are also KEYS OF A PLAIN OBJECT at runtime: `found` and the
    // hint's `want` are dictionaries rather than Sets (game.ts says why), so an
    // id that names something on Object.prototype would read back truthy before
    // it was ever discovered — the element would start the game already found,
    // silently, and only in a shipping build. None of the ids collide today;
    // this is what keeps it that way.
    const proto = ids.filter((id) => ({})[id] !== undefined);
    if (proto.length) {
      throw new Error(
        `encode-recipes: element id(s) shadow Object.prototype and cannot key a ` +
        `dictionary: ${proto.join(", ")}`
      );
    }
    if (ids.length > RECIPE_BASE * RECIPE_BASE) {
      throw new Error(`encode-recipes: ${ids.length} elements outgrew the two-character alphabet`);
    }
    const enc = (n) =>
      String.fromCharCode(35 + ((n / RECIPE_BASE) | 0)) + String.fromCharCode(35 + (n % RECIPE_BASE));

    // Rewrite the string literals inside each r:[...] span. The span is found
    // by MATCHING BRACKETS rather than by a lazy regex: the pairs are nested,
    // so `r:\[[\s\S]*?\]` would stop at the first inner "]" and leave the rest
    // of a multi-recipe entry as words.
    let out = "", at = 0, refs = 0;
    for (const m of code.matchAll(/\br:\s*\[/g)) {
      let depth = 1, k = m.index + m[0].length;
      while (k < code.length && depth) {
        if (code[k] === "[") depth++;
        else if (code[k] === "]") depth--;
        k++;
      }
      if (depth) throw new Error("encode-recipes: unterminated r:[ ... ] span");
      out += code.slice(at, m.index) + code.slice(m.index, k).replace(/"([^"]*)"/g, (_, word) => {
        const i = ids.indexOf(word);
        // The check this buys: a mistyped ingredient is currently a SILENTLY
        // dead recipe, findable only by playing for it. Now it fails the build.
        if (i < 0) throw new Error(`encode-recipes: recipe ingredient "${word}" is not an element id`);
        refs++;
        return JSON.stringify(enc(i));
      });
      at = k;
    }
    out += code.slice(at);

    // The decode. One extra pass over the table, placed where __DECODE__ sits —
    // after ELEMENTS exists and before BY_ID and RECIPE are built from it.
    // A non-golfed build encoded nothing, so it decodes nothing.
    const decode = golf
      ? `((D)=>ELEMENTS.map(e=>e.r&&e.r.map(p=>(p[0]=D(p[0]),p[1]=D(p[1])))))` +
        `((s)=>ELEMENTS[${RECIPE_BASE}*(s.charCodeAt(0)-35)+s.charCodeAt(1)-35].id)`
      : "0";
    console.log(
      golf
        ? `encode-recipes: ${refs} recipe ids -> 2-char codes over ${ids.length} elements`
        : `encode-recipes: ${refs} recipe ids validated, left as words (not a golfed build)`
    );
    // Not golfing? Undo the encode as well as the decode, so the two builds run
    // the same table rather than the same code over different data.
    return { code: (golf ? out : code).replace(/__DECODE__/g, () => decode), map: null };
  },
};

// Emits dist/index.html from the src template with a <script src> reference.
// Dev serves it as-is; production's postbuild.mjs inlines the script into
// dist/bundle.html (galaxy-raid does this with rollup-plugin-html2 +
// web-resource-inliner; one string replace does the same job here).
// A director build emits the same page into dist/director/ instead, and the
// script reference is the same either way because the bundle sits beside it.
const emitHtml = {
  name: "emit-html",
  writeBundle() {
    mkdirSync(OUT_DIR, { recursive: true });
    // The body is EMPTIED here: inject-body has moved that markup into the
    // payload, and src/css.ts writes it back at boot. Comments are stripped
    // first so the header comment's own mention of these tags cannot be
    // matched instead — the same hazard postbuild.mjs strips them for.
    // The <body> tag itself stays: the script is parsed where it sits, and in
    // head context document.body is null and the assignment throws.
    const html = readFileSync("src/index.html", "utf8")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<body>[\s\S]*<\/body>/, '<body>\n<script src="bundle.js"></script>\n</body>');
    if (!html.includes('<script src="bundle.js">') || !html.includes("<body>")) {
      throw new Error("emit-html: template is missing its <body> … </body> span");
    }
    writeFileSync(`${OUT_DIR}/index.html`, html);
  },
};

/* ------------------------------------------------------- closure var fixup */
// Closure emits `var` while the rest of the bundle uses `let`. Unifying on one
// spelling suits roadroller's context model, and running BEFORE terser lets
// join_vars merge the now same-kind adjacent declarations.
//
// The no-var fixer only converts what it can prove safe, and its `isGlobal` bail
// is the one that bites here: `var` at global scope creates a global-object
// property and `let` does not, so a bare top-level `var` is never converted.
// This bundle is bare top-level code (output format "es", no IIFE wrapper), so
// closure's top-level vars sit in that bail — measured, 11 of 15 convert and the
// 4 survivors are the global ones. galaxy-raid recovers those with paver's
// globalVarToLet pass on function-wrapped code, which is not part of this
// pipeline. The count is logged so a stage that stops converting anything says
// so instead of looking busy.
const eslintVarToLet = {
  name: "eslint-var-to-let",
  async renderChunk(code) {
    const eslint = new ESLint({
      useEslintrc: false,
      fix: true,
      overrideConfig: {
        parserOptions: { ecmaVersion: 2021 },
        rules: { "no-var": "error" },
      },
    });
    const [result] = await eslint.lintText(code, { filePath: "bundle.js" });
    const out = result.output ?? code;
    const count = (s) => (s.match(/\bvar\b/g) || []).length;
    const before = count(code);
    console.log(
      `eslint-var-to-let: ${before - count(out)} of ${before} var(s) converted` +
      (before && before === count(out) ? " — all global-scope, the fixer's isGlobal bail" : "")
    );
    return out;
  },
};

/* -------------------------------------------------- ported from galaxy-raid */
// The build here is DETERMINISTIC (pinned roadroller params, fixed zip
// timestamps), so one build per config is an exact measurement — no repeated
// runs, unlike galaxy-raid where paver's passes added variance. Two of its
// three candidates were measured and REJECTED; see README "Ported, and not".

// const -> let, for the same reason var -> let pays (#5/#7): the keyword swap is
// byte-neutral, but one spelling suits roadroller's context model, and running it
// before terser lets join_vars merge declarations it otherwise cannot (join_vars
// only merges ADJACENT declarations OF THE SAME KIND). Safe as a text pass here:
// every `const` in the chunk is a real declaration — checked, none inside a string
// literal — and dropping immutability cannot change behaviour in code that never
// reassigns, which is exactly what `const` was asserting.
const constToLet = {
  name: "const-to-let",
  renderChunk(code) {
    const n = (code.match(/\bconst\b/g) || []).length;
    if (n) console.log(`const-to-let: ${n} const(s) respelled`);
    return code.replace(/\bconst\b/g, "let");
  },
};

// `transparent` -> `#0000`, which is the same colour in six fewer characters
// and is worth 11 B measured. A BUILD PASS rather than a source edit, for the
// reason the whole size-golf tail exists: src/style.css and the forty hand-
// commented gradient stacks in src/elements.ts stay readable, and the byte is
// taken here. `transparent` says what it means; `#0000` does not.
//
// SAFE AS A TEXT PASS because every occurrence in this chunk is inside a string
// literal — the stylesheet, and the `bg:`/`s:` values in the element table.
// `transparent` is not a JS keyword and nothing in src/*.ts uses it as an
// identifier, checked. The count is logged and the pass throws if it ever finds
// none, which is what a rename or a refactor that moved the CSS would look like.
//
// Cheap in raw characters and NOT cheap in packed bytes, which is the lesson
// this project keeps relearning: 318 characters leave the chunk and 11 bytes
// leave the zip, because `transparent` repeated 53 times is a token roadroller
// has long since modelled. Removing repetition is close to free in both
// directions; it is unique text that costs.
const shortenTransparent = {
  name: "shorten-transparent",
  renderChunk(code) {
    const n = (code.match(/transparent/g) || []).length;
    if (!n) throw new Error("shorten-transparent: no `transparent` in the chunk — has the CSS moved?");
    console.log(`shorten-transparent: ${n} occurrence(s) -> #0000, ${n * 6} chars`);
    return code.replace(/transparent/g, "#0000");
  },
};

/* ------------------------------------------------------------- roadroller */
// Params come from rr-config.json when it exists, and from an in-process search
// when it doesn't. Pinned params are what make the build byte-deterministic —
// the search is stochastic, so an unpinned build packs a different size every
// time and dist/build.zip churns on every rebuild. Regenerate with
// `npm run roadroller-optimize` after any structural change to the game.
//
// Do NOT try to "reuse" pinned params via optimize(0): roadroller does
// `level = level || 1`, so level 0 falls through to a full fresh search and
// discards them. Skipping optimize() entirely is the only way to use them.
const RR_CONFIG = "rr-config.json";
const RR_MODULE = createRequire(import.meta.url).resolve("roadroller");
const RR_IS_FORK = !RR_MODULE.includes("node_modules");
const chunkHash = (s) => createHash("sha256").update(s, "utf8").digest("hex").slice(0, 12);

// The decoder leaks a handful of single-letter globals, and this game DOES read
// its HTML ids as bare globals (galaxy-raid's hazard exactly). The guard is in
// the ids themselves: every one is two letters, so a one-letter decoder var
// cannot shadow one. They are logged anyway — if that list ever grows a
// two-character name, this is the first thing to suspect when a packed build
// misbehaves while dist/bundle.js runs fine.
const roadroller = {
  name: "roadroller",
  async renderChunk(data) {
    console.log(`roadroller: ${RR_MODULE}${RR_IS_FORK ? "" : "  <-- registry build, NOT the fork (npm i)"}`);
    const inputs = [{ data, type: "js", action: "eval" }];

    if (existsSync(RR_CONFIG)) {
      // _fittedTo is our own bookkeeping, not a Packer option — strip it before
      // constructing the packer so an unknown key can never reach roadroller.
      const { _fittedTo, ...packerOptions } = JSON.parse(readFileSync(RR_CONFIG, "utf8"));
      const packer = new Packer(inputs, packerOptions);
      const decoder = packer.makeDecoder();
      const hash = chunkHash(data);
      if (!_fittedTo) {
        console.log(`roadroller: pinned params from ${RR_CONFIG} (no fit stamp — re-run npm run roadroller-optimize)`);
      } else if (_fittedTo.hash === hash) {
        console.log(`roadroller: pinned params, validated against this exact chunk (deterministic build)`);
      } else {
        const now = Buffer.byteLength(data);
        const drift = (((now - _fittedTo.bytes) / _fittedTo.bytes) * 100).toFixed(2);
        console.log(
          `roadroller: STALE ${RR_CONFIG} — fitted to ${_fittedTo.bytes} B (${_fittedTo.hash}), ` +
          `now ${now} B (${hash}), drift ${drift}%\n` +
          `            re-fit with: npm run roadroller-optimize`
        );
      }
      console.log(`roadroller: decoder globals ${(decoder.freeVars || []).join("") || "(none)"}`);
      return decoder.firstLine + decoder.secondLine;
    }

    const packer = new Packer(inputs, { maxMemoryMB: 150, allowFreeVars: true });
    await packer.optimize();
    console.log(
      `roadroller: no ${RR_CONFIG} — searched in-process (non-deterministic)\n` +
      `            pin params with: npm run roadroller-optimize`
    );
    const decoder = packer.makeDecoder();
    return decoder.firstLine + decoder.secondLine;
  },
};

/* ------------------------------------------------------------- fn order */
// A permutation of the top-level function declarations, fitted by
// `npm run fn-order-optimize` and stored in fn-order.json. Same discipline as
// rr-config.json: a searched artifact, applied only when it matches this exact
// chunk, and a no-op when it does not. See tools/fn-order.mjs — the finding it
// carries is that no RULE-based ordering wins, so there is nothing to
// implement here beyond applying what the search found.
//
// Runs BEFORE snapshotChunk so dist/pre-roadroller.js is the reordered chunk:
// that is what the search fits against, and what rr-config.json is stamped to.
// The pass is idempotent (the stored order is absolute), so searching an
// already-ordered chunk is sound.
const reorderFns = {
  name: "fn-order",
  renderChunk(code) {
    return reorderFunctions(code, (m) => console.log(m));
  },
};

// roadroller's exact input, for tools/find-rr-config.mjs to fit params against.
// Returning null leaves the chunk untouched.
const snapshotChunk = {
  name: "snapshot-chunk",
  renderChunk(code) {
    mkdirSync("dist", { recursive: true });
    writeFileSync("dist/pre-roadroller.js", code);
    return null;
  },
};

export default {
  input: "src/index.ts",
  output: {
    // "es", not "iife": there are no imports or exports left after bundling, so
    // the chunk is a plain script either way — but without the IIFE wrapper the
    // whole game is top-level code, which is what lets closure ADVANCED rename
    // and inline across the entire program.
    file: `${OUT_DIR}/bundle.js`,
    format: "es",
    sourcemap: false,
    generatedCode: "es2015",
  },
  plugins: [
    DIRECTOR && emojiFont,
    injectCss,
    injectBody,
    encodeRecipes,
    defines,
    typescript(),
    emitHtml,
    // The size-golf tail, and the ONLY thing a director build turns off: every
    // pass from here to roadroller is there to fit the budget, so a cut with no
    // budget skips the lot and ships the bundle rollup produced.
    golf &&
      closureCompiler({
        compilation_level: "ADVANCED",
        language_in: "ECMASCRIPT_NEXT",
        // The plugin re-parses closure's OUTPUT with acorn at ecmaVersion 2020;
        // without this cap closure emits ES2021 logical assignments (&&=) and
        // the build dies in that parse. Terser (ecma 2021) is free to
        // re-introduce them downstream.
        language_out: "ECMASCRIPT_2020",
        externs: "closure-externs.js",
      }),
    golf && eslintVarToLet,
    golf && constToLet,
    golf && shortenTransparent,
    // TERSER RUNS IN BOTH CUTS, and it is the one size-golf pass that does: the
    // gate is `production`, not `golf`. Not for the bytes -- the cut has no
    // budget -- but for `format.ascii_only` at the bottom of this config, which
    // is what postbuild.mjs's no-charset guard depends on. That guard's own
    // comment says the page is safe to ship without <meta charset=utf-8>
    // "while every byte of the page is ASCII, which every ASCII-compatible
    // default decodes identically", and names terser's ascii_only as the thing
    // that escapes the emoji. Skip terser and that stops being true: the
    // director chunk carried 254 non-ASCII characters and the cut had not
    // built at all since whichever of them landed first -- 216 em dashes and
    // 8 ellipses in comments, the circled gamepad letters in more comments,
    // and about 21 in real string literals (the codex separator, the star, the
    // padlock, the weather glyphs, U+FE0F). Comments do not survive terser and
    // string literals come out \uXXXX-escaped, so one pass settles all 254.
    // THE COST IS PAID KNOWINGLY. Running the SAME parameters means compress
    // and the default mangle come with it, so the cut is no longer the
    // readable ~100 KB page README describes -- it is a minified bundle with
    // the argument comments and the quote table's prose gone from the emitted
    // JS (the quotes themselves still render; they are strings).
    // If readability is wanted back, this is the place: mangle:false,
    // compress:false and format.comments:"all" under a `!golf` branch keep
    // every byte of ascii_only's actual work and cost only size, which is the
    // one currency this cut does not spend.
    production &&
      terser({
        ecma: 2021,
        module: true,
        toplevel: true,
        compress: {
          passes: 5,
          keep_fargs: false,
          // Booleans as 0/1, which is byte-neutral before compression and
          // measured -20 B after it: `!0`/`!1` leave the chunk entirely, and
          // one less spelling suits roadroller's context model the way the
          // var->let and const->let respellings do.
          // The flag ALSO relaxes `===` against a boolean into `==`, which is
          // safe here because nothing compares against a boolean identity:
          // the save file's three booleans are read back through `!!run.q`,
          // and the mute slot was already an integer (`cell[S_MUTE] === 1`).
          // A save written by an older build carries `true` where this writes
          // `1`; both coerce the same, so the format survives in both
          // directions.
          booleans_as_integers: true,
          unsafe: true,
          unsafe_arrows: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_methods: true,
          unsafe_symbols: true,
          pure_getters: true,
          hoist_funs: true,
          if_return: true,
          toplevel: true,
          pure_funcs: [
            "Math.abs", "Math.floor", "Math.max", "Math.min", "Math.round",
            "Math.sin", "Math.sqrt", "Math.pow",
            "Object.keys", "Object.values", "Object.entries",
            "Array.isArray", "Array.from",
            "JSON.parse", "JSON.stringify",
            "Boolean", "Number", "String", "parseInt", "parseFloat",
          ],
        },
        format: {
          wrap_func_args: false,
          semicolons: true,
          ecma: 2021,
          ascii_only: true,
        },
      }),
    golf && reorderFns,
    golf && snapshotChunk,
    golf && roadroller,
    !production &&
      serve({
        // HOST=0.0.0.0 to reach the dev server from a phone on the same
        // network — `npm run phone` prints the address and a QR for it. It
        // stays on localhost otherwise, and the browser only pops open for a
        // plain `npm start`, not when a phone is the intended target.
        open: !process.env.HOST,
        contentBase: "dist",
        host: process.env.HOST || "localhost",
        port: 8080,
      }),
  ],
};
