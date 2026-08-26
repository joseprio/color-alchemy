/** @externs */

// Closure ADVANCED renames every property it has not been told about. Anything
// whose NAME has to survive the compile is pinned here — three boundaries:
//
//  1. the localStorage shapes. The run and the codex are JSON, so a renamed key
//     is a save that no later build can read — and the rename is invisible until
//     someone's run fails to come back.
//  2. the ElementDef fields, read off the table by the balance tools in the
//     scratchpad. These are one or two characters already, so pinning them
//     costs nothing a rename would have won.
//  3. the HTML ids. The game reads its elements as bare globals — `gl` is the
//     #gl div, through named access on window — so every one of those names has
//     to survive both the compile and the mangle. Without an entry here closure
//     ADVANCED sees an undeclared variable and fails the build, which is the
//     good failure; the bad one would be a rename to something the document has
//     no element for. src/dom.d.ts is the TypeScript side of the same list, and
//     src/index.html holds the ids themselves. Two letters each, so roadroller's
//     single-letter decoder globals cannot shadow one.
//
// What is NOT here: a test surface. The bundle exposes nothing on window —
// check.mjs drives the page through clicks and reads the DOM.

// Bare browser globals. The compiler the plugin pins (20210808) still declares
// these only as window properties, so every bare reference is an undeclared
// variable to it — the build fails loudly on each one, which is how this list
// was assembled.
var localStorage;
// the viewport, for sizing the fireworks canvas in device pixels
var innerWidth, innerHeight, devicePixelRatio;

// the id globals (see 3 above); #ob exists only while the overlay is open
var gl, hd, mv, ct, bq, ht, sn, mn, dk, cd, ca, cb, cr, cq, gd;
var ti, tw, tl, tb, mu, mh, ml, mb, ds, to, ov, fw, oc, ob, st;

// Handler PROPERTIES are the other half of this problem, and they are fixed at
// the call site rather than here: this compiler knows onclick and onkeydown but
// NOT onpointer*/onanimationend, and it renames an unquoted assignment to them
// into something the browser never fires — a build that boots and quietly does
// not drag. Written quoted (d["onpointerdown"] = ...) they survive, and terser
// folds them back to dot form for free. Pinning them here instead would mean
// declaring them on Element.prototype, which is more externs for the same
// result. galaxy-raid OPTIMIZATIONS.md #53 hit this first.

// DOM property names this compiler's externs are too old to know. Renaming
// these does NOT fail the build, it just produces something that runs:
//   gridTemplateColumns  read off getComputedStyle to count grid columns —
//                        renamed it reads undefined, and .split threw on every
//                        keyboard/gamepad cursor move (caught by npm test).
//   block                the scrollIntoView option; renamed it is ignored and
//                        the grid jumps instead of scrolling minimally.
//   passive              the addEventListener option; renamed it is ignored,
//                        the touchmove listener goes passive, and preventDefault
//                        stops working — touch drag would scroll the page.
// The last two are silent, so they are pinned on inspection rather than on a
// failing test. Add to this list, never trim it.
var caDomNames = { gridTemplateColumns: 0, block: 0, passive: 0 };


/** @const */
var caState = {};
/** @type {?} */ caState.found;
/** @type {?} */ caState.moves;
/** @type {?} */ caState.questDone;
/** @type {?} */ caState.fullDone;
/** @type {?} */ caState.sel;
/** @type {?} */ caState.cursor;
/** @type {?} */ caState.phase;

// the persisted run (f/m/q/c) and codex (f/k) shapes
/** @const */
var caSave = {};
/** @type {?} */ caSave.f;
/** @type {?} */ caSave.m;
/** @type {?} */ caSave.k;

// ElementDef: n name, q quote, c color, bg background stack, e emoji, s svg,
// r recipes (c and q are already pinned by the save shape above)
/** @const */
var caElement = {};
/** @type {?} */ caElement.n;
/** @type {?} */ caElement.q;
/** @type {?} */ caElement.c;
/** @type {?} */ caElement.bg;
/** @type {?} */ caElement.e;
/** @type {?} */ caElement.s;
/** @type {?} */ caElement.r;
