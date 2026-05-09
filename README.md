WordPress MCP for Cursor

Project path:
- `C:/Users/Usuario/Documents/MCP AQUI`

Run locally:
- `npm start`

Cursor MCP config snippet:

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["C:/Users/Usuario/Documents/MCP AQUI/index.js"],
      "env": {
        "WP_BASE_URL": "https://your-site.com",
        "WP_USERNAME": "your-wp-user",
        "WP_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

Available tools:
- `list_posts` (optional `per_page`)
- `create_post` (`title`, `content`, optional `status`)
- `delete_post` (`id`, optional `force`)
- `gsc_top_pages` (`start_date`, `end_date`, optional `row_limit`)
- `gsc_top_queries` (`start_date`, `end_date`, optional `row_limit`, optional `page`)

Google Search Console setup:
- Add to `.env`:
  - `GSC_SITE_URL=sc-domain:chancayhoy.com` (or your full property URL)
  - Option A (service account): `GSC_SERVICE_ACCOUNT_JSON=<one-line JSON>`
  - Option B (OAuth user): `GSC_OAUTH_CLIENT_ID`, `GSC_OAUTH_CLIENT_SECRET`, `GSC_OAUTH_REFRESH_TOKEN`
- Create a Google Cloud service account with Search Console API enabled, or create OAuth credentials.
- For service account mode, share your Search Console property with the service account email as `Owner` or `Full user`.
- For OAuth mode, use OAuth Playground to generate a refresh token with scope `https://www.googleapis.com/auth/webmasters.readonly`.

Practical case study:
- `WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md` - end-to-end workflow to detect, map, and remove injected spam links from WordPress/Elementor pages using Cursor + MCP scripts.
