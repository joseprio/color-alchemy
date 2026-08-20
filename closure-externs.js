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
//
// There is no longer a third: the bundle exposes NOTHING on window. check.mjs
// drives the page through clicks and reads the DOM, so there is no test surface
// whose names have to survive.
//
// HTML ids need no entry: nothing here reads a bare id global (every lookup goes
// through getElementById with a string literal), which is the hazard galaxy-raid's
// externs exist to hold off.

// Bare browser globals. The compiler the plugin pins (20210808) still declares
// these only as window properties, so every bare reference is an undeclared
// variable to it — the build fails loudly on each one, which is how this list
// was assembled.
var localStorage;

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
