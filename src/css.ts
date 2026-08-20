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
declare const __MARKUP__: string;

st.innerHTML = __MARKUP__;

export {};
