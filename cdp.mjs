// Minimal Chrome DevTools Protocol harness, carried over from galaxy-raid's
// test/cdp.mjs and made dependency-free: Node >= 22 ships a global WebSocket,
// so the `ws` package import is gone and nothing needs installing.
// Launches headless Chrome on a local page and exposes evalJs plus the
// uncaught-exception log. Set CHROME_PATH to override browser discovery.
import { spawn } from "child_process";
import { existsSync, mkdtempSync, rmSync } from "fs";
import http from "http";
import os from "os";
import path from "path";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA + "/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const get = (url) =>
  new Promise((resolve, reject) => {
    http
      .get(url, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => resolve(d));
      })
      .on("error", reject);
  });

export async function launch({
  port = 9222 + ((Date.now() / 1000) | 0) % 100,
  url = "dist/bundle.html",
} = {}) {
  const chromePath = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!chromePath) {
    throw new Error("No Chrome/Edge found; set CHROME_PATH");
  }
  const profileDir = mkdtempSync(path.join(os.tmpdir(), "color-alchemy-test-"));
  const file = "file:///" + path.resolve(url).replace(/\\/g, "/");

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--remote-debugging-port=" + port,
      "--user-data-dir=" + profileDir,
      "--no-first-run",
      "--autoplay-policy=no-user-gesture-required",
      file,
    ],
    { stdio: "ignore" }
  );

  let targets;
  for (let i = 0; i < 50; i++) {
    try {
      targets = JSON.parse(await get(`http://127.0.0.1:${port}/json`));
      if (targets.length) break;
    } catch {}
    await sleep(200);
  }
  const page = targets.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));

  let id = 0;
  const pending = {};
  const exceptions = [];
  ws.addEventListener("message", (ev) => {
    const o = JSON.parse(ev.data);
    if (o.id && pending[o.id]) pending[o.id](o.result);
    else if (o.method === "Runtime.exceptionThrown")
      exceptions.push(
        (
          o.params.exceptionDetails.exception?.description ||
          o.params.exceptionDetails.text
        ).split("\n")[0]
      );
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pending[i] = r;
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  await send("Runtime.enable");

  const evalJs = async (expr) =>
    (await send("Runtime.evaluate", { expression: expr, returnByValue: true }))
      .result.value;

  const close = () => {
    try {
      ws.close();
    } catch {}
    chrome.kill();
    setTimeout(() => rmSync(profileDir, { recursive: true, force: true }), 500);
  };

  // `send` is exposed for raw CDP domains the helpers don't wrap
  // (Page.captureScreenshot for DOM/HUD shots — canvas dumps can't see the HUD)
  return { evalJs, send, exceptions, close, sleep };
}

export function check(name, condition) {
  console.log((condition ? "ok   " : "FAIL ") + name);
  if (!condition) process.exitCode = 1;
}
