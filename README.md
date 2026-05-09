# WordPress MCP for Cursor

Servidor **MCP** (Model Context Protocol) que conecta **Cursor** con la **REST API de WordPress**. Permite al asistente listar, crear y borrar entradas mediante herramientas estándar del protocolo. Opcionalmente expone lectura de **Google Search Console** (top páginas y consultas) si configuras las variables `GSC_*` en `.env`.

**Caso de estudio** (playbook + scripts de limpieza de inyección / SEO spam): [github.com/Devpwilmer/caso-estudio-wordpress-mcp-cursor](https://github.com/Devpwilmer/caso-estudio-wordpress-mcp-cursor)

## Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- Un sitio **WordPress** con la REST API accesible
- Usuario con permisos sobre entradas
- **Contraseña de aplicación**: en WordPress, *Usuarios → Tu perfil → Contraseñas de aplicación*

## Instalación

```bash
git clone https://github.com/Devpwilmer/wordpress-mcp-cursor.git
cd wordpress-mcp-cursor
npm install
cp .env.example .env
```

Edita `.env` con la URL de tu sitio (sin barra final), usuario y contraseña de aplicación. Para GSC, añade `GSC_SITE_URL` y autenticación OAuth de usuario o JSON de cuenta de servicio con acceso a la propiedad (ver `.env.example`).

## Uso en Cursor

1. Abre la configuración de **MCP** en Cursor.
2. Añade un servidor que ejecute este proyecto con **Node** y las variables de entorno (o que cargue un `.env` si tu entorno lo permite).

Ejemplo de fragmento (sustituye la ruta por la **absoluta** a `index.js` en tu máquina):

```json
{
  "mcpServers": {
    "wordpress": {
      "command": "node",
      "args": ["/ruta/absoluta/al/clon/index.js"],
      "env": {
        "WP_BASE_URL": "https://tu-sitio.com",
        "WP_USERNAME": "tu_usuario",
        "WP_APP_PASSWORD": "tu-contraseña-de-aplicacion"
      }
    }
  }
}
```

Si Cursor arranca el proceso sin leer `.env`, define las tres variables en `env` como arriba.

## Ejecución manual (pruebas)

```bash
npm start
```

El servidor habla por **stdio** (salida estándar), igual que cuando Cursor lo lanza.

## Herramientas expuestas

| Herramienta     | Descripción |
|----------------|-------------|
| `list_posts`   | Lista entradas recientes. Opcional: `per_page` (número). |
| `create_post`  | Crea una entrada: `title`, `content`, opcional `status` (`draft` o `publish`). |
| `delete_post`  | Borra o envía a la papelera: `id`, opcional `force` (boolean). |
| `gsc_top_pages` | Top URLs desde Search Console: `start_date`, `end_date` (YYYY-MM-DD), opcional `row_limit`. Requiere `GSC_*`. |
| `gsc_top_queries` | Top consultas: mismos campos; opcional `page` para filtrar por URL. Requiere `GSC_*`. |

## WordPress

Las llamadas van a `WP_BASE_URL/wp-json/wp/v2/` con autenticación **Basic** (usuario + contraseña de aplicación). Asegúrate de que no haya plugins o reglas que bloqueen la REST API para tu usuario.

## Estructura del repositorio

- `index.js` — implementación del servidor MCP
- `package.json` — dependencias y script `start`
- `.env.example` — plantilla de variables (copiar a `.env`)
