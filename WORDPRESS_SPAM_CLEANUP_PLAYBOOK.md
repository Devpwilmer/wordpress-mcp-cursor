# WordPress MCP + Cursor: Practical Spam Cleanup Playbook

This guide documents a real, practical workflow to detect, map, and remove injected spam links (casino/betting URLs) from a WordPress site, including Elementor-based pages.

## 1) Goal

Detect suspicious links in:
- Public homepage HTML
- WordPress posts/pages content via REST API

Then remove those links safely and validate the site is clean.

## 2) Prerequisites

- Node.js 18+ (tested on Node 22)
- WordPress Application Password with edit permissions
- `.env` configured (do not commit secrets):

```env
WP_BASE_URL=https://your-site.com
WP_USERNAME=your-wp-user
WP_APP_PASSWORD=your-app-password
```

Install dependencies:

```bash
npm install
npm install cheerio
```

## 3) Scripts Used

- `scan-malicious-links.mjs`
  - Scans homepage + posts/pages for suspicious external links.
- `strip-spam-links-pages.mjs`
  - Removes spam anchors from page content.
- `elementor-strip-spam.mjs`
  - Cleans spam patterns inside Elementor meta (`_elementor_data`).
- `strip-rendered-to-post-content.mjs`
  - Cleans based on rendered HTML and patches post content.
- `detect-elementor-rest-divergence.mjs`
  - Detects mismatch: public homepage has spam but REST meta looks clean.

## 4) Step-by-Step Workflow

### Step A: Baseline scan (map the problem)

```bash
node scan-malicious-links.mjs
```

Review:
- `homepage_suspicious`
- `posts_with_spam_links`
- `pages_with_spam_links`

This gives the initial map of infected URLs/pages.

### Step B: First cleanup pass on page content

```bash
node strip-spam-links-pages.mjs
```

This removes known spam links and hidden cloaking blocks from page HTML.

### Step C: Clean Elementor meta data

If homepage or Elementor pages still show spam:

```bash
node elementor-strip-spam.mjs
```

Why: Elementor often renders from `_elementor_data`, not only `post_content`.

### Step D: Cleanup rendered HTML fallback

```bash
node strip-rendered-to-post-content.mjs
```

This catches cases where rendered output still contains injected blocks.

### Step E: Validate and confirm

```bash
node scan-malicious-links.mjs
```

Optional direct homepage checks:

```bash
node --input-type=module -e "import 'dotenv/config'; const BASE=(process.env.WP_BASE_URL||'').replace(/\/$/,''); const r=await fetch(BASE+'/?cb='+Date.now(), {headers:{'Cache-Control':'no-cache'}}); const t=await r.text(); console.log('babu88-app.com:', t.includes('babu88-app.com'));"
```

Expected clean state:
- `homepage_suspicious: []`
- `posts_with_spam_links: []`
- `pages_with_spam_links: []`

## 5) If Spam Still Appears

Run:

```bash
node detect-elementor-rest-divergence.mjs
```

If homepage is infected but REST meta is clean, likely causes:
- Page/CDN cache not purged
- Different data source in DB/plugin than REST output
- Runtime injection in `the_content` filters or compromised plugin/theme code

Next actions:
1. Purge all cache layers (plugin cache, server cache, CDN cache, object cache).
2. Regenerate Elementor data/files.
3. Search DB for known indicators (for example `babu88`, `casino-my-empire`).
4. Audit plugins, `mu-plugins`, and theme custom code for malicious injections.

## 6) Security and Publishing Notes

- Never commit `.env`.
- Never publish real WordPress credentials or GSC tokens.
- Replace domain/user/password values with placeholders in docs.
- Add/update `.gitignore` before pushing.

Recommended `.gitignore` entries:

```gitignore
.env
node_modules/
```

## 7) Suggested GitHub Repo Structure

- `README.md` - setup and MCP usage
- `WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md` - this practical incident guide
- `*.mjs` scripts for scan/remediation/validation

This makes the repository useful as a reproducible incident response template for WordPress + Cursor MCP workflows.
