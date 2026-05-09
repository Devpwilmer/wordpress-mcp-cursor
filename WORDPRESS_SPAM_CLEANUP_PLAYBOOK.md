# WordPress MCP + Cursor: caso práctico — limpieza de enlaces spam

Guía en español que documenta un flujo real para detectar, mapear y eliminar enlaces inyectados (apuestas/casino) en WordPress, incluyendo páginas hechas con Elementor.

---

## Resumen del caso (qué se encontró)

En un sitio de podología (Lima, Perú) aparecieron **enlaces externos no deseados** mezclados con el contenido legítimo, en concreto:

- **Dónde:** en la **página de inicio** y en varias **landing por distrito** (por ejemplo Barranco, Chorrillos, Comas, Ate Vitarte, Ancón), a menudo **junto a listas** del tipo «Podólogo en …».
- **Qué tipo de enlaces:** dominios de apuestas/casino (ej. `babu88-app.com`, `mostbet`, `pinup-casino`, `casino-my-empire`, y muchos similares).
- **Técnica habitual:** un **`<div>` oculto** con estilos tipo `overflow:hidden`, `height:1px`, `position:absolute` y `left:-NNNNpx` (**cloaking**), que contenía un `<a href="…">` hacia esos sitios.
- **Por qué costaba limpiarlo solo con el editor:**
  - Mucho contenido venía de **Elementor**, guardado en la meta **`_elementor_data`** (JSON), no solo en el campo clásico del post.
  - A veces el **HTML público** seguía mostrando spam mientras la **API REST** ya no reflejaba la misma cadena en meta, o al revés: había **divergencia** entre lo que ve el visitante y lo que devuelve `wp-json` (caché, regeneración de Elementor, o datos en base de datos).
- **Resultado tras el playbook:** escaneo sin hallazgos en listas de sospechosos (`homepage_suspicious`, páginas y entradas vacías) y ausencia de cadenas conocidas en la home pública tras purgar/actualizar contenido y meta.

Este repositorio incluye scripts Node.js para **repetir** ese diagnóstico y la limpieza de forma automatizada donde la API lo permita.

---

## 1) Objetivo

Detectar enlaces sospechosos en:

- El **HTML público** de la portada.
- El contenido de **entradas y páginas** vía **REST API** de WordPress.

Eliminar esos enlaces de forma controlada y **volver a validar** hasta confirmar que el sitio está limpio.

---

## 2) Requisitos

- Node.js 18+ (probado con Node 22).
- **Contraseña de aplicación** de WordPress con permisos de edición.
- Archivo `.env` (no subirlo a Git):

```env
WP_BASE_URL=https://tu-sitio.com
WP_USERNAME=tu-usuario-wp
WP_APP_PASSWORD=tu-contraseña-de-aplicacion
```

Instalación:

```bash
npm install
npm install cheerio
```

---

## 3) Scripts incluidos

| Script | Función |
|--------|---------|
| `scan-malicious-links.mjs` | Escanea la home + entradas/páginas y lista `href` externos sospechosos. |
| `strip-spam-links-pages.mjs` | Quita anclas spam y bloques cloaking típicos del contenido de páginas. |
| `elementor-strip-spam.mjs` | Limpia patrones spam dentro del JSON de Elementor (`_elementor_data`). |
| `strip-rendered-to-post-content.mjs` | Limpia a partir del HTML **renderizado** y actualiza el contenido del post. |
| `detect-elementor-rest-divergence.mjs` | Comprueba si la **home pública** tiene spam pero la meta vía REST **no** muestra las mismas cadenas. |

---

## 4) Flujo paso a paso

### A) Línea base (mapear el problema)

```bash
node scan-malicious-links.mjs
```

Revisa en el JSON de salida:

- `homepage_suspicious`
- `posts_with_spam_links`
- `pages_with_spam_links`

### B) Primera pasada sobre el contenido de páginas

```bash
node strip-spam-links-pages.mjs
```

Elimina enlaces conocidos como spam y `div` de cloaking con el patrón habitual.

### C) Limpiar meta de Elementor

Si la portada o páginas Elementor siguen mostrando spam:

```bash
node elementor-strip-spam.mjs
```

Motivo: Elementor suele pintar desde `_elementor_data`, no solo desde `post_content`.

### D) Respaldo: limpiar según HTML renderizado

```bash
node strip-rendered-to-post-content.mjs
```

Útil cuando el **renderizado** aún incluye bloques inyectados que no coinciden con lo que esperas en `raw`.

### E) Validar de nuevo

```bash
node scan-malicious-links.mjs
```

Comprobación opcional en la home:

```bash
node --input-type=module -e "import 'dotenv/config'; const BASE=(process.env.WP_BASE_URL||'').replace(/\/$/,''); const r=await fetch(BASE+'/?cb='+Date.now(), {headers:{'Cache-Control':'no-cache'}}); const t=await r.text(); console.log('babu88-app.com:', t.includes('babu88-app.com'));"
```

Estado limpio esperado:

- `homepage_suspicious: []`
- `posts_with_spam_links: []`
- `pages_with_spam_links: []`

---

## 5) Si el spam sigue visible

```bash
node detect-elementor-rest-divergence.mjs
```

Si la home está infectada pero la meta REST parece limpia, suele deberse a:

- Caché de página, servidor o CDN no purgada.
- Datos en base de datos distintos de lo que expone la REST en lectura.
- Inyección en filtros de `the_content` o código/plugin comprometido.

Pasos siguientes:

1. Purgar todas las capas de caché (plugin, servidor, CDN, object cache).
2. Regenerar datos/archivos de Elementor.
3. Buscar en base de datos indicadores (`babu88`, `casino-my-empire`, etc.).
4. Auditar plugins, `mu-plugins` y el tema.

---

## 6) Seguridad y publicación

- No commitear `.env`.
- No publicar credenciales reales de WordPress ni tokens de Search Console.
- Usar placeholders en documentación.
- Mantener `.gitignore` con al menos:

```gitignore
.env
node_modules/
```

---

## 7) Estructura sugerida del repositorio

- `README.md` — configuración y uso del MCP.
- `WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md` — este caso práctico (español).
- Scripts `*.mjs` — escaneo, remediación y validación.

Así el repo sirve como plantilla reproducible de respuesta ante incidentes con WordPress + Cursor + MCP.
