# Color Alchemy

A standalone combination game, originally built on the galaxy-raid base: the
dark look, the build shape, and the CDP test harness all came from there.
Combine two elements to create new ones, starting from the three additive
primaries.

## Build & run

```
npm install
npm run build             # tsc check -> rollup (+ size-golf tail) -> postbuild
npm test                  # 118 headless checks against dist/bundle.html
npm start                 # dev: watch + serve on http://localhost:8080
npm run roadroller-optimize   # re-fit rr-config.json after a structural change
npm run fouc-check        # is the sheet in place before the first paint?
npm run css-diff          # does cssnano change any computed style?
npm run music-check       # is the shipped page actually producing audio?
npm run mobile-check      # phone and tablet layout: overflow, tap targets
npm run audio-bench       # what a sample costs, against the callback budget
```

- **Play:** open `dist/bundle.html` — the whole game in one file.
- The pipeline is galaxy-raid's, size-golf tail included. `prebuild` runs the
  `tsc` type check, then rollup bundles `src/index.ts` and — in production only
  — puts it through **closure ADVANCED → eslint `no-var` → terser → the
  roadroller fork**;
  `postbuild` inlines the packed script into the `src/index.html` template,
  minifies the page with **html-minifier-next**, zips it with fixed DOS-epoch
  timestamps, and recompresses that zip with **ECT then advzip**. Dev
  (`npm start`) skips the whole tail, so a watch build stays readable and fast.
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
- **The element table omits the names it can derive.** For 97 of the 100, `n`
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
  off the page; `questDone` and `fullDone` are not stored anywhere visible,
  but `hud()` composes the goal line from them, so the line IS the state.
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
- Still *not* carried over from galaxy-raid, being fitted to that game's chunk:
  the oxc/swc re-minifies, `paver`, `fn-order.json`. Its `web-resource-inliner`
  step is not needed either — there is one script to inline, and one string
  replace does it.
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

## Source layout

```
src/index.html    template: markup only — no CSS, no JS (the two-letter ids
                  are the contract with the game code and check.mjs)
src/dom.d.ts      those ids, declared as the globals the game reads them as
src/style.css     the page stylesheet, minified into the payload at build time
src/css.ts        fills <style id=st> with it, imported first from index.ts
src/music.ts      the background track: the floatbeat engine, and the node
                  that plays it
src/sfx.ts        WebAudio synth for the interface sounds, and the shared
                  AudioContext the music borrows
src/elements.ts   the element tree: names, quotes, icons, recipes
src/game.ts       state, grid, the cauldron, combining, goal overlays,
                  scoring and persistence
src/input.ts      keyboard listener + gamepad polling
src/index.ts      entry: boot, gamepad frame loop

experiments/astralblur.js   the original floatbeat, kept as the reference the
                            port is checked against

rollup.config.mjs      bundling + the production closure/terser/roadroller chain
postcss.config.js      cssnano (preset advanced), shared by rollup and postbuild
closure-externs.js     names ADVANCED must not rename (see above)
rr-config.json         pinned roadroller params — deterministic builds
postbuild.mjs          inline -> minify -> single file -> zip -> ECT -> advzip
tools/find-rr-config.mjs   re-fits rr-config.json against dist/pre-roadroller.js
tools/fouc-probe.mjs       first-paint timing vs. the moment the sheet lands
tools/css-diff.mjs         computed styles, minified stylesheet vs. raw
tools/music-probe.mjs      captures the shipped page's own audio callback
tools/responsive-probe.mjs the page at seven viewports, phone to laptop
tools/audio-bench.mjs      ns per sample vs. the render-ahead budget
tools/build-visualizer.mjs splices src/music.ts into the visualizer experiment

experiments/menu-typography.html   the seven title settings the current one
                                   was chosen from
experiments/visualizer.html        six spectrum-analyser options, on the game's
                                   own music — not wired into the game yet
```

## Title screen

The game boots to a title screen — *COLOR* in an animated rainbow over
*AlchemY* in small caps, the two locked to the same width — with four options:

- **Continue** — resume the current run (a completed run returns to its
  completion screen).
- **New game** — restart; asks for confirmation when a run is in progress.
- **Highscore** — the quest best, and the complete-run best, which shows as
  `???` until the game has actually been completed.
- **Encyclopedia** — the player's journal: every discovered element with its
  quote and the combinations *actually performed* (alternate recipes never
  tried stay unspoiled; starters are listed as "primordial"). The journal
  persists across runs - New game wipes the board, never the knowledge.

Reopen it any time with the HUD **Menu** button — which names its shortcuts,
**Esc** and Ⓑ — with either of those (when nothing is selected), or with
**Start** on a gamepad; Escape/Ⓑ/Start close it again.

## Rules

- You start with **Red**, **Green** and **Blue**.
- Pick any two elements to attempt a combination. Every attempt costs a move —
  successes, failures and rediscoveries alike.
- **Hint** — the HUD button, **H**, or Ⓨ on a gamepad — names two elements you
  already hold that make something you do not, and costs a move for it, exactly
  like an attempt. It reveals the *pair* and never the result, so the discovery
  card keeps its surprise. The price is the point: a hinted run can never
  quietly out-rank an unhinted one.
- **One hint at a time.** Until you have actually made it, pressing hint again
  just shows the same pair and highlights it once more, free — you paid for
  that answer, so re-reading it is not a second purchase. Only moving on to a
  *new* answer costs another move, which is also what stops you re-rolling
  cheaply for an easier pair. A hint retires the moment its result exists, so
  reaching it some other way (an alternate recipe, or stumbling onto it)
  releases the next one. It is not saved with the run: a reload forgets the
  standing hint, which can only ever cost you, never the reverse.
- Each element has a name, an icon (a plain square for the colors, an emoji or
  a gradient swatch for the rest, and inline SVG for the Prism) and a quote,
  which the cauldron prints under the result.
- **The cauldron** is docked to the bottom of the viewport — two slots and a
  result well, in sight however far the board has scrolled. The room for the
  last row of tiles to scroll clear of it is `--dock` of **footer padding** —
  not padding on `body` and not a trailing margin, both of which get clipped
  from the scrollable overflow when the scroll container is `height: 100%`
  with content overflowing it. Padding inside the last element in the flow is
  real box height, so it survives. The toast and the keyboard cursor
  (`scroll-margin-bottom`) both step over the dock too.
- **One element, three states, on the tile you keep tapping.** The first tap
  picks it — cyan, and it lands in the left slot. A second tap on the same
  tile **locks** it, gold, and a 🔒 badge appears on the tile and on the slot
  together, the slot also growing the ring and the X. A third lets it go.
  Tapping a DIFFERENT element mixes the two, and the lock is the whole
  difference in what happens next: a loose pick is spent by the mix it makes,
  so the board comes back empty and the next pair starts from nothing, while a
  locked one survives every mix — which is what makes trying Fire against ten
  things ten taps rather than twenty. Nothing else on the board is ever
  marked: the pair you just tried sits in the altar, not on the tiles.
  The badge is there so the state does not rest on gold-versus-cyan alone —
  a distinction a player has to be told, and one a colour-blind player may
  never see. It is one rule for both places, `#ca.y::before, .t.e::after`,
  so the two can never disagree about what is locked.
- Letting go empties the whole altar, not just the pick. Escape / ⓑ does it
  from anywhere, as does the **X** on the slot once the pick is locked.
- After each attempt the second slot and the well empty themselves — after
  about a second for a dead end, two for a discovery — and a locked element
  is left facing an empty slot, ready for the next try. Nothing to dismiss:
  there is no discovery card any more, which is why `phase()` has only three
  states.
- A pair that combines into nothing shakes the **cauldron** red rather than the
  two tiles — the pair you tried is sitting in the slots, so that is where the
  answer belongs. A pair you have already combined still pulses the element it
  makes, out on the board.
- **The quest:** forge the 🌈 **Rainbow** (White + Prism, or Sun + Rain)
  and the 🦄 **Unicorn**. When you hold both, your move count is compared with
  the stored best and kept if lower. You can then keep playing.
- **The endgame:** discover all 100 elements. The total move count of a full
  clear is the *hidden highscore* — it is only ever compared and shown on the
  completion screen, which only a full clear reaches.
- Your run persists across reloads. Restart (double-press to confirm) wipes
  the run, never the bests.

## On a phone

The layout is fluid rather than broken into breakpoints: the grid is
`repeat(auto-fill, 92px)` inside `width: min(96vw, 640px)`, so it lands on 3
columns at 320-414px and 6 from a tablet up, and the title scales on `vw` with a
cap (`min(17vw, 100px)`), the two words staying locked to each other at every
size. `npm run mobile-check` walks the packed page through seven viewports —
320x568 up to 1280x800 — in each of the states that lay out differently: title
screen, board, a result in the cauldron, a toast, the encyclopedia. It reports
horizontal overflow, any element wider than the screen, the column count and
every tap target under 44px, and drops `.shot-mob-*.png` for a visual pass.

It found two things worth fixing, both now fixed:

- **The toast was clipped on a phone.** It was `white-space: nowrap`, and the
  longest hint the game can produce — *Hint: try Cloud + Electricity —
  already paid for* — is 377px wide. On a 320px screen it hangs 29px off each
  edge,
  where `overflow-x: hidden` on the body silently cut both ends off. It is now
  bounded by `max-width: calc(100vw - 24px)` and wraps, staying one line
  wherever one line fits.
- **The HUD buttons were 23px tall**, which a mouse hits and a thumb does not.
  Under `@media (pointer: coarse)` they take `min-height: 44px` — a pinned
  target rather than padding arithmetic — and nothing changes for a mouse, which
  the probe checks both ways (coarse 101x44, fine 93x23).

Still worth knowing: there is no `env(safe-area-inset-*)` padding, so on a
notched phone in landscape the footer can sit under the home indicator.

## Controls

| Input    | Combine | Hint | Let go of the pick | Mute |
|----------|---------|------|----------------------------|------|
| Mouse    | click one element to pick it, then another to mix — or drag one onto another | the HUD **Hint** button | click it twice more (lock, then let go), or the **X** on the cauldron | the HUD **Sound** button |
| Touch    | tap one element to pick it, then another to mix — or long-press (~¼s) to lift, then drag onto another | the HUD **Hint** button | tap it twice more (lock, then let go), or the **X** on the cauldron | the HUD **Sound** button |
| Keyboard | arrows / WASD move, Enter or Space holds / mixes | **H** | Escape (lets go, else opens the menu) | **M** |
| Gamepad  | d-pad or left stick move, Ⓐ holds / mixes | Ⓨ | Ⓑ (lets go, else opens the menu); Start opens/closes the menu; overlays: ←/→ + Ⓐ | Ⓧ |

Ⓨ is the hint because the top face button is the info slot by convention, and
it sits diagonally opposite Ⓐ — so a thumb roll off confirm cannot spend a move
on a hint. Ⓧ is what was left, and mute is the right thing to put on it: the one
action that costs nothing and is wanted in any phase. Indices 0-3 are also the
ones every Standard Gamepad agrees on, unlike the triggers, which some drivers
report as axes instead.

**M**, Ⓧ and the HUD **Sound** button all mute *everything* — music and
interface sounds — and the key and pad button work from any phase, including the
title screen. The choice is remembered across runs and
reloads. The button is the state as well as the switch: it reads **Sound**, and
**Muted** dimmed to match, which is why all three routes go through one
`muteToggle` in `game.ts` — a second path that skipped the repaint would leave
the label lying. Muting disconnects the music node rather than turning its volume
down, so it also stops the ~8% of a core the engine costs, and unmuting resumes
the song where it stopped instead of restarting it.

On touch the long-press is what keeps page scrolling working: a swipe scrolls,
a hold lifts the tile for dragging.

## Music

The background track is **astral blur**, the 24 kHz floatbeat in
`experiments/astralblur.js`, ported to run in the page. galaxy-raid plays its
bytebeats from a `ScriptProcessorNode`, and so did this at first — see
**Rendering ahead** below for why it does not any more.

The original is a general synth framework — ADSR envelopes, 2- and 4-operator FM
voices, wave-shapers, filters, delays, a Householder/Hadamard reverb, a mixer and
a sequencer, about a thousand lines — and the tune reaches maybe a third of it.
`src/music.ts` is what this song touches: three waveforms, one envelope shape,
one random LFO, one voice (a plain oscillator is that same voice with the
modulator switched off), gain, the low-pass, the multi-tap delay, the diffuser.
Dropped: the tri/square/shaped waves, the 4-operator voice, the wave-shaping
synths, the periodic LFO, the constant envelope, mono/softclip/DC-removal, the
single-tap delay, and the high-pass and mono branches of the filter. Everything
that was an object with named fields — envelopes, LFOs, notes, effects, mixer
channels — is an array indexed by position instead. The song itself is six
pattern strings and an arrangement, one character per tick and two per note.

Two of the original's quirks are reproduced rather than fixed, because they are
what it sounds like: `filter` allocates its history as
`Array(2).fill(Array(3).fill(...))`, so all three history rows *and* both
channels are one shared array — the biquad it looks like collapses to a one-pole
per section fed by each channel in turn — and `diff` builds an array of random
signs that it then multiplies by 1 (dead, so it is gone here). Its two real bugs
are dropped: `m.target in ["freq", ...]` is always false, since `in` tests an
array's keys, so every modulator is additive — which is what this tune wants
anyway — and `notefreq()` ignores the second argument it is passed.

**The port is checked, not eyeballed.** The original is run in a `vm` sandbox
exactly as a floatbeat player evaluates it — the whole file re-evaluated per
sample, with `t` the sample index and Math's members as bare globals — and its
output is compared with the port's, sample for sample. `random()` is pinned to a
constant in both so the reverb's random tap lengths and the LFOs line up;
otherwise the two are only comparable statistically. The result is bit-identical
across **250 seconds — 12 million samples**, every voice in the arrangement
(max absolute difference **0**), which is the only reason the aggressive cuts
above are safe to make. That render also settles the output level: the tune's own
peak reaches **1.22** where the arrangement is densest, so the 0.4 the player
applies is what keeps it clear of clipping, not just quiet.

The engine runs at the 24 kHz the song was written for, and the buffers are
created at that rate so the browser resamples them on the way out.

**It is 3.7x cheaper than the first version**, which is a phone story rather than
a desktop one: a ScriptProcessorNode calls back on the *main thread*, so its cost
is time the page is not drawing, and a callback that misses its deadline is an
audible glitch. `npm run audio-bench` measures it — **3191 ns a sample became
1107**, 7.7% of a core to 2.7%, which on a phone 6x slower than this machine is
46% of the callback budget down to 16%. Two changes did it, and the profiler
picked both:

- **The delay modulation was 23% of the whole engine.** Its read position wobbles
  as `cos(k·idx)` per tap, which is 16 `Math.cos` calls a sample. It is the same
  value stepped forward instead — rotating a (cos, sin) pair by a fixed angle is
  four multiplies — re-anchored on a real `Math.cos` every 1024 samples so drift
  cannot accumulate.
- **Every stage returned fresh arrays**, about 30 allocations a sample, which is
  ~700k a second for the garbage collector to deal with; a GC pause inside an
  audio callback is a click. The effects now run in place over two scratch
  buffers, and the mixer keeps its channel signals in one flat `Float64Array`.
- **48 remainders a sample** across the reverb, one per buffer access. Each buffer
  carries its own write pointer now, incremented and compared instead of divided.
- Assorted: the Hadamard's `1/sqrt(8)` was recomputed 32 times a sample, phase
  wrapping used `% 1` where the increment is always under 1, and the three
  waveforms were an array of closures — so the call site could not inline — now
  one function with a switch.

None of it changes the sound: against the same 250-second reference the output is
identical to **6e-8**, the modulation recurrence's drift, about 1000x below what
float32 storage can even represent, where the original was bit-identical.

Two further ideas were **measured and rejected**, which is the useful part:
halving the reverb to 4 channels buys only **1.16x** and the tail becomes a
different tail (the difference is 0.5 dB relative to the signal — audibly not the
same reverb), and a 2048-entry sine table buys **1.02x**, because V8's `Math.sin`
is already fast. The engine is at its practical floor for this structure.

### Rendering ahead

A `ScriptProcessorNode` calls back on the **main thread** and must fill every
buffer before its deadline, which made the music glitch on a phone — worst when
the screen went off, because that is exactly when the browser throttles that
thread. Speed alone cannot fix it.

So the engine no longer runs on demand. A 200ms timer renders quarter-second
chunks into `AudioBuffer`s and schedules them end to end, keeping **2.5 seconds
queued**. Nothing has a deadline: a tick can be late, throttled or skipped and
the audio continues until the queue drains, and if it ever does drain the pump
resynchronises from the clock instead of scheduling into the past. It also
retires the manual resampler, and with it the `ScriptProcessorNode` — including
the Safari input-channel trap that made the music silent on iOS.

`npm run music-check` demonstrates the property rather than describing it: it
blocks the page's main thread for 1.5 seconds and checks the queue is still ahead
of the clock afterwards (2.24s ahead before, 2.45s after). Under the old node
that same block was 1.5 seconds of silence.

Muting stops the pump as well as silencing the bus, so the engine costs nothing
at all while the sound is off, and what is already queued plays out silently —
the probe checks that too, by watching the scheduled-buffer count freeze.

The track costs **1511 bytes** zipped — 9651 to 11246, of which the song data is
six strings totalling 571 characters; the mute control and its HUD button added
another **170**, the title typography **44**, and the audio work since (a faster engine,
rendering ahead, and playing only during the game) **289**, for **11749 bytes,
88.26% of the 13KB budget**.

It plays **during the game only** — over the board and its cards and overlays,
never over the title screen or the pause menu. The frame loop passes the phase
to `musicPlaying` rather than every transition remembering to, so Escape, the
gamepad Start button, the menu buttons and the overlays all behave the same, and
leaving the game stops the pump as well as silencing the bus. The AudioContext
still has to be woken inside a gesture, which is what the pointer and key
listeners are for; it shares the context `src/sfx.ts` creates. **M** or Ⓧ
mutes it along with the interface sounds — see [Controls](#controls); the flag
lives in `src/sfx.ts` because both halves of the audio read it.

`npm run music-check` is the end-to-end check the node comparison cannot make:
it wraps `createScriptProcessor` before the bundle parses, dispatches a gesture,
and captures what the game's own callback writes into the output buffer, then
reports level and rejects silence or NaN. (Its injected script is wrapped in an
arrow function for a reason — a bare `const` there is a global lexical binding,
and colliding with one of the bundle's own short names is a SyntaxError that
stops the whole game from loading.)

## Recipe tree — SPOILERS

A perfect quest is **31 moves**, through the Sun + Rain rainbow; the cheapest
Prism route costs **33**, and Prism + Sun or a Light Bulb through a Prism cost
**34**. It was 33 until the Unicorn learned to take a plain **Animal + Magic**:
the Horse it used to insist on was two moves of its own — the Field it stands
in, and then the Horse — and nothing else in the tree needs either of them.
The Prism gap narrowed with it, from three moves to two: the quest still has to
reach Charcoal on its way to Black, and a Diamond is only a Lava away from
there, so the Prism is a much shorter detour than it looks. A Light Bulb
through a Prism is a third Prism route and never a cheaper one: the Prism
already needed the Glass and the Unicorn's life branch already needed the
Electricity, so the bulb itself is the only move it adds — flavour for a
player holding both, never a cheaper way in.
A perfect full clear is **97** - one move per element, since nothing can be
made twice. Best scores are scoped to the current recipe tree, so all of this
started fresh records automatically.

The Rainbow half of the quest is cheap. Everything else is not, because the two
remaining halves both bottom out in the same place. The Unicorn needs an
**Animal**, which pulls the entire life branch onto the critical path (mineral
chain -> Acid + Metal battery -> Electricity -> Lightning -> Life -> Animal).
Magic needs **Wood + Star**, and the wood chain pays for both halves of that:
the Wood itself, and the Charcoal -> Black past it that Night - and so the Star
- is built from (Knife + Tree -> Wood -> Charcoal -> Black). Both branches run
off one Earth/Lava/Stone/Metal spine, which is what keeps 31 from being far
worse, and the Cloud earns its keep twice: once for the Rain, once for the
Lightning. The Night has a second route, **Violet + Sky**, and it is an exact
tie rather than a shortcut: Magenta then Violet costs the same two moves as
Charcoal then Black, so a quest that never touches the material half still
lands on 31 - it just arrives at the Star through the colors instead. The original Horse + Magic route is still there and still costs 33 -
a Field, and then a Horse to stand in it, for a Unicorn the Animal already had.

Additive color mixing does the early work: primaries pair into secondaries,
and any **complementary pair** (Blue+Yellow, Red+Cyan, Green+Magenta) makes
White. **Black** is the deliberate exception - no two lights mix to
darkness, so the one color the light half of the tree cannot reach has to
arrive through the material half instead, as Charcoal + Stone. Only the color
itself, though: the Night it used to gate is reachable from a Violet sky now,
so a player can own the whole light half and still never make a Black.

Several elements have more than one route, so an intuitive guess tends to land
somewhere. Six of them are deliberately cyclic - Fire + Ice remakes Water,
which Ice itself needs; Penguin + Air hands back the Bird the Penguin came from;
Wolf + Dog is just another Dog; Fire + Air is a fanned fire and nothing more;
Lizard + Egg hatches another Lizard; and Axe + Tree makes the Wood the Axe
itself was cut from - flavor for a pair players try, never a
cheaper path.

| Element | Recipe |
|---|---|
| Yellow | Red + Green |
| Magenta | Red + Blue |
| Cyan | Green + Blue |
| White | Blue + Yellow · Red + Cyan · Green + Magenta |
| Orange | Red + Yellow |
| Violet | Blue + Magenta |

| Indigo | Blue + Violet |
| Pink | Red + White |
| Air | Blue + White |
| Sky | Air + Blue |
| Gold | Yellow + Orange |
| Water | Blue + Cyan · Fire + Ice |
| Fire | Red + Air · Fire + Air |
| Earth | Green + Orange |
| Clay | Earth + Water |
| Pottery | Clay + Fire |
| Beer | Gold + Water |
| Wine | Red + Water |
| Lava | Earth + Fire |
| Volcano | Lava + Earth |
| Stone | Lava + Water |
| Metal | Fire + Stone |
| Knife | Fire + Metal |
| Axe | Wood + Metal |
| Sand | Earth + Air · Earth + Sun · Stone + Air |
| Glass | Sand + Fire |
| Mirror | Glass + Metal |
| Hourglass | Glass + Sand |
| Sun | Fire + Sky |
| Night | Black + Sky · Violet + Sky |
| Star | Night + White |
| Moon | Night + Sun |
| Cloud | Sky + Water · Water + Air · Grey + Sky |
| Rain | Cloud + Water |
| Acid | Green + Water |
| Electricity | Acid + Metal |
| Light Bulb | Glass + Electricity |
| Lightning | Cloud + Electricity |
| Storm | Lightning + Rain · Electricity + Rain |
| Tornado | Air + Storm |
| Life | Lightning + Water |
| Egg | Stone + Life |
| Animal | Earth + Life |
| Lizard | Stone + Animal · Egg + Lizard |
| Horse | Animal + Field |
| Hippo | Horse + Water |
| Wolf | Animal + Moon |
| Fox | Orange + Wolf |
| Bone | Animal + Fire · Wolf + Fire · Horse + Fire · Unicorn + Fire · Bear + Fire · Polar Bear + Fire · Dog + Fire · Cow + Fire · Bear + Horse · Wolf + Horse · Bear + Dog |
| Dog | Wolf + Bone · Dog + Wolf |
| Cow | Animal + Plant |
| Milk | Cow + Water |
| Cheese | Acid + Milk |
| Squirrel | Animal + Tree |
| Bird | Air + Animal · Air + Penguin |
| Chick | Egg + Bird · Duck + Egg · Egg + Flamingo |
| Penguin | Bird + Ice |
| Duck | Bird + Water |
| Fish | Animal + Water |
| Owl | Bird + Night |
| Flamingo | Bird + Pink |
| Peacock | Bird + Rainbow |
| Phoenix | Bird + Fire · Ash + Fire |
| Bee | Animal + Flower |
| Honey | Bee + Flower |
| Bear | Animal + Honey |
| Polar Bear | Bear + Ice |
| Ice | Water + Night |
| Snow | Cloud + Ice |
| Prism | Diamond + Glass |
| **Rainbow** | **White + Prism** · **Sun + Rain** · **Prism + Sun** · **Light Bulb + Prism** |
| Magic | Wood + Star |
| Crystal Ball | Magic + Glass |
| **Unicorn** | **Horse + Magic** · **Animal + Magic** |
| Plant | Life + Sun · Life + Green |
| Tree | Water + Plant |
| Fruit | Tree + Sun |
| Pumpkin | Fruit + Orange |
| Wood | Tree + Knife · Axe + Tree |
| Charcoal | Wood + Fire · Tree + Fire |
| Ash | Charcoal + Fire · Bone + Fire · Fire + Paper · Book + Fire |
| Mushroom | Rain + Wood |
| Pencil | Wood + Charcoal |
| Paper | Stone + Tree |
| Book | Paper + Pencil |
| Palette | Paper + Rainbow |
| Kite | Air + Paper |

| Black | Charcoal + Stone |
| Grey | Black + White |
| Diamond | Charcoal + Lava · Volcano + Charcoal |
| Ring | Metal + Diamond |
| Field | Earth + Plant |
| Park | Field + Water |
| Cactus | Plant + Sand |
| Flower | Plant + Pink |
| Sunflower | Sun + Flower · Flower + Yellow |
| Rose | Flower + Red |
