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
import { ESLint } from "eslint";
import { createRequire } from "module";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { execSync } from "child_process";

// The page CSS ships inside the JS bundle: src/css.ts assigns it to the empty
// <style id=sty> in the template (galaxy-raid OPTIMIZATIONS.md #18/#71 — the
// packed payload compresses it better than index.html's deflate stream does).
// src/style.css stays the readable source of truth; it is minified here with
// the SAME cssnano pass postbuild.mjs hands to html-minifier, and injected as
// the __MARKUP__ constant. Read ONCE at config load: a watch-mode rebuild does
// NOT pick up edits to style.css, so restart the watcher after touching it.
const minCss = execSync("npx postcss", { input: readFileSync("src/style.css", "utf8") }).toString().trim();
if (/<\/script|[\`]|\$\{/.test(minCss)) {
  throw new Error("style.css contains a sequence unsafe inside an inline script");
}

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
    return { code: code.replace(/__MARKUP__/g, () => JSON.stringify(minCss)), map: null };
  },
};

// `npm run build` -> production; `npm start` (watch) -> dev
const production = !process.env.ROLLUP_WATCH;

// Emits dist/index.html from the src template with a <script src> reference.
// Dev serves it as-is; production's postbuild.mjs inlines the script into
// dist/bundle.html (galaxy-raid does this with rollup-plugin-html2 +
// web-resource-inliner; one string replace does the same job here).
const emitHtml = {
  name: "emit-html",
  writeBundle() {
    mkdirSync("dist", { recursive: true });
    // Anchored to the document end: a bare "</body>" also appears in the
    // template's header comment, and a first-match replace injected the
    // script tag into that comment once (postbuild then stripped it away).
    const html = readFileSync("src/index.html", "utf8").replace(
      /<\/body>\s*<\/html>\s*$/,
      '<script src="bundle.js"></script>\n</body>\n</html>\n'
    );
    if (!html.includes('<script src="bundle.js">')) {
      throw new Error("emit-html: template is missing its </body></html> tail");
    }
    writeFileSync("dist/index.html", html);
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

// The decoder leaks a handful of single-letter globals. That is only a hazard
// for a game that reads HTML ids as bare globals (galaxy-raid does, and guards
// it); here every lookup is getElementById("literal"), so the letters cannot
// shadow anything. This still reports them, because it is the first thing to
// suspect if a packed build misbehaves while dist/bundle.js runs fine.
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
    file: "dist/bundle.js",
    format: "es",
    sourcemap: false,
    generatedCode: "es2015",
  },
  plugins: [
    injectCss,
    typescript(),
    emitHtml,
    production &&
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
    production && eslintVarToLet,
    production &&
      terser({
        ecma: 2021,
        module: true,
        toplevel: true,
        compress: {
          passes: 5,
          keep_fargs: false,
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
    production && snapshotChunk,
    production && roadroller,
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
