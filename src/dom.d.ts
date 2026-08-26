// The page's elements, as globals.
//
// Every element with an id is already a property of window under that name
// (HTML's "named access on the window object"), so `gl` IS the #gl div — a
// getElementById call, and the helper that wrapped it, buy nothing. This file
// is the TypeScript side of that: ambient declarations, no emitted code.
// closure-externs.js is the compiler's side, and must list the same names.
//
// TWO letters, never one: the roadroller decoder ships a handful of
// single-letter globals of its own (the build logs them), and a one-letter id
// would be shadowed by one — silently, and only in the packed build. Two
// letters cannot collide with them.
//
// The ids themselves live in src/index.html; #ob is built by openOverlay and
// only exists while the overlay is open.
declare const gl: HTMLElement;   // goal line under the title
declare const hd: HTMLElement;   // HUD bar
declare const mv: HTMLElement;   // move count
declare const ct: HTMLElement;   // element count
declare const bq: HTMLElement;   // best-quest readout
declare const ht: HTMLElement;   // Hint button
// Build-time flag, substituted by the `defines` plugin in rollup.config.mjs
// and therefore a literal by the time closure sees it — which is what lets
// ADVANCED drop the dead branch AND the handlers it was the only caller of.
declare const __DEV__: boolean;
// the ONE canvas in the game: the completion fireworks, and nothing else
declare const fw: HTMLCanvasElement;
// True only in `npm run build-director`, the cut with no 13KB budget behind it.
// Same substitution, same closure treatment: content behind it is deleted from
// a shipping build, so putting a scene here costs the bundle nothing.
declare const __DIRECTOR__: boolean;
declare const sn: HTMLElement;   // Music button
declare const mn: HTMLElement;   // Menu button
declare const dk: HTMLElement;   // docked cauldron strip
declare const cd: HTMLElement;   // the cauldron itself
declare const ca: HTMLElement;   // slot A, the locked one
declare const cb: HTMLElement;   // slot B
declare const cr: HTMLElement;   // the result well
declare const cq: HTMLElement;   // the result's name and quote
declare const gd: HTMLElement;   // the tile grid
declare const ti: HTMLElement;   // title screen
declare const tw: HTMLElement;   // title lockup wrapper
declare const tl: HTMLElement;   // COLOR
declare const tb: HTMLElement;   // AlchemY
declare const mu: HTMLElement;   // the button column, or the subscreen in it
declare const mh: HTMLElement;   // subscreen heading   \
declare const ml: HTMLElement;   // subscreen list       > written by openPanel
declare const mb: HTMLButtonElement; // subscreen Back  /
declare const ds: HTMLElement;   // first-discovery full-screen layer
declare const to: HTMLElement;   // toast
declare const ov: HTMLElement;   // overlay veil
declare const oc: HTMLElement;   // overlay card
declare const ob: HTMLElement;   // overlay button row (built by openOverlay)
declare const st: HTMLElement;   // the empty <style> css.ts fills
