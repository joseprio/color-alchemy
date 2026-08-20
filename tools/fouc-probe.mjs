// Does the packed page ever paint before the stylesheet lands?
//
// The CSS ships inside the roadroller payload (src/css.ts fills the empty
// <style id=st>), so the sheet is applied by a script at the end of <body>
// rather than by a <style> in <head> — and the decode takes a few hundred
// milliseconds. If the browser painted before that, the player would see one
// unstyled frame. npm test cannot see a FOUC, which is why this exists;
// galaxy-raid records a real one on this exact path (OPTIMIZATIONS.md #18).
//
// A MutationObserver installed at document-start timestamps the moment the
// sheet lands; the browser's own first-paint entry says when it first drew.
// Run it after a build: node tools/fouc-probe.mjs   (npm run fouc-check)
import { launch } from "../cdp.mjs";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// navigation has to start from somewhere else, so the document-start script is
// installed before the page under test is parsed
const blank = path.join(tmpdir(), "color-alchemy-blank.html");
writeFileSync(blank, "<!doctype html><title>blank</title>");

const t = await launch({ url: blank });
await t.send("Page.enable");
await t.send("Page.addScriptToEvaluateOnNewDocument", {
  source: `
    window.__css = 0;
    new MutationObserver(() => {
      const s = document.getElementById('st');
      if (!window.__css && s && s.textContent.length) window.__css = performance.now();
    }).observe(document, { childList: true, subtree: true, characterData: true });
  `,
});
await t.send("Page.navigate", {
  url: "file:///" + path.resolve("dist/bundle.html").split(path.sep).join("/"),
});
await t.sleep(2500);
const r = JSON.parse(await t.evalJs(`JSON.stringify({
  css: window.__css,
  paints: performance.getEntriesByType('paint').map(e => [e.name, e.startTime]),
  bodyBg: getComputedStyle(document.body).backgroundColor,
  sheetRules: document.styleSheets[0] ? document.styleSheets[0].cssRules.length : 0,
})`));
t.close();

const fp = (r.paints.find((p) => p[0] === "first-paint") || [])[1];
console.log(`stylesheet: ${r.sheetRules} rules, body background ${r.bodyBg}`);
console.log(`applied at ${r.css.toFixed(1)}ms, first paint at ${fp === undefined ? "-" : fp.toFixed(1)}ms`);
if (fp === undefined) {
  console.log("no paint recorded — inconclusive");
  process.exitCode = 1;
} else if (fp >= r.css) {
  console.log("ok   no unstyled frame: the sheet was in place before the first paint");
} else {
  console.log("FAIL FOUC: the page painted before the stylesheet was applied");
  process.exitCode = 1;
}
