# Optimizations

Every measured finding from fitting this game into 13312 bytes — what was
taken, what was tried and rejected, and why. Moved here out of `README.md`,
which had become mostly this.

**The byte figures are historical.** Each was measured against the chunk as it
stood at the time, and the tree has grown a lot since; they record what a change
was worth when it was made, not what it would be worth today. The reasoning is
the part that travels.

- **The 101 quotes are the first thing the cut has that the game does not.**
  They were a `q` field on every element, and a field on a live object is
  reachable — closure cannot prove a string dead when something might read it,
  so all 101 shipped whether or not the budget could afford them. They live in
  `src/quotes.ts` now, with the three containers they sit in (the discovery
  card's `<i>`, the cauldron line, the codex row's `.Q`) and the two CSS rules
  that style those, and every one of the three call sites in `game.ts` is a
  `__DIRECTOR__ ? … : ""`. ADVANCED folds those to empty strings, finds the
  four exports unreferenced and deletes the table, the markup and the rules
  together. Worth **&minus;1841 B**, 13.8% of the budget: 13306 → **11465**.
  The rules go with the strings for the same reason — a selector in
  `style.css` ships whether or not anything ever wears the class.
- The pipeline is galaxy-raid's, size-golf tail included. `prebuild` runs the
  `tsc` type check, then rollup bundles `src/index.ts` and — in production only
  — puts it through **closure ADVANCED → eslint `no-var` → `const`→`let` → terser → the
  roadroller fork**;
  `postbuild` inlines the packed script into the `src/index.html` template,
  minifies the page with **html-minifier-next**, zips it with fixed DOS-epoch
  timestamps, and recompresses that zip with **ECT then advzip**. Dev
  (`npm start`) skips the whole tail, so a watch build stays readable and fast.
- **The director's cut builds its own emoji font, and it is 237 KB instead of
  1317.** `tools/emoji-font.mjs` fetches Noto's source SVGs for exactly the 245
  sequences the table shows (`tools/emoji-svg.mjs`, keyed off `e:` fields, so
  adding an element fetches its artwork on the next build) and compiles them
  with **nanoemoji** into a COLRv1 font. Needs Python with `nanoemoji` and
  `ninja`; without them the cut still builds, falling back loudly to the nine
  CDN chunks it used before, which are five and a half times heavier and
  identical on screen. `npm run emoji-font` builds it alone. The whole font is
  cached in `.fonts/` under a hash of the sequence set, so it is built once.
- **The obvious way to do that is wrong, and it fails silently.** harfbuzzjs
  ships `harfbuzz-subset.wasm` — no Python, no native build — and subsetting
  `Noto-COLRv1.ttf` with it gives a **216 KB** woff2 whose 245 sequences all
  shape to one glyph. It renders **nothing**. That build of harfbuzz has no
  colour-table support: it drops `COLR` and `CPAL`, and `CBDT`/`CBLC` from the
  bitmap build (10.18 MB &rarr; 5 KB), leaving structurally valid glyphs with no
  paint. `subset-font` bundles the same harfbuzzjs and fails identically.
  Passing `COLR` through untouched cannot work either — the layer glyphs it
  references have no cmap entry, so they go, and the glyph ids are remapped
  underneath it.
  **SHAPING IS NOT RENDERING**, which is the finding worth keeping: the broken
  subset passed a shaping check, loaded in Chrome without complaint, and drew
  blank tiles. Only a screenshot caught it. `verifyRendering` in
  `tools/emoji-font.mjs` is what shaping is still good for — it counts VISIBLE
  glyphs, because a sequence carrying U+FE0F shapes to two (the emoji, and a
  zero-advance glyph for the selector, since Noto's filenames drop FE0F so
  nanoemoji builds no ligature for it) and renders perfectly. A strict glyph
  count calls 30 of 245 broken; the visible count calls none.
- **The CSS is not in the HTML.** `src/style.css` is the readable source of
  truth; the rollup config runs it through **cssnano** (`postcss.config.js`,
  preset `advanced`) at config load and injects the minified text into
  `src/css.ts`, which assigns it to the empty `<style id=st>` in the template.
  That puts the stylesheet inside the roadroller-packed payload instead of the
  page's deflate stream, which is galaxy-raid's OPTIMIZATIONS.md #18 (the move)
  and #71 (filling a `<style>` that is already in the document, rather than
  writing or creating one). Measured here, from 10834 bytes:
  **cssnano alone −564** (CSS still in the HTML), **moving it into the payload a
  further −545**, **html-minifier −51**, **re-fitting the roadroller params −23**
  → **9651 bytes, 72.50% of the budget.**
  `src/style.css` is read ONCE, at config load: after editing it during
  `npm start`, restart the watcher.
- **The function order is SEARCHED, not reasoned about** (galaxy-raid
  OPTIMIZATIONS.md #134, ported here). Worth **−49 bytes** on this project:
  13347 → 13298, from a permutation of the 54 top-level function declarations
  in the packed chunk (13308 chars, 30% of it). A permutation cannot change the
  chunk's length — only how well roadroller's context model predicts it.
  The finding is that **every rule-based ordering loses.** Measured on
  galaxy-raid against the compiler's own emission order: similarity-clustered
  by 6-gram Jaccard **+50**, reverse **+51**, size ascending/descending
  **+71/+78**, lexical **+81**. "Put similar functions next to each other" is
  the pass anyone would write first and it is nearly the worst — closure emits
  in definition order, which already groups mutual callers and shared
  vocabulary, and a text-similarity metric breaks that up chasing token
  overlap. Compressor locality is not text similarity.
  So there is no rule to implement. `tools/fn-order.mjs` applies a stored
  permutation from `fn-order.json`, the same discipline `rr-config.json` gets;
  `npm run fn-order-optimize` hill-climbs random swap/move against the packed
  size, A/Bs the winner on the real zip, and writes only on a strict win. Here
  that took 2871 proposals over 900s, and the returns fall off a cliff — it was
  −41 by proposal 362 and −69 by 2771, so **budget the long tail as insurance
  on the win, not as a hunt for more.** The pass runs between terser and the
  snapshot, so `dist/pre-roadroller.js` is the reordered chunk.
  **Keyed by a hash of each function's TEXT**, never by index or name: minified
  names are one letter and move on any edit, and an index-keyed order would
  apply a *wrong* permutation to a changed chunk — which still parses and still
  runs, so nothing would catch it. On a mismatch the pass no-ops and warns; a
  stale order costs bytes, a misapplied one costs bytes and hides. Absolute
  order also makes the pass idempotent, which is what lets the search run on an
  already-reordered chunk.
  The zip A/B runs the REAL `postbuild.mjs` rather than a copy of its
  inline/minify/zip chain, so those numbers cannot drift from the build's.
  Two costs. **The order is fitted to one exact chunk**, so any source edit
  invalidates it, and unlike `rr-config.json` there is no keep-the-incumbent
  fallback — a permutation of a changed function set is meaningless. And **the
  params and the order are co-fitted**: re-search the order after source
  changes, the params on their own schedule, each a strict-win A/B. Do not
  chase the loop between them.
- **The fn-order search space is NOT authorable, and trying costs 7 B.** The
  pass permutes top-level `FunctionDeclaration` nodes — 54 of them — so the
  obvious idea is to write more of the program that way and give the search
  more material. `frame`, the rAF loop in `src/index.ts`, is the one candidate:
  it is authored `const frame = (t) => …` and ships as `let si=e=>{…}`, outside
  the reorderable set. Rewritten as `function frame(t) {…}` the chunk gains
  nothing — `fn-order` still reports **54** and still matches, because terser
  inlines the function into its single `requestAnimationFrame(frame)` call site
  as a NAMED FUNCTION EXPRESSION (`requestAnimationFrame(function e(i){…})`)
  rather than leaving a declaration behind. **13288 → 13295**, and the extra
  bytes are the name: single-use and self-referential, it recursed through the
  top-level binding when it was an arrow and has to carry its own name when it
  is not.
  So what lands as a top-level declaration is decided by terser's inlining, not
  by the spelling in the source. The 54 are what they are.
- **Only UNIQUE PROSE is worth moving into the payload.** The same trade as the
  stylesheet above, applied to what markup was left, and the rule that came out
  of measuring it: the zip DEFLATES the markup, roadroller MODELS the payload,
  so text that repeats is already cheap in the HTML and text that does not is
  cheap in the payload. The help line under the board — the biggest block of
  unique prose in the template — moved into `src/css.ts`, appended with
  `gl.after()` as a text node in exactly the place the template had one, for
  **−17 B**. The wordmark's seven `<span>`s were tried the same way
  (`"AlchemY".replace(/./g, ...)`) and cost **+5 B**: seven identical tags are a
  handful of deflate backreferences, and the code to generate them is not.
  Nothing but a check would notice the help line vanishing, since it has no
  element of its own — `boot: the help line is appended into <f>` is that check.
- **Three smaller ones, measured together (−34 B).** `decodeEntities` in the
  html-minifier options ships `·` and `Ⓐ` as UTF-8 rather than `&middot;` and
  `&#9398;`, 2–3 bytes where the entity was 7–8 (**−5 B**, and it takes the
  `<f>` block from 250 bytes to 198). The two `@media (pointer: coarse)` blocks
  became one: cssnano does not merge same-condition queries across the rules
  that sit between them, so the query string was paid for twice (**−6 B**;
  `npm run mobile-check` confirms the 44px tap targets survived). And `<title>`
  is gone (**−18 B**) — the tab falls back to the filename, which is the price.
- **The element table omits the names it can derive.** For 98 of the 101, `n`
  is just the id with a capital, so the table leaves it out and
  `src/elements.ts` fills it in; only Polar Bear, Crystal Ball and Light Bulb
  are written out. Worth **-162 B** end to end, and it is the
  one field that pays: a NEAR-miss repeat ("sunflower" then "Sunflower") costs
  roadroller real bits, where an exact repeat costs it almost none.
  That is also why the obvious bigger idea does NOT work. Re-encoding the
  whole table as a delimited string with recipes as base-36 indexes saves
  **3714 B of raw source** and only **241 B packed** — worse than deriving
  the names alone, because the parser costs more than the structure it
  removes and the id strings inside recipes were nearly free already.
  Measured, not reasoned about: pack the real chunk both ways before
  trading readability for bytes.
- **The bundle ships no test hooks at all.** `window.CA` cost **105 B** —
  closure cannot rename anything reachable from it, and `closure-externs.js`
  pinned every name. It is gone, and `check.mjs` drives the page the way a
  player does: `attempt(a, b)` releases the altar, clicks tile a, clicks
  tile b and releases again, all in ONE round trip, because `selectAt` is
  synchronous — so the suite is no slower than the hooks were. State is read
  off the page, except the run flags — `questDone`, `peaceDone` and
  `fullDone` — which are read out of the SAVE, since the goal line that used
  to carry them is status-only now.
  One thing has no DOM form: the recipe tree. Those 25 assertions now parse
  `src/elements.ts` in node, which checks the tree as WRITTEN rather than as
  SHIPPED — the one place in the file where a mangled build could still pass.
  Taken knowingly, in exchange for the bytes.
  Driving the board rather than the hooks caught two things the hooks had
  been hiding: a run script that made a Chick from a Bird it had not
  discovered yet (`CA.attempt` never checked you held the ingredients), and
  a mobile-probe false positive where the discovery rays, clipped by an
  `overflow: hidden` parent, were counted as page overflow.
- **The elements are read as globals, and the ids are two letters.** An element
  with `id=gl` is already `window.gl`, so `getElementById` — and the `$` helper
  that wrapped 50 calls to it — buys nothing: **-100 B** for deleting both.
  The names have to survive the whole tail, so they are pinned in
  `closure-externs.js` (without an entry, closure ADVANCED fails the build on
  the undeclared variable — the loud failure) and declared in `src/dom.d.ts`
  for `tsc`. TWO letters, never one: roadroller's decoder leaks a handful of
  single-letter globals of its own — the build logs them — and a one-letter id
  would be shadowed by one silently, in the packed build only. Terser's mangler
  reserves every free name it sees, so its own two-letter locals (`ae`, `ce`, …)
  steer clear.
- **Every CSS class is one letter.** Case matters, so there are 52 and 47 are
  used: **-127 B**. The names carried the meaning, so `src/style.css` opens with
  the legend that replaces them, and it is the one place to look when a selector
  stops making sense.
- **A class that lands on one tag only does not name the tag: -3 B.** `M` is set
  on `<body>` and nowhere else, so `body.M h` was five selectors carrying a
  qualifier that could never change what matched. `.M h` still outranks the
  `#hd`/`#gd` display rules it has to beat, at (1,1,0) against (1,0,0).
- **`html, body { height: 100% }` is NOT redundant on body.** Measured and
  rejected twice over: dropping `body` costs **+2 B** packed even though it is
  five characters shorter, and it grows the full board by 18px of dead scroll.
  That 18px is `f`'s trailing margin, which is clipped from the scrollable
  overflow only while body is `height:100%` with content overflowing it — the
  same mechanism the padding note on `f` describes.
- **`.map` is the loop, not `.forEach`: -10 B.** Twenty-one sites across
  `elements.ts`, `game.ts` and `sfx.ts`, four characters each. Every receiver
  in `src/` is a real array — `tiles`, `menuButtons()` and the chained
  `.filter()` results all return `T[]` — so the swap is legal everywhere it
  is made. It is NOT legal on a Set or a NodeList, which have `forEach` and
  no `map`; that is why `tools/css-diff.mjs` still calls `forEach` on a
  `querySelectorAll` result, and why `found` (a Set) never took part.
  The risk worth measuring is closure deciding `map` is side-effect-free and
  deleting calls whose result is unused. It does not: the compiled chunk
  carries 25 `.map(` against 25 in the source and zero `.forEach(`, counted
  rather than assumed. The cost is a throwaway array per call, and the only
  one on a warm path is `renderFocus` — driven by input events, never by the
  rAF loop, which reaches `moveCursor` only on a d-pad edge.
- **`Array.isArray(x)` is `x && x.map`: -7 B.** Four sites in `loadState`, all
  duck-typing JSON that came back out of localStorage. The left half is not
  optional: `run.f.map` on its own throws on a save with no `f`, and that one
  is outside the try/catch, so it would take the whole boot with it.
  `x?.map` would say it in fewer bytes and CANNOT be used — the closure
  plugin re-parses closure's output with an acorn-walk too old to visit a
  ChainExpression, and the build dies in that parse. The README already said
  that about `?.()`; it is true of `?.` property access too, confirmed by
  building it.
  The trade is one case where the two tests disagree: a `run.f` that is an
  OBJECT carrying a `map` property passes the duck test, `Array.isArray` fails
  it, and the branch then throws on `.filter` and boots to an empty board.
  Only hand-edited localStorage produces it, and New game clears it, so it is
  taken knowingly. Checking `.filter` instead — the method every one of the
  four sites actually calls FIRST — closes that case for **+2 B**, and is the
  swap to make if a save-corruption bug ever shows up here.
- **The audio gesture-unlock hook is gone: -8 B.** `wakeAudio` sat on
  `document.onkeydown` and `document["onpointerdown"]` to open the
  AudioContext inside a user gesture, from back when the music started on
  load. It starts with the BOARD now, and the board is only reachable through
  the menu, so the page always has sticky activation by the time anything
  asks for audio. Verified rather than assumed, and the project harness cannot
  verify it — `cdp.mjs` launches Chrome with
  `--autoplay-policy=no-user-gesture-required`, so the 114 checks are blind to
  autoplay by construction. Tested on a scratch copy with that flag stripped
  and `AudioContext` instrumented: entering the game by mouse AND by keyboard
  both leave the context `running`.
  Two things made it safe to drop. `pump()` calls `ac()` every 200ms while the
  music flows and `ac()` resumes a suspended context, so the engine already
  retries — an externally suspended context came back on its own, with no
  input. And every sound effect calls `ac()` from inside a click handler.
  The exposure is Safari, which wants TRANSIENT activation — a resume inside
  the handler's own call stack — where sticky is not enough. Nothing on the
  entry path plays a sound (`menuGo` just forwards `b.click()`), so the first
  `ac()` there lands in the frame loop, outside any gesture, and the music
  would stay silent until the first tile tap unlocks it through `SFX.select`.
  Taken knowingly, and untestable from this machine: `npm run phone` serves
  the page to a real device if it ever needs checking.
- **innerHTML instead of textContent is NOT worth it: 3 B.** Nine writes, two
  characters each, and roadroller predicts the longer word almost for free.
  It would also make the first element named "Salt & Pepper" render wrong,
  silently. Measured and rejected.
- **Event handlers are properties, not listeners: -6 B.** Every listener in the
  game is the only one on its target for that event, so `addEventListener("click",
  fn)` is `onclick = fn`. The trap is closure: the pinned 2021 compiler knows
  `onclick` and `onkeydown` but not `onpointer*` or `onanimationend`, and it
  silently RENAMES an unquoted assignment to those — a bundle that boots and
  quietly cannot drag. Written quoted (`d["onpointerdown"] = …`) they survive,
  and terser folds them to dot form downstream. Straight from galaxy-raid's
  OPTIMIZATIONS.md #53, which found the same trap.
- **The gamepad lookup lost its try/catch and its loop: -19 B.** One
  `.find(g => g && g.connected)` over `getGamepads()` replaces a try, a
  feature-tested temporary and a for-with-break. The feature test itself stays:
  `getGamepads` is `[SecureContext]`, so it is undefined when `npm run phone`
  serves the page over plain http to a device, and calling it would throw out of
  the rAF loop — killing the loop, not just the pad. `?.()` says that in fewer
  bytes and cannot be used: the closure plugin re-parses closure's output with an
  acorn-walk too old to visit a ChainExpression, and the build dies in that parse.
- **Measured and rejected in the input path.** `e.keyCode` numbers instead of
  `e.key` strings is **-12 B** and was not taken: it trades a live API for a
  deprecated one and adds a second key/number contract, since check.mjs's
  synthetic events would have to carry `keyCode` too — a sync hazard for 0.1% of
  the budget, with 800 B of headroom in hand. Deleting the `initKeyboard()`
  wrapper now that it holds one assignment is **+2 B**: closure already inlined
  it, and the import-for-side-effect shape costs more than the call did.
  **And three ports from galaxy-raid's gamepad helpers, all three rejected**,
  which is the sharpest reminder yet that a finding does not travel between
  chunks. Measured one at a time against 13286, with the fn-order fit still
  valid (it keys on top-level `function` declarations and `pollPad` is not one
  after closure, so these are like-for-like):
  `(p0.buttons[i] || 0).pressed` for `p0.buttons[i] && p0.buttons[i].pressed`
  **+8 B**; dropping the `p0.axes &&` guard **+7 B**; `for (const d of
  Object.keys(dirs))` to `.map` **+4 B**; all three together **+9 B**.
  Their OPTIMIZATIONS.md #15 measured the same `.map` conversion at **&minus;18.3**
  over six sites, gamepad helpers included, on the finding that loop scaffolding
  plus repeated `X[i]` subscripts costs more than a callback's bound parameter.
  The opposite holds here, and the reason is the one this file keeps arriving
  at from other directions: **a repeat is nearly free and a novel shape is
  not.** `p0.buttons[i]` said twice is a token run roadroller has already
  modelled — the same argument as `Math.` thirty-seven times beating a
  destructure, and as the four near-identical shine gradients beating the
  template that removes them. Removing a repeat is only a win when what
  replaces it is cheaper than free, and `|| 0).pressed` is not.
  Note also that our own `.map` win is `.forEach` &rarr; `.map`, one shorter word
  in an identical shape; `for`-of &rarr; `.map` is a different shape and loses.
- **No `const { sin, cos, ... } = Math`.** Destructuring Math into short
  locals is the classic size-golf move and it is **38 B WORSE** here.
  `Math.` is a five-character string repeated 37 times, which roadroller
  predicts almost for free, where the destructuring pattern is a one-off
  it has to spell out in full. Same lesson as the element table: repetition
  is cheap, novelty is not.
- Two risks come with that, and both have a probe rather than an assumption
  behind them. `npm run fouc-check` times the moment the sheet lands against the
  browser's own first-paint entry (the sheet is applied by a script at the end of
  `<body>`, after a decode that takes a few hundred ms — currently applied at
  ~1203ms, first paint ~1236ms, so no unstyled frame). `npm run css-diff` swaps
  the raw stylesheet back into the packed page and compares every computed
  property of every element: the only differences cssnano `advanced` produces
  are its rebased z-indexes (5/6/8/9 → 1/2/3/4, order intact) and its renamed
  `@keyframes`. Both are safe **only** because nothing in `src/*.ts` reads an
  animation name or a z-index back out of the CSS; if that ever changes, drop the
  preset to `default`.
- The `no-var` stage exists to unify declaration spelling: closure emits `var`,
  everything else is `let`, and one spelling both suits roadroller's context
  model and lets terser's `join_vars` merge the now same-kind adjacent
  declarations. It converts 11 of 15; the 4 survivors are global-scope, where the
  fixer correctly refuses (a top-level `var` makes a global-object property and
  `let` does not). Worth 12 bytes here.
- **`const` → `let` runs for the same reason, and pays 9 bytes.** Seven `const`s
  survive terser; respelling them leaves one declaration keyword in the whole
  chunk. Byte-neutral before compression, like the `var` swap — the win is
  roadroller's context model, plus `join_vars` merges that only fire between
  adjacent declarations *of the same kind*. It is a text pass, which is safe
  here because all seven are real declarations (none inside a string literal)
  and dropping immutability cannot change behaviour in code that never
  reassigns — which is exactly what the `const` was asserting.
- **Two more galaxy-raid passes were ported, measured, and rejected.** Both
  numbers are exact rather than averaged: this build is byte-deterministic, so
  one build per configuration settles it.
  - **oxc compress-only after terser: +22 bytes.** It is a −7.7 win in
    galaxy-raid (its OPTIMIZATIONS.md #44), where it feeds `paver`; there is no
    `paver` here, so the chain is just terser → oxc → roadroller and oxc's
    house style — backtick delimiters, `0===t` flips, literal unicode — costs
    more than it saves against this chunk. Not a stale-parameter artifact: a
    fresh `roadroller-optimize` search afterwards kept the incumbent params
    (27 B better than anything it found), so the pinned config genuinely fits.
  - **`globalVarToLet` (their #12): a no-op, and for a structural reason.** It
    recovers the vars eslint refuses at global scope by running the same fixer
    on function-wrapped code, so the `isGlobal` bail cannot fire. Run here,
    wrapped and unwrapped give *identical* results — 12 reports, zero fixes.
    The 27 `var`s left in this chunk are already function-scoped (`for(var r=0`
    …) and unconvertible for real reasons: closure's name coalescing declares
    in a block and uses outside, plus loop-with-closure capture. galaxy-raid's
    precondition — top-level `var`s in bare script code — does not hold here.
- Still *not* carried over from galaxy-raid, being fitted to that game's chunk:
  the swc re-minify, `paver`, `fn-order.json`. Its `web-resource-inliner`
  step is not needed either — there is one script to inline, and one string
  replace does it.
- **Unlock all and Reset everything are development tools, and a plain build
  does not contain them.** They sit behind a `__DEV__` literal that the
  `defines` plugin substitutes before closure runs, so ADVANCED deletes the
  branch, then finds `unlockAll` and `wipeAll` unreferenced and deletes those
  too — the confirm strings go with them. Worth **&minus;93 B**, which is what
  took the bundle back under budget. `npm run build-dev` is the build that
  keeps them; it reads `npm_lifecycle_event` rather than an env var, because
  `DEV=1 rollup -c` is not portable to the cmd.exe npm runs scripts in.
- **One test suite covers both builds.** `check.mjs` asks the menu which build
  it is looking at, then either exercises the two tools or asserts they are
  genuinely absent — checking *both* labels, so a half-applied gate cannot pass.
  Against a shipping bundle it reports `skip 10 development-tool checks`; run
  `npm run build-dev` first to cover them, and `npm run build` again before
  committing `dist/`.
- **A bare `void el.offsetWidth` does not survive closure ADVANCED**, and its
  removal is silent. Restarting a CSS animation is remove-class &rarr; *flush*
  &rarr; add-class; the flush is a layout read whose value is discarded, which
  is exactly the shape ADVANCED deletes as dead code. All three of ours went,
  and every repeat animation quietly stopped replaying: a second dead end in a
  row did not shake, a repeated dupe did not pulse, back-to-back first
  discoveries did not re-fade. `reflow()` in `game.ts` feeds the read into a
  branch instead, which closure cannot fold away, and `check.mjs` counts
  `animationstart` events rather than looking for the class — the class is
  present either way, so only the event proves the animation ran.
- **The build is byte-deterministic.** Two things buy that: the pinned DOS-epoch
  zip timestamp, and `rr-config.json` — roadroller's parameter search is
  stochastic, so the params are fitted once and pinned, and the build skips
  `optimize()` entirely. It prints `fitted to this exact chunk` when they match
  the code being packed and `STALE` when they don't; stale params cost bytes but
  never break the build. Re-fit with `npm run roadroller-optimize` (~150s), which
  keeps the incumbent unless the new search actually packs smaller.
- **`closure-externs.js` is load-bearing.** ADVANCED renames every property it
  has not been told about, so the file pins the three boundaries that leave the
  bundle: the `window.CA` test hooks, the localStorage save shapes, and the
  `ElementDef` fields. It also pins DOM names the pinned 2021-era compiler is too
  old to know — `gridTemplateColumns` broke every cursor move until it was added,
  and `block`/`passive` would have failed *silently*. Add to that list, never
  trim it.
- Tests need Node 22+ (built-in WebSocket) and a local Chrome/Edge, and drop
  `.shot-*.png` screenshots next to `check.mjs`. They run against the fully
  packed production bundle, which is what makes them a real check on the tail.

