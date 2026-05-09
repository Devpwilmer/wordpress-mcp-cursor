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

const r = await fetch(`${BASE}/wp-json/wp/v2/pages/1407?context=edit&_fields=meta`, {
  headers: { Authorization: auth }
});
const j = await r.json();
const ed = j.meta._elementor_data || "";

const checks = [
  ["babu88", /babu88/i],
  ["left:-10434", /left:\s*-10434/],
  ["casino-my-empire", /casino-my-empire/i]
];

const report = { homepage: {}, rest_meta: {} };
for (const [name, re] of checks) {
  report.homepage[name] = re.test(home);
  report.rest_meta[name] = re.test(ed);
}

console.log(JSON.stringify(report, null, 2));

if (report.homepage.babu88 && !report.rest_meta.babu88) {
  console.error(
    "\n>>> DIVERGENCIA: el HTML público contiene spam que NO aparece en meta._elementor_data vía REST.\n" +
      "    Suele indicar: (1) caché de página/CDN, (2) meta en BD distinta a lo expuesto en REST, (3) inyección en the_content.\n" +
      "    Siguiente paso: purgar caché del servidor, o buscar en BD/plugin la cadena exacta.\n"
  );
}
