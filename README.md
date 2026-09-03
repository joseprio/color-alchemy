# Color Alchemy

A combination game that starts with red, green and blue and ends with 300
elements, built to fit in **13312 bytes** — board, recipe tree, artwork, music
and sound effects, in one HTML file that loads nothing from anywhere.

Open `index.html` for the landing page, or go straight to a build:

- **`dist/bundle.html`** — the size-golfed entry, the whole game in one file.
- **`dist/director.html`** — the director's cut: the same game with nothing to
  fit into. A written quote for every element, fireworks over every completed
  quest, and its own bundled emoji font. Still a *release* build, not a
  development one — the menu's development tools are as absent from it as they
  are from a shipping bundle.

## Build & run

```
npm install
npm run build             # tsc check -> rollup (+ size-golf tail) -> postbuild
npm run build-dev         # the same, keeping the development-only menu tools
npm run build-director    # the director's cut: no budget, size-golf tail bar terser
npm test                  # 163 headless checks against dist/bundle.html
node check.mjs dist/director.html   # the same checks against the director's cut
npm start                 # dev: watch + serve on http://localhost:8080
npm run emoji-publish     # rebuild the cut, copy its emoji subset to ./emoji.woff2
npm run roadroller-optimize   # re-fit rr-config.json after a structural change
npm run fn-order-optimize     # re-fit fn-order.json after a source change
npm run fouc-check        # is the sheet in place before the first paint?
npm run css-diff          # does cssnano change any computed style?
npm run music-check       # is the shipped page actually producing audio?
npm run mobile-check      # phone and tablet layout: overflow, tap targets
npm run audio-bench       # what a sample costs, against the callback budget
```

`prebuild` runs `tsc`, then rollup bundles `src/index.ts` and — in production
only — puts it through closure ADVANCED → eslint `no-var` → `const`→`let` →
terser → a roadroller fork. `postbuild` inlines the packed script into the
`src/index.html` template, minifies with html-minifier-next, zips with fixed
timestamps and recompresses with ECT then advzip. `npm start` skips the whole
tail, so a watch build stays readable and fast.

**The build is byte-deterministic**, which is what makes every measurement in
`OPTIMIZATIONS.md` reproducible: the zip timestamp is pinned to the DOS epoch,
and roadroller's stochastic parameter search is fitted once into
`rr-config.json` rather than run per build. Both `rr-config.json` and
`fn-order.json` print `STALE` when they no longer match the chunk; stale costs
bytes and never breaks the build.

**The emoji font is two different arrangements.** The cut generates its own
subset from the element table at build time, so it is always in step. The
shipping build cannot afford 250 KB in a 13 KB budget, so it names a hosted file
at a URL fixed in `rollup.config.mjs`; nothing in the build writes that file, so
after adding an element with a new emoji, run `npm run emoji-publish` and
republish the `emoji.woff2` it drops in the repo root. Until then the new glyph
falls back to the player's own emoji set.

## How it plays

- You start with **Red**, **Green** and **Blue**, and combine two elements to
  discover a third. Every attempt costs a move — successes, failures and
  rediscoveries alike — and so does a hint. Low scores are the game.
- **One element, three states, on the tile you keep tapping.** First tap picks
  it (cyan, into the left slot); a second **locks** it (gold, with a 🔒 badge on
  both the tile and the slot); a third lets it go. Tapping a different element
  mixes the two. The lock is the whole difference in what happens next: a loose
  pick is spent by the mix, a locked one survives every mix — which is what
  makes trying Fire against ten things ten taps instead of twenty.
- **Dead ends are remembered.** Pick an element and every tile you have already
  tried it against, for nothing, goes grey. The mark is on the tile's chrome
  only, never on the swatch — this game asks you to judge a colour, and dimming
  the square that carries it would be a lie about the element rather than a note
  about the pair.
- **Hint** names two elements you already hold that make something you do not,
  and costs a move for it. It reveals the *pair* and never the result, so the
  discovery card keeps its surprise, and while a quest stands it answers the
  quest — narrowing rather than replacing, so a hint is never refused for being
  off-plan. Re-reading a standing hint is free; only moving to a new answer
  charges again.
- **The cauldron** is docked to the bottom of the viewport — two slots and a
  result well — in sight however far the board has scrolled. After each attempt
  the second slot and the well empty themselves, leaving a locked element facing
  an empty slot. A pair that makes nothing shakes the cauldron rather than the
  tiles: the pair you tried is sitting in the slots, so that is where the answer
  belongs.
- **A first-ever discovery takes the whole screen** — the two ingredients spiral
  in, the result lands on a burst of rays, and the card names it. Tap, Enter or
  Ⓐ cuts it short, and it ends by itself after 3.25s.

### Quests

Five, each scored into a best of its own and each raising its own card. Nothing
on the board says what to aim for — the goal line under the grid is status-only,
and the **Quests** screen is where the objectives live.

| Quest | Wants |
|---|---|
| Unicorns and Rainbows | 🌈 Rainbow, 🦄 Unicorn |
| World Peace | 🌍 World, 🕊 Peace |
| COWABUNGA! | 🥷 Ninja, 🐢 Turtle, 🍕 Pizza |
| Full Color Alchemist | all 17 colors — the block that opens the element table |
| Gotta catch 'em all! | all 300 elements |

At most one can land per move, since a move discovers a single element and no
element sits in two of the sets. The full clear's move count is the hidden one:
it is only ever shown on the completion screen, which only a full clear reaches.
In the director's cut every quest card raises the fireworks, not just the
completion screen.

**Black is the throat of the tree.** Three opposite pairs make it — Violet +
Yellow, Blue + Orange, Crimson + Green — and Black plus White makes **Matter**,
which is the sole route to Earth, Air and Water and so to nearly everything.
The split a player can infer is that a primary against its own exact secondary
makes White (light adding up), and any other opposite pair makes Black (pigment
cancelling out). Black keeps its material routes as alternates. Know this before
rewiring around it.

### Menu, saves and scoring

The title screen offers **Continue**, **New game**, **Quests** and
**Encyclopedia** — the last being a journal of every element ever discovered
with the recipes *actually performed*, so alternates you never tried stay
unspoiled. The journal survives New game; only the board is wiped.

The save is one `localStorage` entry, `colorAlchemy`, holding one array with a
section per index — tree fingerprint, run, and one slot per best. Bests are
scoped by a fingerprint of the recipe tree, so a balance change quietly starts
fresh records rather than leaving an unbeatable one behind. `src/store.ts` owns
it, and **every key is pinned in `closure-externs.js`**: ADVANCED renames any
property it has not been told about, and a renamed key is a save no later build
can read.

## Controls

| Input    | Combine | Hint | Let go of the pick | Mute |
|----------|---------|------|----------------------------|------|
| Mouse    | click one element to pick it, then another to mix — or drag one onto another | the HUD **Hint** button | click it twice more, or the locked slot | the HUD **Mute** button |
| Touch    | tap one element to pick it, then another to mix — or long-press (~¼s) to lift, then drag | the HUD **Hint** button | tap it twice more, or the locked slot | the HUD **Mute** button |
| Keyboard | arrows / WASD move, Enter or Space holds / mixes | **H** | Escape (lets go, else opens the menu) | **M** |
| Gamepad  | d-pad or left stick move, Ⓐ holds / mixes | Ⓨ | Ⓑ (lets go, else opens the menu); Start toggles the menu | Ⓧ |

Ⓨ is the hint because the top face button is the info slot by convention and it
sits diagonally opposite Ⓐ, so a thumb roll off confirm cannot spend a move.
Indices 0-3 are the ones every Standard Gamepad agrees on, unlike the triggers.
Mute works in every phase, including the title screen, and the button names the
*action* rather than the state — **Mute** while there is something to mute,
**Unmute** once there is not.

## On a phone

The layout is fluid rather than broken into breakpoints: the grid is
`repeat(auto-fill, 92px)` inside `width: min(96vw, 640px)`, so it lands on 3
columns at 320-414px and 6 from a tablet up. `npm run mobile-check` walks the
packed page through seven viewports in each state that lays out differently and
reports overflow, oversized elements, column count and tap targets under 44px.
Known gap: no `env(safe-area-inset-*)` padding, so on a notched phone in
landscape the footer can sit under the home indicator.

## Music

The background track is **astral blur**, the 24 kHz floatbeat in
`experiments/astralblur.js`, ported to run in the page. The original is a
general synth framework of about a thousand lines and the tune reaches maybe a
third of it; `src/music.ts` is only what this song touches, with every named
object flattened to a position-indexed array and the song itself six pattern
strings and an arrangement.

Two of the original's quirks are reproduced rather than fixed, because they are
what it sounds like — the details, and the render-ahead scheduling that replaced
a `ScriptProcessorNode`, are commented in `src/music.ts`. `npm run music-check`
captures the shipped page's own audio callback, and `npm run audio-bench`
measures a sample against the callback budget.

## Source layout

```
src/index.html    template: markup only — the two-letter ids are the contract
                  with the game code and check.mjs
src/dom.d.ts      those ids, declared as the globals the game reads them as
src/style.css     the stylesheet, minified into the payload at build time
src/css.ts        fills <style id=st> with it, imported first from index.ts
src/elements.ts   the element tree: names, icons, recipes
src/quotes.ts     the quotes and their containers — director's cut only
src/game.ts       state, grid, cauldron, combining, quests, persistence
src/store.ts      the one localStorage entry
src/music.ts      the floatbeat engine and the node that plays it
src/sfx.ts        WebAudio synth for the interface sounds
src/input.ts      keyboard listener + gamepad polling
src/index.ts      entry: boot, gamepad frame loop

rollup.config.mjs   bundling + the production closure/terser/roadroller chain
postbuild.mjs       inline -> minify -> single file -> zip -> ECT -> advzip
closure-externs.js  names ADVANCED must not rename
rr-config.json      pinned roadroller params — deterministic builds
fn-order.json       the searched function order
tools/              the probes and the two optimizer searches
experiments/        the prototypes each shipped effect was chosen from
```

## Tests

`check.mjs` drives the fully packed production bundle through CDP — no test
hooks ship, so it clicks tiles the way a player does and reads state off the
page. One suite covers both builds: it asks the menu which build it is looking
at, then either exercises the development tools or asserts they are genuinely
absent. Needs Node 22+ and a local Chrome or Edge, and drops `.shot-*.png`
screenshots next to itself.

The recipe tree is the one thing with no DOM form, so those assertions parse
`src/elements.ts` in node — checking the tree as written rather than as shipped.
The move orders the suite drives are derived from that same table, so adding an
element needs no edit to the runs.

## Where the rest of it is

**`OPTIMIZATIONS.md`** is every measured finding from fitting this into 13312
bytes — what was taken, what was tried and rejected, and why. It is worth
reading before changing anything in the build.

Everything else lives in comments next to the code it explains. `src/style.css`
opens with the legend for its one-letter class names; `src/elements.ts` carries
the rules the tree has to keep; `check.mjs` explains what each assertion is
actually guarding. The in-game **Encyclopedia** is the recipe reference, which
is why there is no table of 300 recipes here.
