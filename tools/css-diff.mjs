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
await t.evalJs(`CA.reset(); CA.attempt('red','green'); CA.dismiss();
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
