import "dotenv/config";

const BASE = (process.env.WP_BASE_URL || "").replace(/\/$/, "");
const uas = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
];

for (const ua of uas) {
  const r = await fetch(`${BASE}/?t=${Date.now()}`, {
    headers: { "User-Agent": ua, "Cache-Control": "no-cache" }
  });
  const t = await r.text();
  console.log(ua.slice(0, 50), "babu88", t.includes("babu88"));
}
