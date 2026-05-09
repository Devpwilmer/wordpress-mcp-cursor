import "dotenv/config";

const BASE = (process.env.WP_BASE_URL || "").replace(/\/$/, "");
const auth =
  "Basic " +
  Buffer.from(
    `${process.env.WP_USERNAME || ""}:${process.env.WP_APP_PASSWORD || ""}`
  ).toString("base64");

const r = await fetch(
  `${BASE}/wp-json/wp/v2/pages/1407?context=edit&_fields=meta`,
  { headers: { Authorization: auth } }
);
const t = await r.text();
console.log("10434 in meta body", t.includes("10434"));
console.log("babu88 literal", t.includes("babu88"));
console.log("babu fragment escaped", /babu\\u/.test(t));

const j = JSON.parse(t);
const ed = j.meta._elementor_data || "";
const parsed = JSON.parse(ed);
const dump = JSON.stringify(parsed);
console.log("after JSON roundtrip babu88", dump.includes("babu88"));
console.log("after JSON roundtrip 10434", dump.includes("10434"));
