import { readFileSync, writeFileSync } from "fs";
const [id, quote] = [process.argv[2], process.argv[3]];
let s = readFileSync("src/elements.ts", "utf8");
const start = s.indexOf('{ id:"' + id + '"');
if (start < 0) { console.error("miss " + id); process.exit(1); }
const qi = s.indexOf('q:"', start);
let j = qi + 3;
while (s[j] !== '"' || s[j - 1] === "\\") j++;
console.log(id + "  was: " + JSON.stringify(s.slice(qi + 3, j)));
s = s.slice(0, qi + 3) + quote + s.slice(j);
writeFileSync("src/elements.ts", s);
console.log(id + "  now: " + JSON.stringify(quote));
