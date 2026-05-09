import "dotenv/config";

const BASE = (process.env.WP_BASE_URL || "").replace(/\/$/, "");
const auth =
  "Basic " +
  Buffer.from(
    `${process.env.WP_USERNAME || ""}:${process.env.WP_APP_PASSWORD || ""}`
  ).toString("base64");

const home = await fetch(`${BASE}/?cb=${Date.now()}`, {
  headers: { "Cache-Control": "no-cache" }
}).then((r) => r.text());

const api = await fetch(`${BASE}/wp-json/wp/v2/pages/1407?context=edit`, {
  headers: { Authorization: auth }
}).then((r) => r.json());

const raw = api.content.raw || "";
const marker = "El Agustino</li>";

const hi = home.indexOf(marker);
const ai = raw.indexOf(marker);

console.log("home idx", hi, "has babu88 after marker", hi >= 0 && home.slice(hi, hi + 500).includes("babu88"));
console.log("api raw idx", ai, "has babu88 after marker", ai >= 0 && raw.slice(ai, ai + 500).includes("babu88"));

if (hi >= 0) console.log("HOME snippet:\n", home.slice(hi, hi + 450));
if (ai >= 0) console.log("RAW snippet:\n", raw.slice(ai, ai + 450));
