// Does the packed page hold up at phone and tablet sizes?
//
// Loads dist/bundle.html at a range of viewports with touch emulation and walks
// it through the states that lay out differently — title screen, board, a
// discovery card, a toast (the one element set to nowrap), the encyclopedia
// panel — reporting horizontal overflow, any element wider than the screen, the
// grid's column count, and the tap targets under the 44px guideline.
//
// The page is reloaded for each size: the title screen is only reachable on a
// fresh load, and a stale phase silently measures nothing (an earlier version of
// this probe reported "COLOR 0px" for every size but the first).
//
// Screenshots land next to check.mjs as .shot-mob-*.png for a visual pass.
// usage: node tools/responsive-probe.mjs   (npm run mobile-check)
import { launch } from "../cdp.mjs";
import { writeFileSync } from "fs";
import path from "path";

const SIZES = [
  ["320x568  iPhone SE 1st gen — the narrowest phone still in use", 320, 568, true],
  ["375x667  iPhone SE 2nd/3rd gen", 375, 667, true],
  ["390x844  iPhone 12/13/14", 390, 844, true],
  ["360x740  common Android", 360, 740, true],
  ["768x1024 iPad portrait", 768, 1024, true],
  ["844x390  iPhone 12 landscape", 844, 390, true],
  ["1280x800 laptop", 1280, 800, false],
];

const AUDIT = `(() => {
  const vw = innerWidth;
  const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (el.className && typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '');
  const over = [], small = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.width > vw + 0.5 || r.right > vw + 0.5 || r.left < -0.5) {
      over.push(name(el) + ' ' + Math.round(r.width) + 'px [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
    }
    if ((el.tagName === 'BUTTON' || el.classList.contains('tile')) && r.width > 0 && Math.min(r.width, r.height) < 44) {
      small.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
  }
  const grid = document.getElementById('grid');
  return JSON.stringify({
    vw,
    overflowX: document.documentElement.scrollWidth > vw + 0.5,
    scrollW: document.documentElement.scrollWidth,
    over: [...new Set(over)].slice(0, 8),
    small: [...new Set(small)].slice(0, 8),
    cols: grid && grid.offsetParent !== null
      ? getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length : 0,
  });
})()`;

const t = await launch({ url: "dist/bundle.html" });
await t.send("Page.enable");
const page = "file:///" + path.resolve("dist/bundle.html").split(path.sep).join("/");

const findings = [];
for (const [label, width, height, mobile] of SIZES) {
  await t.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await t.send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await t.send("Page.navigate", { url: page });
  await t.sleep(1100);

  const shot = async (name) => {
    const r = await t.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`.shot-mob-${width}-${name}.png`, Buffer.from(r.data, "base64"));
  };
  const states = {};

  states.title = JSON.parse(await t.evalJs(AUDIT));
  const lock = JSON.parse(await t.evalJs(`(() => {
    const t = document.getElementById('ttl'), s = document.getElementById('tsub'), k = s.children;
    return JSON.stringify({
      title: Math.round(t.getBoundingClientRect().width),
      sub: Math.round(k[k.length-1].getBoundingClientRect().right - k[0].getBoundingClientRect().left),
      px: getComputedStyle(t).fontSize,
    });
  })()`));
  await shot("title");

  // board with a dozen elements found
  await t.evalJs(`[...document.querySelectorAll('#menu button')].find(b => /^(Continue|New game)$/.test(b.textContent)).click()`);
  await t.evalJs(`CA.reset();
    [['red','green'],['red','blue'],['green','blue'],['blue','yellow'],['red','yellow'],
     ['red','orange'],['blue','white'],['fire','air'],['sun','air'],['blue','cyan'],
     ['green','orange'],['earth','fire']].forEach(([a,b]) => { CA.attempt(a,b); CA.dismiss(); })`);
  await t.sleep(200);
  states.board = JSON.parse(await t.evalJs(AUDIT));
  await shot("board");

  // a discovery card, left open
  await t.evalJs(`CA.attempt('lava','water')`);
  await t.sleep(300);
  states.card = JSON.parse(await t.evalJs(AUDIT));
  await shot("card");
  await t.evalJs(`CA.dismiss()`);

  // a hint toast: the only element in the page set to nowrap
  await t.evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }))`);
  await t.sleep(200);
  states.toast = JSON.parse(await t.evalJs(AUDIT));
  const toastText = await t.evalJs(`document.getElementById('toast').textContent`);
  await shot("toast");

  // the encyclopedia, the widest panel there is
  await t.evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
  await t.sleep(150);
  await t.evalJs(`[...document.querySelectorAll('#menu button')].find(b => b.textContent === 'Encyclopedia').click()`);
  await t.sleep(250);
  states.codex = JSON.parse(await t.evalJs(AUDIT));
  await shot("codex");

  findings.push([label, lock, states, toastText]);
}
t.close();

let issues = 0;
for (const [label, lock, states, toastText] of findings) {
  console.log(`\n${label}`);
  console.log(`  title    COLOR ${lock.title}px / AlchemY ${lock.sub}px at ${lock.px}`);
  console.log(`  board    ${states.board.cols} tile column(s)`);
  for (const [state, s] of Object.entries(states)) {
    if (s.overflowX) { console.log(`  ${state.padEnd(8)} OVERFLOWS: scrollWidth ${s.scrollW} > ${s.vw}`); issues++; }
    for (const o of s.over) { console.log(`  ${state.padEnd(8)} wider than the screen: ${o}`); issues++; }
  }
  const small = [...new Set(Object.values(states).flatMap((s) => s.small))];
  for (const b of small) { console.log(`  tap      under 44px: ${b}`); issues++; }
  if (toastText) console.log(`  toast    "${toastText}"`);
}
console.log(issues ? `\n${issues} finding(s)` : "\nnothing overflowing, nothing under the tap-target guideline");
