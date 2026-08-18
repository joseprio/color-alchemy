// Print the addresses a phone on the same network can open, and a QR for one.
//
// The dev server binds to localhost by default, which no other device can
// reach; start it with HOST=0.0.0.0 (see rollup.config.mjs) — or use
// `npm run phone`, which does both.
//
// The QR is drawn from the raw module matrix rather than a library's terminal
// renderer, so it is plain block characters with no ANSI colour and survives
// copy and paste. Polarity is the thing to get right: a QR is dark modules on a
// light ground, so on a DARK terminal the blocks have to be the LIGHT modules —
// printing blocks for the dark ones gives an inverted code that many scanners
// refuse. --light flips it for a light terminal. A .qr.png is written too, at
// the correct polarity whatever the terminal is doing.
//
// usage: node tools/phone.mjs [--packed] [--light] [--url http://…]
import QRCode from "qrcode";
import os from "os";

const args = process.argv.slice(2);
const packed = args.includes("--packed");
const urlArg = args[args.indexOf("--url") + 1];

// the LAN address, preferring the usual private ranges over anything a VPN or
// a container bridge might have added
function lanAddress() {
  const found = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces() || {})) {
    for (const a of addrs || []) {
      if (a.family !== "IPv4" || a.internal) continue;
      const rank = /^192\.168\./.test(a.address) ? 0
        : /^10\./.test(a.address) ? 1
        : /^172\.(1[6-9]|2\d|3[01])\./.test(a.address) ? 2 : 3;
      found.push({ name, address: a.address, rank });
    }
  }
  found.sort((x, y) => x.rank - y.rank);
  return found;
}

const nics = lanAddress();
if (!nics.length && !urlArg) {
  console.error("No non-internal IPv4 address found — is this machine on a network?");
  process.exit(1);
}

const host = nics[0]?.address;
const base = `http://${host}:8080`;
const url = urlArg || (packed ? `${base}/bundle.html` : `${base}/`);

// QRCode.create gives the module matrix; render it two characters wide so the
// modules come out square in a terminal cell grid, with a 4-module quiet zone
// (the spec's minimum, and scanners do use it).
const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
const size = qr.modules.size, data = qr.modules.data;
const QUIET = 4;
const lightTerminal = args.includes("--light");
const line = (y) => {
  let out = "";
  for (let x = -QUIET; x < size + QUIET; x++) {
    const dark = x >= 0 && x < size && y >= 0 && y < size && !!data[y * size + x];
    // on a dark terminal the printed block is the light module
    out += dark === lightTerminal ? "██" : "  ";
  }
  return out;
};
const rows = [];
for (let y = -QUIET; y < size + QUIET; y++) rows.push(line(y));

await QRCode.toFile(".qr.png", url, { errorCorrectionLevel: "M", margin: 4, width: 512 });

console.log();
console.log(rows.join("\n"));
console.log();
console.log(`  (blocks are the light modules, for a dark terminal — pass --light to flip;`);
console.log(`   .qr.png next to this repo is the same code as an image)`);
console.log();
console.log(`  ${url}`);
console.log();
console.log(`  dev build     ${base}/            (what the watcher rebuilds)`);
console.log(`  packed build  ${base}/bundle.html (the single file that ships)`);
if (nics.length > 1) {
  console.log(`\n  other addresses on this machine:`);
  for (const n of nics.slice(1)) console.log(`    ${n.address.padEnd(16)} ${n.name}`);
}
console.log(`\n  The phone has to be on the same network, and Windows Firewall
  will ask to allow Node the first time — private networks is enough.`);
