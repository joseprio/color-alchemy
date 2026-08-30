// Fills the page stylesheet from JS, so the CSS ships inside the
// roadroller-packed payload instead of the HTML's deflate stream — galaxy-raid
// OPTIMIZATIONS.md #18 (the move itself) and #71 (this spelling of it).
//
// The target is the EMPTY <style id=st> in src/index.html. Filling an element
// that is ALREADY in the document applies the sheet synchronously, before first
// paint, so there is no unstyled frame; creating the <style> here instead
// measured worse for galaxy-raid (#18) and would reintroduce that risk.
//
// Imported FIRST from index.ts, before boot() builds any of the grid.
//
// __MARKUP__ is the bare CSS text — no <style> wrapper — injected by
// rollup.config.mjs from src/style.css, minified with the same cssnano pass
// postbuild.mjs applies to anything left in the template.
import { QUOTE_CSS } from "./quotes";

declare const __MARKUP__: string;

st.innerHTML = __MARKUP__;

// The page's body, lifted out of src/index.html by the inject-body plugin and
// written here instead of being served as markup — the same trade the
// stylesheet above makes, and worth 48 B measured. The stylesheet goes in
// FIRST so the rules are in place before these elements exist, and everything
// below this line, gl.after() included, depends on them being here.
document.body.innerHTML = __BODY__;

// The director's cut appends the rules for its quote containers — in the same
// synchronous run, so they are in place before the first paint as well.
// __DIRECTOR__ is a literal, so a shipping build has `if (false)` here and
// closure deletes the line, then QUOTE_CSS, then the rest of src/quotes.ts.
if (__DIRECTOR__) st.innerHTML += QUOTE_CSS;

// The help line rides in the PACKED PAYLOAD, not the template. It is the
// biggest block of prose left in the markup, and the markup is deflated by the
// zip while this is modelled by roadroller — the same trade as the stylesheet
// above (galaxy-raid #18). It is also, since the quotes left for the director's
// cut, very nearly the last prose in the packed payload at all.
// gl.after() drops a TEXT NODE exactly where the template had one — inside
// <f>, straight after #gl — so `f` styles it as before and no wrapper element
// (and no font-style reset for it) is needed.
gl.after(
  "tap one to pick, another to mix · tap the pick again to lock it — " +
  "a locked one stays, a third tap drops it · arrows or d-pad + " +
  "Enter/Ⓐ · Esc/Ⓑ drops · H/Ⓨ hints, costs a move");

export {};
