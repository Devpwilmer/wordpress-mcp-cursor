import "dotenv/config";

const BASE = (process.env.WP_BASE_URL || "").replace(/\/$/, "");
const r = await fetch(`${BASE}/?cb=${Date.now()}`);
const t = await r.text();
const i = t.indexOf("babu88");
console.log("idx", i);
if (i >= 0) {
  console.log(t.slice(Math.max(0, i - 400), i + 250));
}
