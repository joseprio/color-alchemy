// Does cssnano change what the page actually computes?
// Loads the packed page (minified CSS, as shipped), snapshots every computed
// property of every element, then swaps src/style.css in RAW and snapshots
// again. Any difference is a real restyle, not a byte saving.
// usage: node .css-diff.mjs
import { launch } from "../cdp.mjs";
import { readFileSync } from "fs";

const raw = readFileSync("src/style.css", "utf8");
const t = await launch({ url: "dist/bundle.html" });
await t.sleep(1200);

// exercise a few states so more rules are live than the title screen alone
// the bundle ships no test hooks, so the probe drives the board the way a
// player does — enter the game, then click two tiles
await t.evalJs(`[...document.querySelectorAll('#menu button')]
  .find(b => /^(Continue|New game)$/.test(b.textContent)).click()`);
await t.evalJs(`(() => {
    const c = (id) => { const e = document.querySelector('[data-id=' + id + ']'); if (e) e.click(); };
    const rel = () => {
      const b = document.querySelector('.tile.sel2'); if (b) { b.click(); b.click(); }
      const h = document.querySelector('.tile.sel'); if (h) h.click();
    };
    window.__mix = (a, b) => { rel(); c(a); c(b); rel(); };
  })(); __mix('red','green');
  // that attempt was a first-ever discovery, so the full-screen overlay is up
  // and on a 2.75s timer to remove itself. Skip it: an element that deletes
  // ITSELF part way through a two-pass snapshot lands in one pass and not the
  // other, and every element after it then compares against its neighbour.
  document.getElementById('disc').dispatchEvent(new PointerEvent('pointerdown'));
  document.getElementById('toast').className = 'show';
  document.querySelectorAll('.tile')[0].className = 'tile sel cur';
  document.querySelectorAll('.tile')[1].className = 'tile hit drop';`);
// let every transition and animation settle: #toast fades over .2s, so an
// immediate snapshot reads a value mid-transition and reports a false diff
await t.sleep(1500);

const SNAP = `(() => {
  const out = {};
  document.querySelectorAll('*').forEach((el, i) => {
    const cs = getComputedStyle(el);
    const rec = {};
    for (let k = 0; k < cs.length; k++) rec[cs[k]] = cs.getPropertyValue(cs[k]);
    out[i + ':' + el.tagName + '#' + el.id + '.' + el.className] = rec;
  });
  return JSON.stringify(out);
})()`;

const minified = JSON.parse(await t.evalJs(SNAP));
await t.evalJs(`document.getElementById('sty').innerHTML = ${JSON.stringify(raw)}`);
await t.sleep(1500);
const rawSnap = JSON.parse(await t.evalJs(SNAP));

let diffs = 0;
for (const key of Object.keys(minified)) {
  const a = minified[key], b = rawSnap[key];
  if (!b) { console.log("missing in raw pass:", key); diffs++; continue; }
  for (const prop of Object.keys(a)) {
    if (a[prop] !== b[prop]) {
      // -webkit- aliases report identically; only real differences reach here
      console.log(`${key}\n  ${prop}: minified=${a[prop]}  raw=${b[prop]}`);
      diffs++;
    }
  }
}
console.log(
  `${Object.keys(minified).length} elements compared, ` +
  `${Object.keys(minified[Object.keys(minified)[0]]).length} properties each -> ` +
  (diffs ? `${diffs} DIFFERENCE(S)` : "identical")
);
t.close();
