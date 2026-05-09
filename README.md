# WordPress MCP for Cursor

Servidor MCP que expone herramientas contra la **REST API de WordPress** (`list_posts`, `create_post`, `delete_post`). Incluye además un **caso práctico** para compartir ([playbook en español](WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md)) sobre limpieza de contenido inyectado; los scripts de limpieza son opcionales y se ejecutan aparte con Node.

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

## Caso práctico (español)

[`WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md`](WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md) — resumen del incidente (sin dominios concretos), qué se encontró a nivel técnico y **flujo paso a paso** con scripts Cursor + MCP.

**Resumen conciso del caso de estudio**

- Se detectó una inyección de enlaces no deseados en páginas públicas de WordPress (tipo SEO spam).
- El análisis mostró contenido malicioso mezclado con bloques legítimos y, en algunos casos, persistencia en datos de constructor visual.
- Se aplicó limpieza por API (contenido + metadatos del constructor), validación iterativa y purga de caché.
- Resultado final: sin indicadores del incidente en los escaneos de validación y con flujo documentado para replicar la respuesta.
