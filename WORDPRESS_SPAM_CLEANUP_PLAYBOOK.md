# WordPress MCP + Cursor: caso práctico — limpieza de enlaces spam

Guía en español para detectar, mapear y eliminar enlaces inyectados (típicamente apuestas u ofertas no deseadas) en WordPress, incluyendo páginas construidas con Elementor. **No incluye dominios reales:** adapta URLs y marcadores a tu propio incidente.

---

## Resumen del caso de ataque (incidente tipo hack / SEO spam)

**Tipo de amenaza:** inyección de contenido malicioso orientada a **SEO negativo o spam de enlaces**. No implica necesariamente control total del servidor (shell), pero sí **alteración persistente** de páginas en WordPress.

**Vector habitual (hipótesis de trabajo):** credenciales filtradas, plugin o tema desactualizado, acceso de un colaborador comprometido, o alojamiento compartido con otro sitio vulnerable. El atacante suele usar el **panel o la API** para insertar HTML en páginas ya publicadas.

**Modus operandi:** enlaces hacia sitios de terceros (apuestas, afiliación, etc.) **camuflados** dentro del contenido real —a veces en listas o pies de bloque— y con técnicas de **ocultación visual** (por ejemplo `div` con posición fuera de pantalla o altura mínima) para que el enlace siga existiendo en el HTML que indexan los buscadores.

**Impacto:** daño a la **reputación** del sitio, riesgo de **sanciones algorítmicas**, tiempo de respuesta del equipo y, si no se audita a fondo, **reincidencia** si queda backdoor o credenciales sin rotar.

**Respuesta recomendada (alto nivel):** respaldo antes de cambios, inventario de páginas afectadas, limpieza de `post_content` y de meta de constructores (p. ej. Elementor), **purgado de caché**, rotación de contraseñas y contraseñas de aplicación, revisión de usuarios y plugins, y **validación** repetida del HTML público hasta que no queden patrones del incidente.

**Qué aporta este repo:** un **MCP** que habla con WordPress por REST y **scripts** para escanear y limpiar de forma repetible; sirve para documentar el caso y compartir el método, no sustituye forense completo ni hardening del hosting.

---

## Hallazgos técnicos (qué se vio en el sitio)

En un **sitio WordPress de un cliente** aparecieron **enlaces externos no deseados** mezclados con contenido legítimo:

- **Dónde:** principalmente en la **página de inicio** y en **landings** con listados de servicios o ubicaciones; el spam solía colarse **entre ítems de listas** (`<ul>` / `<li>`).
- **Qué tipo de enlaces:** dominios de **apuestas, casinos o afiliación** (patrones repetidos en campañas de SEO negativo).
- **Técnica habitual:** un **`<div>` oculto** con estilos tipo `overflow:hidden`, `height:1px`, `position:absolute` y `left:-NNNNpx` (**cloaking**), con un `<a href="…">` hacia sitios externos.
- **Por qué no bastaba solo el editor clásico:**
  - Mucho contenido provenía de **Elementor**, almacenado en la meta **`_elementor_data`** (JSON), no solo en el campo de contenido del post.
  - A veces el **HTML público** seguía mostrando basura mientras la **REST API** no reflejaba las mismas cadenas en meta (o al revés): **divergencia** por caché, datos en base de datos o regeneración de Elementor.
- **Resultado tras el flujo:** escaneo sin entradas en listas de sospechosos (`homepage_suspicious`, páginas y entradas vacías) y comprobación manual/HTML sin marcadores del incidente, tras purgar caché y actualizar contenido o meta según corresponda.

Los scripts de este repo automatizan el diagnóstico y la limpieza **donde la API lo permita**. No sustituyen revisar el servidor, plugins ni la base de datos si hay persistencia o inyección a nivel de tema/plugin.

Las heurísticas de detección en código incluyen patrones típicos de spam; si tu política es no versionar listas concretas, mantenlas en un archivo local ignorado o simplifica las expresiones regulares.

---

## 1) Objetivo

- Detectar enlaces sospechosos en el **HTML público** de la portada y en **entradas/páginas** vía REST.
- Eliminarlos de forma controlada y **volver a validar** hasta confirmar que el sitio está limpio.

---

## 2) Requisitos

- Node.js 18+.
- Contraseña de aplicación de WordPress con permisos de edición.
- `.env` (no subirlo a Git):

```env
WP_BASE_URL=https://tu-sitio.com
WP_USERNAME=tu-usuario-wp
WP_APP_PASSWORD=tu-contraseña-de-aplicacion
# Opcional: host de tu sitio para no marcar tus propios enlaces como spam
WP_SITE_HOST=tu-sitio.com
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
| `strip-rendered-to-post-content.mjs` | Limpia a partir del HTML renderizado y actualiza el contenido del post. |
| `detect-elementor-rest-divergence.mjs` | Compara home pública con meta Elementor vía REST (IDs de página vía API de ajustes). |

---

## 4) Flujo paso a paso

### Paso A — Línea base (mapear el problema)

```bash
node scan-malicious-links.mjs
```

Revisa en la salida JSON:

- `homepage_suspicious`
- `posts_with_spam_links`
- `pages_with_spam_links`

### Paso B — Primera pasada sobre páginas

```bash
node strip-spam-links-pages.mjs
```

Quita enlaces que coincidan con las heurísticas del script y `div` de cloaking habituales.

### Paso C — Meta de Elementor

Si la portada o páginas Elementor siguen mostrando spam:

```bash
node elementor-strip-spam.mjs
```

### Paso D — Respaldo: HTML renderizado

```bash
node strip-rendered-to-post-content.mjs
```

Útil cuando el renderizado aún incluye bloques que no ves en `raw`.

### Paso E — Validar de nuevo

```bash
node scan-malicious-links.mjs
```

Comprobación opcional en la home (sustituye `TU_MARCADOR` por una cadena **no sensible** que hayas visto solo en el spam de tu caso, o usa una palabra genérica como `casino` con cuidado de falsos positivos):

```bash
node --input-type=module -e "import 'dotenv/config'; const BASE=(process.env.WP_BASE_URL||'').replace(/\/$/,''); const M=process.env.SPAM_PROBE||'casino'; const r=await fetch(BASE+'/?cb='+Date.now(), {headers:{'Cache-Control':'no-cache'}}); const t=await r.text(); console.log('probe', M, ':', t.toLowerCase().includes(M.toLowerCase()));"
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

Opcional en `.env`, subcadenas separadas por comas para comparar home vs meta (por defecto se usan comprobaciones genéricas):

```env
SPAM_PROBE_SUBSTRINGS=casino,left:-9999
```

Si la home está infectada pero la meta REST parece limpia:

1. Purgar caché (plugin, servidor, CDN, object cache).
2. Regenerar datos/archivos de Elementor.
3. Buscar en base de datos cadenas que hayas identificado en tu incidente (sin publicarlas en el repo).
4. Auditar plugins, `mu-plugins` y el tema.

---

## 6) Seguridad y publicación

- No commitear `.env`.
- No publicar credenciales ni tokens.
- No pegar dominios reales del cliente en issues ni en documentación pública.

```gitignore
.env
node_modules/
```

---

## 7) Estructura sugerida del repositorio

- `README.md` — MCP y configuración.
- `WORDPRESS_SPAM_CLEANUP_PLAYBOOK.md` — este caso práctico.
- Scripts `*.mjs` — escaneo, remediación y validación.
