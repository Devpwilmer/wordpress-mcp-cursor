# WordPress MCP for Cursor

## Ruta del proyecto

Clona este repositorio en la carpeta que prefieras. En la configuración de Cursor debes usar la **ruta absoluta** a `index.js` en tu máquina (sustituye por tu ruta real).

Ejemplo genérico:

`/ruta/donde/clonaste/este-repositorio`

## Ejecución local

```bash
npm start
```

## Fragmento de configuración MCP en Cursor

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/ruta/donde/clonaste/este-repositorio/index.js"],
      "env": {
        "WP_BASE_URL": "https://your-site.com",
        "WP_USERNAME": "your-wp-user",
        "WP_APP_PASSWORD": "your-app-password"
      }
    }
  }
}
```

Opcional para scripts de limpieza (host de tu sitio, sin `https://`):

```env
WP_SITE_HOST=your-site.com
```

## Herramientas disponibles

- `list_posts` (opcional `per_page`)
- `create_post` (`title`, `content`, opcional `status`)
- `delete_post` (`id`, opcional `force`)
- `gsc_top_pages` (`start_date`, `end_date`, opcional `row_limit`)
- `gsc_top_queries` (`start_date`, `end_date`, opcional `row_limit`, opcional `page`)

## Google Search Console

Añade en `.env`:

- `GSC_SITE_URL=sc-domain:example.com` (o la URL completa de la propiedad en Search Console)
- Opción A (cuenta de servicio): `GSC_SERVICE_ACCOUNT_JSON=<JSON en una línea>`
- Opción B (OAuth): `GSC_OAUTH_CLIENT_ID`, `GSC_OAUTH_CLIENT_SECRET`, `GSC_OAUTH_REFRESH_TOKEN`

Crea en Google Cloud una cuenta de servicio con la API de Search Console habilitada, u OAuth según el modo que uses. En modo servicio, comparte la propiedad de Search Console con el email de la cuenta de servicio. En modo OAuth, usa un refresh token con alcance `https://www.googleapis.com/auth/webmasters.readonly`.

## Caso práctico (español)

- [`WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md`](WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md) — resumen del incidente (sin dominios concretos), qué se encontró a nivel técnico y **flujo paso a paso** con scripts Cursor + MCP.
