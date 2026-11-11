# Programación del blog Silhouette

Los artículos aprobados se guardan en `scheduled/` como archivos JSON. Cada artículo indica `publishAtMexico` en la zona `America/Mexico_City` y su instante UTC equivalente. El flujo de GitHub Actions revisa las fechas cada cinco minutos. Cuando vence una fecha, genera una página HTML, la agrega al blog y actualiza `sitemap.xml`.

Para cargar varios artículos, prepara un JSON con un arreglo de objetos que tengan `slug`, `title`, `excerpt`, `content` (HTML), `image` (HTTPS), `publishAtMexico` (`AAAA-MM-DDTHH:mm:ss`), `seoTitle` y `seoDescription`. Después ejecuta:

```sh
node scripts/import-silhouette-blog-batch.mjs ruta/al/lote.json
node scripts/publish-silhouette-blog.mjs --dry-run
```

El importador convierte la hora de Ciudad de México a UTC y rechaza fechas ambiguas o imposibles. La cola se confirma en el repositorio con una revisión normal. No se cargan borradores privados a GitHub: el repositorio es público. Para editar un artículo ya cargado, corrige su JSON antes de la hora programada.

La hora de publicación es el objetivo. GitHub Actions puede retrasar una ejecución programada; por eso el flujo se repite cada cinco minutos y ofrece ejecución manual como recuperación. La página estática y el sitemap aparecen cuando el flujo de publicación termina correctamente.

## Artículos con video

El lote de 30 artículos ya existe en `scheduled/`. Sus fechas originales van del 10 de noviembre al 9 de diciembre de 2026, a las 20:00 de Ciudad de México. Añade el video al JSON existente de cada artículo a medida que quede aprobado. Conserva el slug, las fechas, el texto, la portada y los campos SEO del artículo. Empieza por `de-1964-a-hoy-la-evolucion-del-diseno-silhouette.json`.

Guarda el original de cada video junto a su vista previa local. Distingue entre revisión, aprobación y publicación. Para el primer artículo se preparó un MP4 optimizado en una ruta pública de Roraima, con su portada y subtítulos. Para los siguientes lotes, usa almacenamiento de medios fuera del paquete de GitHub Pages para no aumentar el peso de cada despliegue.

Tras la aprobación, añade al JSON del artículo el campo `video` con sus enlaces HTTPS finales. El sitio añade el reproductor a partir de estos datos. Si el artículo ya está en línea, registra en `uploadDate` cuándo se publica el video por primera vez, en UTC. Para un estreno simultáneo puede omitirse y se usará la fecha del artículo.

```json
{
  "video": {
    "title": "Título del video",
    "description": "Qué explica el video",
    "durationSeconds": 150,
    "url": "https://example.invalid/video.mp4",
    "posterUrl": "https://example.invalid/poster.jpg",
    "captionsUrl": "https://example.invalid/es-MX.vtt"
  }
}
```

Guarda el registro de fuentes y créditos junto a la edición. Exporta el MP4 horizontal de 120 a 180 segundos y revisa los subtítulos VTT en español de México. Antes de integrar un video aprobado, comprueba que los enlaces permanentes se puedan abrir sin sesión, que el MP4 permita avanzar en el reproductor y que el VTT se cargue desde `roraimamx.com`. Si el alojamiento no ofrece un enlace compatible, resuelve el formato de inserción antes de editar el artículo.

GitHub Actions mantiene el calendario existente. Tras un despliegue, comprueba el reproductor en móvil y escritorio, el índice y el sitemap. Para recuperar un fallo, comprueba primero si ya hay una ejecución activa.

## SEO editorial

Para cada artículo, escribe un título y una descripción propios, responde pronto a la pregunta principal y documenta las afirmaciones con fuentes verificables. Usa encabezados descriptivos, enlaces a artículos relacionados y llamadas al catálogo donde ayuden al lector. Incluye texto alternativo y créditos de las imágenes. Si el artículo lleva video, revisa sus subtítulos y ofrece una transcripción en el HTML. Esto facilita que las personas y los buscadores, incluidas las funciones de búsqueda con IA, encuentren y entiendan el contenido. La publicación no garantiza una posición ni la inclusión en una respuesta de IA.
